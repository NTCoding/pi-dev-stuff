import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import {
  buildPiArguments,
  parseProfileLauncherArguments,
  type ProfileLauncherRequest,
} from './profile-launcher-arguments'
import { loadProfileCatalog, type ProfileCatalogEntry } from '../profiles/profile-catalog'
import {
  PiLaunchError,
  ProfileLauncherArgumentsError,
  ProfileNotFoundError,
  ProfileSelectionError,
} from '../profiles/profile-errors'

const helpText = `Usage:
  ./pi-launcher.sh
  ./pi-launcher.sh --profile <name> [pi arguments]
  ./pi-launcher.sh --list-profiles
  ./pi-launcher.sh --help

Without --profile, the launcher asks you to choose a profile.`

function findNamedProfile(
  profileName: string,
  catalog: readonly ProfileCatalogEntry[],
): ProfileCatalogEntry {
  const selectedProfile = catalog.find((entry) => entry.profile.name === profileName)
  if (selectedProfile) {
    return selectedProfile
  }

  throw new ProfileNotFoundError(
    profileName,
    catalog.map((entry) => entry.profile.name),
  )
}

async function selectProfile(
  catalog: readonly ProfileCatalogEntry[],
): Promise<ProfileCatalogEntry> {
  if (stdin.isTTY === true && stdout.isTTY === true) {
    const options = catalog
      .map((entry, index) => `${index + 1}) ${entry.profile.name} — ${entry.profile.description}`)
      .join('\n')
    const terminal = createInterface({ input: stdin, output: stdout })
    try {
      const answer = await terminal.question(`Choose a profile:\n${options}\n> `)
      const selectedProfile = catalog.at(Number.parseInt(answer, 10) - 1)
      if (selectedProfile) {
        return selectedProfile
      }

      throw new ProfileSelectionError(answer)
    } finally {
      terminal.close()
    }
  }

  throw new ProfileLauncherArgumentsError(
    'A profile must be supplied with --profile when input is not interactive',
  )
}

async function resolveSelectedProfile(
  request: Extract<ProfileLauncherRequest, { kind: 'launch' }>,
  catalog: readonly ProfileCatalogEntry[],
): Promise<ProfileCatalogEntry> {
  if (request.profileName) {
    return findNamedProfile(request.profileName, catalog)
  }

  return selectProfile(catalog)
}

function printProfileCatalog(catalog: readonly ProfileCatalogEntry[]): void {
  for (const entry of catalog) {
    console.log(`${entry.profile.name}\t${entry.profile.description}`)
  }
}

function launchPi(
  piExecutable: string,
  catalogEntry: ProfileCatalogEntry,
  userArguments: readonly string[],
): void {
  const argumentsList = buildPiArguments(catalogEntry, userArguments)
  const result = spawnSync(piExecutable, argumentsList, { stdio: 'inherit' })
  if (result.error) {
    throw new PiLaunchError(`Unable to launch Pi: ${result.error.message}`)
  }

  if (result.status === null) {
    throw new PiLaunchError(`Pi ended without an exit status after signal ${result.signal}`)
  }

  process.exitCode = result.status
}

async function runProfileLauncher(): Promise<void> {
  const request = parseProfileLauncherArguments(process.argv.slice(2))
  if (request.kind === 'help') {
    console.log(helpText)
    return
  }

  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
  const piExecutable = resolve(repositoryRoot, 'node_modules/.bin/pi')
  const catalog = await loadProfileCatalog(resolve(repositoryRoot, 'profiles'))
  if (request.kind === 'list') {
    printProfileCatalog(catalog)
    return
  }

  const selectedProfile = await resolveSelectedProfile(request, catalog)
  launchPi(piExecutable, selectedProfile, request.piArguments)
}

function describeFailure(failure: unknown): string {
  if (failure instanceof Error) {
    return failure.message
  }

  return String(failure)
}

try {
  await runProfileLauncher()
} catch (failure) {
  console.error(describeFailure(failure))
  process.exitCode = 1
}
