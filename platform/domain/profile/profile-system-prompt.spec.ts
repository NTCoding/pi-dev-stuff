import { describe, expect, it } from 'vitest'
import { buildProfileSystemPrompt } from './profile-system-prompt'

describe('profile system prompt', () => {
  it('uses the profile prompt instead of the Pi coding prompt', () => {
    const prompt = buildProfileSystemPrompt({
      profilePrompt: 'You are a reviewer.',
      cwd: '/work/project',
    })

    expect(prompt).toBe('You are a reviewer.\n\nCurrent working directory: /work/project\n')
    expect(prompt).not.toContain('expert coding assistant')
  })

  it('retains appended instructions', () => {
    const prompt = buildProfileSystemPrompt({
      profilePrompt: 'You are a reviewer.',
      cwd: '/work/project',
      appendSystemPrompt: 'Always be concise.',
    })

    expect(prompt).toContain('You are a reviewer.')
    expect(prompt).toContain('Always be concise.')
  })

  it('embeds project instruction files as project context', () => {
    const prompt = buildProfileSystemPrompt({
      profilePrompt: 'You are a reviewer.',
      cwd: '/work/project',
      contextFiles: [{ path: '/work/project/AGENTS.md', content: 'Follow repository rules.' }],
    })

    expect(prompt).toContain('<project_context>')
    expect(prompt).toContain('Follow repository rules.')
    expect(prompt).toContain('path="/work/project/AGENTS.md"')
  })

  it('omits empty sections', () => {
    const withSections = buildProfileSystemPrompt({
      profilePrompt: 'You are a reviewer.',
      cwd: '/work/project',
      appendSystemPrompt: 'Always be concise.',
      skillsPrompt: '<available_skills></available_skills>',
    })
    const withoutSections = buildProfileSystemPrompt({
      profilePrompt: 'You are a reviewer.',
      cwd: '/work/project',
    })

    expect(withSections.length).toBeGreaterThan(withoutSections.length)
    expect(withoutSections).not.toContain('Always be concise.')
  })

  it('orders the profile prompt before supporting sections', () => {
    const prompt = buildProfileSystemPrompt({
      profilePrompt: 'You are a reviewer.',
      cwd: '/work/project',
      appendSystemPrompt: 'Always be concise.',
    })

    expect(prompt.indexOf('You are a reviewer.')).toBeLessThan(prompt.indexOf('Always be concise.'))
    expect(prompt.indexOf('Always be concise.')).toBeLessThan(
      prompt.indexOf('Current working directory'),
    )
  })
})
