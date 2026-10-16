export class NoProfilesFoundError extends Error {
  constructor(profilesDirectory: string) {
    super(`No profiles found in ${profilesDirectory}`)
    this.name = 'NoProfilesFoundError'
  }
}

export class MissingProfileAssetError extends Error {
  constructor(profileName: string, assetPath: string) {
    super(`Profile "${profileName}" requires ${assetPath}`)
    this.name = 'MissingProfileAssetError'
  }
}

export class InvalidProfileModuleError extends Error {
  constructor(profileName: string, reason: string) {
    super(`Profile "${profileName}" is invalid: ${reason}`)
    this.name = 'InvalidProfileModuleError'
  }
}

export class ProfileNotFoundError extends Error {
  constructor(profileName: string, availableNames: readonly string[]) {
    super(`Unknown profile "${profileName}". Available profiles: ${availableNames.join(', ')}`)
    this.name = 'ProfileNotFoundError'
  }
}

export class ProfileSelectionError extends Error {
  constructor(selection: string) {
    super(`Invalid profile selection "${selection}"`)
    this.name = 'ProfileSelectionError'
  }
}

export class ProfileLauncherArgumentsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProfileLauncherArgumentsError'
  }
}

export class PiLaunchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PiLaunchError'
  }
}
