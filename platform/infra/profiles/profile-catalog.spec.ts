import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { loadProfileCatalog } from './profile-catalog'

function createCatalogSandbox(): string {
  return mkdtempSync(join(tmpdir(), 'pi-profile-catalog-'))
}

function writeProfileModule(
  profilesDirectory: string,
  directoryName: string,
  profileName: string,
): void {
  const profileRoot = join(profilesDirectory, directoryName)
  const extensionsDirectory = join(profileRoot, 'extensions')
  mkdirSync(extensionsDirectory, { recursive: true })
  writeFileSync(join(profileRoot, 'SYSTEM.md'), 'You are a reviewer.\n')
  writeFileSync(
    join(extensionsDirectory, 'profile.ts'),
    `export const profile = { name: '${profileName}', description: 'Reviews code' }\nexport default () => undefined\n`,
  )
}

describe('profile catalog', () => {
  it('loads a profile following the built in directory convention', async () => {
    const profilesDirectory = createCatalogSandbox()
    try {
      writeProfileModule(profilesDirectory, 'reviewer', 'reviewer')

      const catalog = await loadProfileCatalog(profilesDirectory)

      expect(catalog).toStrictEqual([
        {
          profileRoot: join(profilesDirectory, 'reviewer'),
          profile: { name: 'reviewer', description: 'Reviews code' },
        },
      ])
    } finally {
      rmSync(profilesDirectory, { recursive: true })
    }
  })

  it('rejects an empty profile catalog', async () => {
    const profilesDirectory = createCatalogSandbox()
    try {
      await expect(loadProfileCatalog(profilesDirectory)).rejects.toThrow(
        `No profiles found in ${profilesDirectory}`,
      )
    } finally {
      rmSync(profilesDirectory, { recursive: true })
    }
  })

  it('rejects a profile without a system prompt', async () => {
    const profilesDirectory = createCatalogSandbox()
    try {
      const profileRoot = join(profilesDirectory, 'reviewer')
      mkdirSync(join(profileRoot, 'extensions'), { recursive: true })
      writeFileSync(
        join(profileRoot, 'extensions', 'profile.ts'),
        "export const profile = { name: 'reviewer', description: 'Reviews code' }\nexport default () => undefined\n",
      )

      await expect(loadProfileCatalog(profilesDirectory)).rejects.toThrow(
        `Profile "reviewer" requires ${join(profileRoot, 'SYSTEM.md')}`,
      )
    } finally {
      rmSync(profilesDirectory, { recursive: true })
    }
  })

  it('rejects a profile name that differs from its directory', async () => {
    const profilesDirectory = createCatalogSandbox()
    try {
      writeProfileModule(profilesDirectory, 'reviewer', 'other-reviewer')

      await expect(loadProfileCatalog(profilesDirectory)).rejects.toThrow(
        'profile name must match its directory, got "other-reviewer"',
      )
    } finally {
      rmSync(profilesDirectory, { recursive: true })
    }
  })

  it('rejects a model outside the Pi built in catalog', async () => {
    const profilesDirectory = createCatalogSandbox()
    try {
      writeProfileModule(profilesDirectory, 'reviewer', 'reviewer')
      writeFileSync(
        join(profilesDirectory, 'reviewer', 'extensions', 'profile.ts'),
        "export const profile = { name: 'reviewer', description: 'Reviews code', defaults: { model: { provider: 'unknown', id: 'imaginary' } } }\nexport default () => undefined\n",
      )

      await expect(loadProfileCatalog(profilesDirectory)).rejects.toThrow(
        'unknown built in model "unknown/imaginary"',
      )
    } finally {
      rmSync(profilesDirectory, { recursive: true })
    }
  })
})
