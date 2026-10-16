import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  CustomEntry,
  ExtensionAPI,
  ExtensionContext,
  ExtensionFactory,
  SessionEntry,
} from '@earendil-works/pi-coding-agent'
import { parseProfileCatalog, type ProfileCatalogEntry } from '../../domain/profile/profile-catalog'
import { buildProfileSystemPrompt } from '../../domain/profile/profile-system-prompt'
import { ProfileChooserError } from './profile-chooser-errors'
import {
  installProfileRuntime,
  buildSkillsPrompt,
  readProfileSystemPrompt,
} from './profile-runtime'

const profileChoiceEntryType = 'pi-dev-stuff-profile-choice'

/**
 * Loads the catalog the same way the launcher does, in a child process via
 * tsx. Importing profile modules from inside Pi's extension runtime is not
 * reliable, so the validated catalog is produced outside and passed as JSON.
 */
async function loadProfileCatalogViaExec(
  pi: ExtensionAPI,
  repositoryRoot: string,
  profilesDirectory: string,
): Promise<readonly ProfileCatalogEntry[]> {
  const catalogScript = join(repositoryRoot, 'platform', 'infra', 'cli', 'profile-catalog-json.ts')
  const tsxExecutable = join(repositoryRoot, 'node_modules', '.bin', 'tsx')
  const result = await pi.exec(tsxExecutable, [catalogScript, profilesDirectory])
  if (result.code !== 0) {
    throw new ProfileChooserError(
      `Unable to load the profile catalog. If dependencies are missing, run "pnpm install" in ${repositoryRoot}. ${result.stderr}`,
    )
  }

  return parseProfileCatalog(result.stdout)
}

export function findRememberedProfileName(entries: readonly SessionEntry[]): string | undefined {
  const chosenNames = entries
    .filter((entry): entry is CustomEntry => entry.type === 'custom')
    .filter((entry) => entry.customType === profileChoiceEntryType)
    .map((entry) => entry.data)
    .filter((data): data is { name: unknown } => typeof data === 'object' && data !== null)
    .map((data) => data.name)
    .filter((name): name is string => typeof name === 'string')
  return chosenNames.at(-1)
}

export function findRememberedProfile(
  catalog: readonly ProfileCatalogEntry[],
  entries: readonly SessionEntry[],
): ProfileCatalogEntry | undefined {
  const rememberedName = findRememberedProfileName(entries)
  return catalog.find((catalogEntry) => catalogEntry.profile.name === rememberedName)
}

export function describeProfile(catalogEntry: ProfileCatalogEntry): string {
  return `${catalogEntry.profile.name} — ${catalogEntry.profile.description}`
}

export function findProfileByLabel(
  catalog: readonly ProfileCatalogEntry[],
  label: string,
): ProfileCatalogEntry | undefined {
  return catalog.find((catalogEntry) => describeProfile(catalogEntry) === label)
}

export function requireInteractiveUi(hasUi: boolean): void {
  if (hasUi !== true) {
    throw new ProfileChooserError(
      'No UI is available to choose a profile. Start Pi interactively or over RPC.',
    )
  }
}

type ProfileSelection = Readonly<{
  ui: ExtensionContext['ui']
  hasUI: boolean
}>

async function selectProfile(
  selection: ProfileSelection,
  catalog: readonly ProfileCatalogEntry[],
): Promise<ProfileCatalogEntry | undefined> {
  requireInteractiveUi(selection.hasUI)
  const labels = catalog.map(describeProfile)
  const selected = await selection.ui.select('Choose a profile:', labels)
  if (selected === undefined) {
    return undefined
  }

  const selectedEntry = findProfileByLabel(catalog, selected)
  if (!selectedEntry) {
    throw new ProfileChooserError(`Unknown profile selection "${selected}"`)
  }

  return selectedEntry
}

