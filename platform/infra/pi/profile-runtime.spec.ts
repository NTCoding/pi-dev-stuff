import type { BuildSystemPromptOptions, Skill } from '@earendil-works/pi-coding-agent'
import { describe, expect, it } from 'vitest'
import { buildSkillsPrompt } from './profile-runtime'

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

describe('skills prompt rendering', () => {
  it('retains Pi skill discovery when a file reading tool is active', () => {
    const prompt = buildSkillsPrompt(createOptions({ selectedTools: ['read'], skills: [skill] }))

    expect(prompt).toContain('<available_skills>')
    expect(prompt).toContain('<name>review-change</name>')
  })

  it('omits skills when no file reading tool is active', () => {
    const prompt = buildSkillsPrompt(createOptions({ selectedTools: ['edit'], skills: [skill] }))

    expect(prompt).toBeUndefined()
  })
})
