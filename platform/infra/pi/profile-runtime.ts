import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  formatSkillsForPrompt,
  type BuildSystemPromptOptions,
  type ExtensionAPI,
} from '@earendil-works/pi-coding-agent'
import { buildProfileSystemPrompt } from '../../domain/profile/profile-system-prompt'
import type { Profile } from '../../domain/profile/profile'
import { registerGlobalPrompts } from './global-prompts'
import { installProfileFooter } from './profile-footer'

export function readProfileSystemPrompt(profileRoot: string): string {
  return readFileSync(join(profileRoot, 'SYSTEM.md'), 'utf8')
}

/**
 * Pi-specific rendering of the available-skills section. Whether skills are
 * rendered, and how their files may be read, depends on the active tools.
 */
function resolveSkillFileReadTool(selectedTools: readonly string[]): 'read' | 'bash' | undefined {
  if (selectedTools.includes('read')) {
    return 'read'
  }

  return selectedTools.includes('bash') ? 'bash' : undefined
}

export function buildSkillsPrompt(options: BuildSystemPromptOptions): string | undefined {
  const selectedTools = options.selectedTools ?? ['read', 'bash', 'edit', 'write']
  const skillFileReadTool = resolveSkillFileReadTool(selectedTools)
  const skills = options.skills ?? []
  if (!skillFileReadTool || skills.length === 0) {
    return undefined
  }

  return formatSkillsForPrompt(skills, skillFileReadTool).trimStart()
}

/**
 * Pi glue for a profile: translates Pi's system prompt options into the
 * domain prompt sections and wires the profile into a running session.
 */
export function installProfileRuntime(
  pi: ExtensionAPI,
  installed: Readonly<{
    profile: Profile
    profileRoot: string
    systemPrompt: string
  }>,
): void {
  registerGlobalPrompts(pi, installed.profileRoot)
  pi.on('before_agent_start', (event) => ({
    systemPrompt: buildProfileSystemPrompt({
      profilePrompt: installed.systemPrompt,
      cwd: event.systemPromptOptions.cwd,
      appendSystemPrompt: event.systemPromptOptions.appendSystemPrompt,
      contextFiles: event.systemPromptOptions.contextFiles,
      skillsPrompt: buildSkillsPrompt(event.systemPromptOptions),
    }),
  }))
  pi.on('session_start', async (_event, context) => {
    await installProfileFooter(pi, context, installed.profile.name)
  })
}
