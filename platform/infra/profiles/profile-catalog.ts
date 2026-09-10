import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { builtinModels } from '@earendil-works/pi-ai/providers/all'
import { DefaultResourceLoader } from '@earendil-works/pi-coding-agent'
import { z } from 'zod'
import { profileSchema, type Profile } from '../../domain/profile/profile'
import { findGlobalPromptsDirectory } from '../pi/global-prompts'
import {
  InvalidProfileModuleError,
  MissingProfileAssetError,
  NoProfilesFoundError,
} from './profile-errors'

const piModels = builtinModels()
const profileModuleSchema = z.object({
  default: z.function(),
  profile: profileSchema,
})

export type ProfileCatalogEntry = Readonly<{
  profile: Profile
  profileRoot: string
}>

function requireFile(profileName: string, path: string): void {
  if (existsSync(path) && statSync(path).isFile()) {
    return
  }

  throw new MissingProfileAssetError(profileName, path)
}

function validateSystemPrompt(profileName: string, path: string): void {
  requireFile(profileName, path)
  if (readFileSync(path, 'utf8').trim().length > 0) {
    return
  }

  throw new InvalidProfileModuleError(profileName, 'SYSTEM.md must not be empty')
}

async function validatePiResources(profileName: string, profileRoot: string): Promise<void> {
  const globalPromptsDirectory = findGlobalPromptsDirectory(profileRoot)
  const resourceLoader = new DefaultResourceLoader({
    cwd: profileRoot,
    agentDir: join(profileRoot, '.profile-validation'),
    additionalExtensionPaths: [profileRoot],
    additionalPromptTemplatePaths: globalPromptsDirectory ? [globalPromptsDirectory] : [],
    noContextFiles: true,
  })
  await resourceLoader.reload()
  const extensionFailures = resourceLoader
    .getExtensions()
    .errors.map(({ path, error }) => `${path}: ${error}`)
  const resourceFailures = [
    ...resourceLoader.getSkills().diagnostics,
    ...resourceLoader.getPrompts().diagnostics,
    ...resourceLoader.getThemes().diagnostics,
  ].map((diagnostic) => diagnostic.message)
  const failures = [...extensionFailures, ...resourceFailures]
  if (failures.length === 0) {
    return
  }

  throw new InvalidProfileModuleError(profileName, failures.join('; '))
}

function validateModel(profile: Profile): void {
  const model = profile.defaults?.model
  if (model) {
    const knownModel = piModels.getModel(model.provider, model.id)
    if (knownModel) {
      return
    }

    throw new InvalidProfileModuleError(
      profile.name,
      `unknown built in model "${model.provider}/${model.id}"`,
    )
  }
}

async function loadProfile(profileRoot: string): Promise<ProfileCatalogEntry> {
  const directoryName = basename(profileRoot)
  const extensionPath = join(profileRoot, 'extensions', 'profile.ts')
  const systemPromptPath = join(profileRoot, 'SYSTEM.md')
  requireFile(directoryName, extensionPath)
  validateSystemPrompt(directoryName, systemPromptPath)
  await validatePiResources(directoryName, profileRoot)
  const importedModule: unknown = await import(pathToFileURL(extensionPath).href)
  const parsedModule = profileModuleSchema.safeParse(importedModule)
  if (parsedModule.success) {
    if (parsedModule.data.profile.name === directoryName) {
      validateModel(parsedModule.data.profile)
      return { profile: parsedModule.data.profile, profileRoot }
    }

    throw new InvalidProfileModuleError(
      directoryName,
      `profile name must match its directory, got "${parsedModule.data.profile.name}"`,
    )
  }

  throw new InvalidProfileModuleError(directoryName, z.prettifyError(parsedModule.error))
}

export async function loadProfileCatalog(
  profilesDirectory: string,
): Promise<ProfileCatalogEntry[]> {
  const profileRoots = readdirSync(profilesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(profilesDirectory, entry.name))
    .sort((left, right) => left.localeCompare(right))
  if (profileRoots.length > 0) {
    return Promise.all(profileRoots.map(loadProfile))
  }

  throw new NoProfilesFoundError(profilesDirectory)
}
