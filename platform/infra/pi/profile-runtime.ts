import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  formatSkillsForPrompt,
  type BuildSystemPromptOptions,
  type ExtensionAPI,
} from '@earendil-works/pi-coding-agent'
import type { Profile } from '../../domain/profile/profile'
import { registerGlobalPrompts } from './global-prompts'
import { installProfileFooter } from './profile-footer'

function buildProjectContext(options: BuildSystemPromptOptions): string | undefined {
  const contextFiles = options.contextFiles ?? []
  if (contextFiles.length > 0) {
    const instructions = contextFiles
      .map(
        ({ path, content }) =>
          `<project_instructions path="${path}">\n${content}\n</project_instructions>`,
      )
      .join('\n\n')
    return `<project_context>\n\nProject-specific instructions and guidelines:\n\n${instructions}\n\n</project_context>`
  }

  return undefined
}

function findSkillFileReadTool(selectedTools: readonly string[]): 'read' | 'bash' | undefined {
  if (selectedTools.includes('read')) {
    return 'read'
  }

  if (selectedTools.includes('bash')) {
    return 'bash'
  }

  return undefined
}

function buildSkills(options: BuildSystemPromptOptions): string | undefined {
  const selectedTools = options.selectedTools ?? ['read', 'bash', 'edit', 'write']
  const skillFileReadTool = findSkillFileReadTool(selectedTools)
  const skills = options.skills ?? []
  if (skillFileReadTool && skills.length > 0) {
    return formatSkillsForPrompt(skills, skillFileReadTool).trimStart()
  }

  return undefined
}

export function buildProfileSystemPrompt(
  profileSystemPrompt: string,
  options: BuildSystemPromptOptions,
): string {
  const sections = [
    profileSystemPrompt.trimEnd(),
    options.appendSystemPrompt,
    buildProjectContext(options),
    buildSkills(options),
  ].filter((section): section is string => typeof section === 'string' && section.length > 0)
  const workingDirectory = options.cwd.replaceAll('\\', '/')
  return `${sections.join('\n\n')}\n\nCurrent working directory: ${workingDirectory}\n`
}

export function readProfileSystemPrompt(profileRoot: string): string {
  return readFileSync(join(profileRoot, 'SYSTEM.md'), 'utf8')
}

export type InstalledProfile = Readonly<{
  profile: Profile
  profileRoot: string
  systemPrompt: string
}>

/**
 * Wires a profile into a running Pi extension: global prompt templates, the
 * profile system prompt on every agent start, and the profile footer.
 */
export function installProfileRuntime(pi: ExtensionAPI, installed: InstalledProfile): void {
  registerGlobalPrompts(pi, installed.profileRoot)
  pi.on('before_agent_start', (event) => ({
    systemPrompt: buildProfileSystemPrompt(installed.systemPrompt, event.systemPromptOptions),
  }))
  pi.on('session_start', async (_event, context) => {
    await installProfileFooter(pi, context, installed.profile.name)
  })
}
