import { describe, expect, it } from 'vitest'
import { parseProfileCatalog } from './profile-catalog'

describe('profile catalog parsing', () => {
  it('parses a serialized catalog into entries', () => {
    const output = JSON.stringify([
      {
        profile: {
          name: 'facilitator',
          description: 'Facilitates exploration',
          defaults: { thinkingLevel: 'high' },
        },
        profileRoot: '/repo/profiles/facilitator',
      },
    ])

    expect(parseProfileCatalog(output)).toStrictEqual([
      {
        profile: {
          name: 'facilitator',
          description: 'Facilitates exploration',
          defaults: { thinkingLevel: 'high' },
        },
        profileRoot: '/repo/profiles/facilitator',
      },
    ])
  })

  it('rejects output that is not valid JSON', () => {
    expect(() => parseProfileCatalog('not json')).toThrow('valid JSON')
  })

  it('rejects entries that do not satisfy the profile schema', () => {
    const output = JSON.stringify([{ profile: { name: 'Bad Name' }, profileRoot: '/x' }])
    expect(() => parseProfileCatalog(output)).toThrow('valid profile list')
  })

  it('rejects a non-array payload', () => {
    const output = JSON.stringify({ profile: 'facilitator' })
    expect(() => parseProfileCatalog(output)).toThrow('valid profile list')
  })
})
