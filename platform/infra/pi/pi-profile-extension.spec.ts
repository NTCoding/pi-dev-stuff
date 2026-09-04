import type { BuildSystemPromptOptions, Skill } from '@earendil-works/pi-coding-agent'
import { describe, expect, it } from 'vitest'
import { buildProfileSystemPrompt } from './pi-profile-extension'

const skill: Skill = {
  name: 'review-change',
  description: 'Review a code change',
  filePath: '/profiles/reviewer/skills/review-change/SKILL.md',
  baseDir: '/profiles/reviewer/skills/review-change',
  disableModelInvocation: false,
  sourceInfo: {
    path: '/profiles/reviewer/skills/review-change/SKILL.md',
    scope: 'temporary',
    source: 'cli',
    origin: 'top-level',
  },
}

function createOptions(
  overrides: Partial<BuildSystemPromptOptions> = {},
): BuildSystemPromptOptions {
  return {
    cwd: '/work/project',
    ...overrides,
  }
}

describe('profile system prompt', () => {
  it('uses the profile prompt instead of the Pi coding prompt', () => {
    const prompt = buildProfileSystemPrompt('You are a reviewer.', createOptions({}))

    expect(prompt).toBe('You are a reviewer.\n\nCurrent working directory: /work/project\n')
    expect(prompt).not.toContain('expert coding assistant')
  })

  it('retains appended and project instructions', () => {
    const prompt = buildProfileSystemPrompt(
      'You are a reviewer.',
      createOptions({
        appendSystemPrompt: 'Always be concise.',
        contextFiles: [{ path: '/work/project/AGENTS.md', content: 'Follow repository rules.' }],
      }),
    )

    expect(prompt).toContain('Always be concise.')
    expect(prompt).toContain('<project_context>')
    expect(prompt).toContain('Follow repository rules.')
    expect(prompt).toContain('path="/work/project/AGENTS.md"')
  })

  it('retains Pi skill discovery when a file reading tool is active', () => {
    const prompt = buildProfileSystemPrompt(
      'You are a reviewer.',
      createOptions({ selectedTools: ['read'], skills: [skill] }),
    )

    expect(prompt).toContain('<available_skills>')
    expect(prompt).toContain('<name>review-change</name>')
  })

  it('omits skills when no file reading tool is active', () => {
    const prompt = buildProfileSystemPrompt(
      'You are a reviewer.',
      createOptions({ selectedTools: ['edit'], skills: [skill] }),
    )

    expect(prompt).not.toContain('<available_skills>')
  })
})
