import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ExtensionAPI, ExtensionFactory } from '@earendil-works/pi-coding-agent'
import { defineProfile, type Profile } from '../../domain/profile/profile'
import { installProfileRuntime, readProfileSystemPrompt } from './profile-runtime'

export type PiProfileExtension = ExtensionFactory &
  Readonly<{
    profile: Profile
    profileRoot: string
  }>

export function definePiProfile(moduleUrl: string, definition: Profile): PiProfileExtension {
  const profile = defineProfile(definition)
  const profileRoot = dirname(dirname(fileURLToPath(moduleUrl)))
  const systemPrompt = readProfileSystemPrompt(profileRoot)
  const extension: ExtensionFactory = (pi: ExtensionAPI): void => {
    installProfileRuntime(pi, { profile, profileRoot, systemPrompt })
  }

  return Object.assign(extension, { profile, profileRoot })
}
