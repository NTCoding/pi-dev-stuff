import type { SessionEntry } from '@earendil-works/pi-coding-agent'
import { describe, expect, it } from 'vitest'
import { loadProfileCatalog, type ProfileCatalogEntry } from '../profiles/profile-catalog'
import { ProfileNotFoundError } from '../profiles/profile-errors'
import {
  describeProfile,
  findProfileByLabel,
  findRememberedProfile,
  findRememberedProfileName,
} from './profile-chooser'

const profilesDirectory = new URL('../../../profiles', import.meta.url).pathname

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

function requireProfile(
  catalog: readonly ProfileCatalogEntry[],
  profileName: string,
): ProfileCatalogEntry {
  const found = catalog.find(({ profile }) => profile.name === profileName)
  if (!found) {
    throw new ProfileNotFoundError(
      profileName,
      catalog.map(({ profile }) => profile.name),
    )
  }

  return found
}

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
  it('finds the catalog entry for a remembered profile', async () => {
    const catalog = await loadProfileCatalog(profilesDirectory)
    const entries: SessionEntry[] = [createChoiceEntry('facilitator', '1', null)]
    const remembered = findRememberedProfile(catalog, entries)
    expect(remembered?.profile.name).toBe('facilitator')
  })

  it('returns undefined for an unknown remembered profile', async () => {
    const catalog = await loadProfileCatalog(profilesDirectory)
    const entries: SessionEntry[] = [createChoiceEntry('gone', '1', null)]
    expect(findRememberedProfile(catalog, entries)).toBeUndefined()
  })

  it('returns undefined when nothing was chosen', async () => {
    const catalog = await loadProfileCatalog(profilesDirectory)
    expect(findRememberedProfile(catalog, [])).toBeUndefined()
  })
})

describe('profile labels', () => {
  it('labels a profile with its name and description', async () => {
    const catalog = await loadProfileCatalog(profilesDirectory)
    const facilitator = requireProfile(catalog, 'facilitator')

    expect(describeProfile(facilitator)).toBe(`facilitator — ${facilitator.profile.description}`)
  })

  it('finds a profile by its label', async () => {
    const catalog = await loadProfileCatalog(profilesDirectory)
    const facilitator = requireProfile(catalog, 'facilitator')

    expect(findProfileByLabel(catalog, describeProfile(facilitator))?.profile.name).toBe(
      'facilitator',
    )
    expect(findProfileByLabel(catalog, 'nope — nothing')).toBeUndefined()
  })
})
