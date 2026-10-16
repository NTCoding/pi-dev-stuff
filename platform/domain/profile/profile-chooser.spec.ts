import type { SessionEntry } from '@earendil-works/pi-coding-agent'
import { describe, expect, it } from 'vitest'
import type { ProfileCatalogEntry } from './profile-catalog'
import {
  describeProfile,
  findProfileByLabel,
  findRememberedProfile,
  findRememberedProfileName,
} from './profile-chooser'

function createChoiceEntry(name: string, id: string, parentId: string | null): SessionEntry {
  return {
    type: 'custom',
    id,
    parentId,
    timestamp: '2024-01-01T00:00:00.000Z',
    customType: 'pi-dev-stuff-profile-choice',
    data: { name },
  }
}

const facilitator: ProfileCatalogEntry = {
  profile: { name: 'facilitator', description: 'Facilitates exploration' },
  profileRoot: '/repo/profiles/facilitator',
}
const repoAwareDeveloper: ProfileCatalogEntry = {
  profile: { name: 'repo-aware-developer', description: 'Implements specs' },
  profileRoot: '/repo/profiles/repo-aware-developer',
}
const catalog: readonly ProfileCatalogEntry[] = [facilitator, repoAwareDeveloper]

describe('remembered profile name', () => {
  it('returns the most recent chosen profile name', () => {
    const entries: SessionEntry[] = [
      createChoiceEntry('facilitator', '1', null),
      createChoiceEntry('repo-aware-developer', '2', '1'),
    ]
    expect(findRememberedProfileName(entries)).toBe('repo-aware-developer')
  })

  it('ignores foreign entries and malformed data', () => {
    const entries: SessionEntry[] = [
      {
        type: 'custom',
        id: '1',
        parentId: null,
        timestamp: '2024-01-01T00:00:00.000Z',
        customType: 'other-extension',
        data: { name: 'facilitator' },
      },
      {
        type: 'custom',
        id: '2',
        parentId: null,
        timestamp: '2024-01-01T00:00:01.000Z',
        customType: 'pi-dev-stuff-profile-choice',
        data: { name: 42 },
      },
      {
        type: 'custom',
        id: '3',
        parentId: null,
        timestamp: '2024-01-01T00:00:02.000Z',
        customType: 'pi-dev-stuff-profile-choice',
        data: 'not-an-object',
      },
    ]
    expect(findRememberedProfileName(entries)).toBeUndefined()
  })
})

describe('remembered profile lookup', () => {
  it('finds the catalog entry for a remembered profile', () => {
    const entries: SessionEntry[] = [createChoiceEntry('facilitator', '1', null)]
    const remembered = findRememberedProfile(catalog, entries)
    expect(remembered?.profile.name).toBe('facilitator')
  })

  it('returns undefined for an unknown remembered profile', () => {
    const entries: SessionEntry[] = [createChoiceEntry('gone', '1', null)]
    expect(findRememberedProfile(catalog, entries)).toBeUndefined()
  })

  it('returns undefined when nothing was chosen', () => {
    expect(findRememberedProfile(catalog, [])).toBeUndefined()
  })
})

describe('profile labels', () => {
  it('labels a profile with its name and description', () => {
    expect(describeProfile(facilitator)).toBe(`facilitator — ${facilitator.profile.description}`)
  })

  it('finds a profile by its label', () => {
    expect(findProfileByLabel(catalog, describeProfile(facilitator))?.profile.name).toBe(
      'facilitator',
    )
    expect(findProfileByLabel(catalog, 'nope — nothing')).toBeUndefined()
  })
})
