import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import {
  createGlobalPromptsDiscovery,
  findGlobalPromptsDirectory,
  resolveGlobalPromptsDirectory,
} from './global-prompts'

function createSandbox(): string {
  return mkdtempSync(join(tmpdir(), 'pi-global-prompts-'))
}

describe('global prompts directory', () => {
  it('resolves the global prompts directory from the profile root', () => {
    expect(resolveGlobalPromptsDirectory('/repo/profiles/reviewer')).toBe('/repo/global-prompts')
  })

  it('returns undefined when the directory is absent', () => {
    const sandbox = createSandbox()
    try {
      const profileRoot = join(sandbox, 'profiles', 'reviewer')
      mkdirSync(profileRoot, { recursive: true })

      expect(findGlobalPromptsDirectory(profileRoot)).toBeUndefined()
    } finally {
      rmSync(sandbox, { recursive: true, force: true })
    }
  })

  it('returns the directory when it exists', () => {
    const sandbox = createSandbox()
    try {
      const profileRoot = join(sandbox, 'profiles', 'reviewer')
      const globalPromptsDirectory = join(sandbox, 'global-prompts')
      mkdirSync(profileRoot, { recursive: true })
      mkdirSync(globalPromptsDirectory)

      expect(findGlobalPromptsDirectory(profileRoot)).toBe(globalPromptsDirectory)
    } finally {
      rmSync(sandbox, { recursive: true, force: true })
    }
  })

  it('discovers global prompts with the directory path when present', () => {
    const sandbox = createSandbox()
    try {
      const profileRoot = join(sandbox, 'profiles', 'reviewer')
      const globalPromptsDirectory = join(sandbox, 'global-prompts')
      mkdirSync(profileRoot, { recursive: true })
      mkdirSync(globalPromptsDirectory)

      expect(createGlobalPromptsDiscovery(profileRoot)).toStrictEqual({
        promptPaths: [globalPromptsDirectory],
      })
    } finally {
      rmSync(sandbox, { recursive: true, force: true })
    }
  })

  it('discovers nothing when the directory is absent', () => {
    const sandbox = createSandbox()
    try {
      const profileRoot = join(sandbox, 'profiles', 'reviewer')
      mkdirSync(profileRoot, { recursive: true })

      expect(createGlobalPromptsDiscovery(profileRoot)).toBeUndefined()
    } finally {
      rmSync(sandbox, { recursive: true, force: true })
    }
  })
})
