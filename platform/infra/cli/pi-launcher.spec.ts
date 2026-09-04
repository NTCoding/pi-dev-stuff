import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { afterEach, describe, expect, it } from 'vitest'

const temporaryDirectories: string[] = []

function createTemporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('pi-launcher.sh', () => {
  it('preserves the directory it was launched from', () => {
    const launcherRepository = createTemporaryDirectory('pi-launcher-repository-')
    const callerDirectory = createTemporaryDirectory('pi-launcher-caller-')
    const executableDirectory = join(launcherRepository, 'node_modules', '.bin')
    mkdirSync(executableDirectory, { recursive: true })

    const launcherPath = join(launcherRepository, 'pi-launcher.sh')
    copyFileSync(resolve('pi-launcher.sh'), launcherPath)
    chmodSync(launcherPath, 0o755)

    const fakeTsxPath = join(executableDirectory, 'tsx')
    writeFileSync(fakeTsxPath, '#!/usr/bin/env bash\nprintf "%s\\n" "$PWD"\n')
    chmodSync(fakeTsxPath, 0o755)

    const result = spawnSync(launcherPath, ['--profile', 'facilitator'], {
      cwd: callerDirectory,
      encoding: 'utf8',
    })

    expect(result.status).toBe(0)
    expect(realpathSync(result.stdout.trim())).toBe(realpathSync(callerDirectory))
  })
})
