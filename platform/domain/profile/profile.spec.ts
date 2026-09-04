import { describe, expect, it } from 'vitest'
import { defineProfile } from './profile'

describe('profile definition', () => {
  it('preserves a profile containing typed defaults', () => {
    const definition = {
      name: 'reviewer',
      description: 'Reviews a code change',
      defaults: {
        thinkingLevel: 'high',
        tools: ['read', 'grep'],
      },
    } satisfies Parameters<typeof defineProfile>[0]

    const profile = defineProfile(definition)

    expect(profile).toBe(definition)
  })

  it('rejects a profile name that cannot identify its directory', () => {
    expect(() =>
      defineProfile({
        name: 'Invalid Profile',
        description: 'Cannot be selected by directory name',
      }),
    ).toThrow(/Invalid string/)
  })

  it('rejects an empty profile description', () => {
    expect(() =>
      defineProfile({
        name: 'reviewer',
        description: ' ',
      }),
    ).toThrow(/Too small/)
  })
})