function applyProfile(pi: ExtensionAPI, catalogEntry: ProfileCatalogEntry): void {
  const defaults = catalogEntry.profile.defaults
  // The model belongs to the user and the host: Air users pick one before
  // chatting, and terminal users get it from the launcher. Profiles only
  // carry thinking level and tools here.
  if (defaults?.thinkingLevel) {
    pi.setThinkingLevel(defaults.thinkingLevel)
  }

  if (defaults?.tools) {
    pi.setActiveTools([...defaults.tools])
  }

  installProfileRuntime(pi, {
    profile: catalogEntry.profile,
    profileRoot: catalogEntry.profileRoot,
    systemPrompt: readProfileSystemPrompt(catalogEntry.profileRoot),
  })
}

export type ProfileChooserOptions = Readonly<{
  profilesDirectory: string
  repositoryRoot: string
}>

export function defineProfileChooser(options: ProfileChooserOptions): ExtensionFactory {
  return (pi: ExtensionAPI): void => {
    const installed: { profileName: string | undefined } = { profileName: undefined }
    const applyChosenProfile = (
      context: ExtensionContext,
      catalogEntry: ProfileCatalogEntry,
      recordChoice: boolean,
    ): void => {
      if (installed.profileName === catalogEntry.profile.name) {
        return
      }

      applyProfile(pi, catalogEntry)
      if (recordChoice) {
        pi.appendEntry(profileChoiceEntryType, { name: catalogEntry.profile.name })
      }
      installed.profileName = catalogEntry.profile.name
      if (context.mode === 'rpc' && context.hasUI) {
        context.ui.setWidget('profile', [`profile: ${catalogEntry.profile.name}`])
      }
    }

    // TUI can render dialogs during startup binding, so ask immediately.
    // RPC hosts cannot: Pi attaches its stdin reader only after binding
    // extensions, so a startup dialog would deadlock. There the chooser
    // asks at the first agent turn, when the host can answer.
    pi.on('session_start', async (_event, context) => {
      const catalog = await loadProfileCatalogViaExec(
        pi,
        options.repositoryRoot,
        options.profilesDirectory,
      )
      const rememberedEntry = findRememberedProfile(catalog, context.sessionManager.getEntries())
      if (rememberedEntry) {
        applyChosenProfile(context, rememberedEntry, false)
        return
      }

      if (context.mode === 'tui') {
        const selected = await selectProfile(context, catalog)
        if (selected) {
          applyChosenProfile(context, selected, true)
        }
      }
    })

    // RPC path: ask at the first agent turn, when the host can answer.
    pi.on('before_agent_start', async (event, context) => {
      if (installed.profileName !== undefined || context.mode !== 'rpc') {
        return undefined
      }

      const catalog = await loadProfileCatalogViaExec(
        pi,
        options.repositoryRoot,
        options.profilesDirectory,
      )
      const rememberedEntry = findRememberedProfile(catalog, context.sessionManager.getEntries())
      const selected = rememberedEntry ?? (await selectProfile(context, catalog))
      if (!selected) {
        return undefined
      }

      applyChosenProfile(context, selected, rememberedEntry === undefined)
      return {
        systemPrompt: buildProfileSystemPrompt({
          profilePrompt: readProfileSystemPrompt(selected.profileRoot),
          cwd: event.systemPromptOptions.cwd,
          appendSystemPrompt: event.systemPromptOptions.appendSystemPrompt,
          contextFiles: event.systemPromptOptions.contextFiles,
          skillsPrompt: buildSkillsPrompt(event.systemPromptOptions),
        }),
      }
    })

    pi.registerCommand('profile', {
      description: 'Switch the active profile for this session',
      handler: async (_arguments, context) => {
        const catalog = await loadProfileCatalogViaExec(
          pi,
          options.repositoryRoot,
          options.profilesDirectory,
        )
        const selected = await selectProfile(context, catalog)
        if (!selected) {
          return
        }

        const switching = installed.profileName !== selected.profile.name
        applyChosenProfile(context, selected, true)
        if (switching) {
          context.ui.notify(
            `Profile switched to "${selected.profile.name}". The new profile applies from the next message.`,
            'info',
          )
        }
      },
    })
  }
}

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')

export default defineProfileChooser({
  profilesDirectory: resolve(repositoryRoot, 'profiles'),
  repositoryRoot,
})
