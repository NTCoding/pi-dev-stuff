import type { ProfileCatalogEntry } from '../profiles/profile-catalog'
import { ProfileLauncherArgumentsError } from '../profiles/profile-errors'

export type ProfileLauncherRequest =
  | Readonly<{ kind: 'help' }>
  | Readonly<{ kind: 'list' }>
  | Readonly<{ kind: 'launch'; profileName: string | undefined; piArguments: readonly string[] }>

export function parseProfileLauncherArguments(
  argumentsList: readonly string[],
): ProfileLauncherRequest {
  const firstArgument = argumentsList.at(0)
  if (firstArgument === '--help' || firstArgument === '-h') {
    return { kind: 'help' }
  }

  if (firstArgument === '--list-profiles') {
    return { kind: 'list' }
  }

  if (firstArgument === '--profile') {
    const profileName = argumentsList.at(1)
    if (profileName) {
      return { kind: 'launch', profileName, piArguments: argumentsList.slice(2) }
    }

    throw new ProfileLauncherArgumentsError('--profile requires a profile name')
  }

  if (firstArgument === '--') {
    return { kind: 'launch', profileName: undefined, piArguments: argumentsList.slice(1) }
  }

  return { kind: 'launch', profileName: undefined, piArguments: argumentsList }
}

export function buildPiArguments(
  catalogEntry: ProfileCatalogEntry,
  userArguments: readonly string[],
): string[] {
  const defaults = catalogEntry.profile.defaults
  const modelArguments = defaults?.model
    ? ['--model', `${defaults.model.provider}/${defaults.model.id}`]
    : []
  const thinkingArguments = defaults?.thinkingLevel ? ['--thinking', defaults.thinkingLevel] : []
  const toolArguments = defaults?.tools ? ['--tools', defaults.tools.join(',')] : []
  return [
    ...modelArguments,
    ...thinkingArguments,
    ...toolArguments,
    '--extension',
    catalogEntry.profileRoot,
    ...userArguments,
  ]
}
