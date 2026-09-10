import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent'

export type GlobalPromptsDiscovery = Readonly<{
  promptPaths: string[]
}>

export function resolveGlobalPromptsDirectory(profileRoot: string): string {
  return join(profileRoot, '..', '..', 'global-prompts')
}

export function findGlobalPromptsDirectory(profileRoot: string): string | undefined {
  const globalPromptsDirectory = resolveGlobalPromptsDirectory(profileRoot)
  return existsSync(globalPromptsDirectory) ? globalPromptsDirectory : undefined
}

export function createGlobalPromptsDiscovery(
  profileRoot: string,
): GlobalPromptsDiscovery | undefined {
  const globalPromptsDirectory = findGlobalPromptsDirectory(profileRoot)
  if (globalPromptsDirectory) {
    return { promptPaths: [globalPromptsDirectory] }
  }

  return undefined
}

export function registerGlobalPrompts(pi: ExtensionAPI, profileRoot: string): void {
  const discovery = createGlobalPromptsDiscovery(profileRoot)
  if (discovery) {
    pi.on('resources_discover', () => discovery)
  }
}
