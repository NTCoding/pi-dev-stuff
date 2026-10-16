import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type {
  CustomEntry,
  ExtensionAPI,
  ExtensionContext,
  ExtensionFactory,
  SessionEntry,
} from '@earendil-works/pi-coding-agent'
import { profileSchema } from '../../domain/profile/profile'
import type { ProfileCatalogEntry } from '../profiles/profile-catalog'
import { ProfileChooserError } from '../profiles/profile-errors'
import { installProfileRuntime, readProfileSystemPrompt } from './profile-runtime'
import { z } from 'zod'

const profileChoiceEntryType = 'pi-dev-stuff-profile-choice'

const serializedProfileCatalogSchema = z.array(
  z.object({
    profile: profileSchema,
    profileRoot: z.string().min(1),
  }),
)

function parseJson(output: string): unknown {
  try {
    return JSON.parse(output)
  } catch {
    throw new ProfileChooserError('Catalog process did not produce valid JSON')
  }
}

function parseProfileCatalog(output: string): readonly ProfileCatalogEntry[] {
  const result = serializedProfileCatalogSchema.safeParse(parseJson(output))
  if (!result.success) {
    throw new ProfileChooserError('Catalog process did not produce a valid profile list')
  }

  return result.data
}

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

async function applyProfile(
  pi: ExtensionAPI,
  context: ExtensionContext,
  catalogEntry: ProfileCatalogEntry,
): Promise<void> {
  const defaults = catalogEntry.profile.defaults
  if (defaults?.model) {
    const model = context.modelRegistry.find(defaults.model.provider, defaults.model.id)
    if (!model) {
      throw new ProfileChooserError(
        `Profile "${catalogEntry.profile.name}" requires unknown model ${defaults.model.provider}/${defaults.model.id}`,
      )
    }

    const changed = await pi.setModel(model)
    if (!changed) {
      throw new ProfileChooserError(
        `Unable to switch to model ${defaults.model.provider}/${defaults.model.id} for profile "${catalogEntry.profile.name}"`,
      )
    }
  }

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
    const applyChosenProfile = async (
      context: ExtensionContext,
      catalogEntry: ProfileCatalogEntry,
      recordChoice: boolean,
    ): Promise<void> => {
      if (installed.profileName === catalogEntry.profile.name) {
        return
      }

      await applyProfile(pi, context, catalogEntry)
      if (recordChoice) {
        pi.appendEntry(profileChoiceEntryType, { name: catalogEntry.profile.name })
      }
      installed.profileName = catalogEntry.profile.name
    }

    pi.on('session_start', async (_event, context) => {
      const catalog = await loadProfileCatalogViaExec(
        pi,
        options.repositoryRoot,
        options.profilesDirectory,
      )
      const rememberedEntry = findRememberedProfile(catalog, context.sessionManager.getEntries())
      if (rememberedEntry) {
        await applyChosenProfile(context, rememberedEntry, false)
        return
      }

      const selected = await selectProfile(context, catalog)
      if (selected) {
        await applyChosenProfile(context, selected, true)
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
        await applyChosenProfile(context, selected, true)
        if (switching) {
          context.ui.notify(
            `Profile switched to "${selected.profile.name}". Skill, prompt, and theme paths from the new profile apply from the next session.`,
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
