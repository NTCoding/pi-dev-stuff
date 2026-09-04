import { getBuiltinModel } from '@earendil-works/pi-ai/providers/all'
import { describe, expect, it } from 'vitest'
import { builtinProfileModel } from '../pi/pi-model-reference'
import type { ProfileCatalogEntry } from '../profiles/profile-catalog'
import { buildPiArguments, parseProfileLauncherArguments } from './profile-launcher-arguments'

const catalogEntry: ProfileCatalogEntry = {
  profileRoot: '/profiles/reviewer',
  profile: {
    name: 'reviewer',
    description: 'Reviews code',
    defaults: {
      model: builtinProfileModel(getBuiltinModel('openai-codex', 'gpt-5.6-terra')),
      thinkingLevel: 'high',
      tools: ['read', 'grep'],
    },
  },
}

describe('profile launcher arguments', () => {
  it('extracts a named profile and preserves Pi arguments', () => {
    const request = parseProfileLauncherArguments(['--profile', 'reviewer', '--thinking', 'medium'])

    expect(request).toStrictEqual({
      kind: 'launch',
      profileName: 'reviewer',
      piArguments: ['--thinking', 'medium'],
    })
  })

  it('selects interactive launching when no profile is supplied', () => {
    const request = parseProfileLauncherArguments(['--continue'])

    expect(request).toStrictEqual({
      kind: 'launch',
      profileName: undefined,
      piArguments: ['--continue'],
    })
  })

  it('rejects a profile option without a name', () => {
    expect(() => parseProfileLauncherArguments(['--profile'])).toThrow(
      '--profile requires a profile name',
    )
  })

  it('places user arguments after profile defaults so they take precedence', () => {
    const argumentsList = buildPiArguments(catalogEntry, ['--thinking', 'medium'])

    expect(argumentsList).toStrictEqual([
      '--model',
      'openai-codex/gpt-5.6-terra',
      '--thinking',
      'high',
      '--tools',
      'read,grep',
      '--extension',
      '/profiles/reviewer',
      '--thinking',
      'medium',
    ])
  })
})
