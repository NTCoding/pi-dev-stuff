import { describe, expect, it } from 'vitest'
import { createProfileFooterRows, type ProfileFooterSnapshot } from './profile-footer'

const snapshot: ProfileFooterSnapshot = {
  repositoryName: 'pi-dev-stuff',
  branchName: 'main',
  profileName: 'facilitator',
  contextUsage: { tokens: 49_000, contextWindow: 272_000, percent: 18 },
  modelName: 'gpt-5.6-sol',
  thinkingLevel: 'medium',
}

describe('profile footer', () => {
  it('separates repository identity from model runtime details', () => {
    const rows = createProfileFooterRows(snapshot)

    expect(rows).toStrictEqual([
      [
        { label: 'repo', value: 'pi-dev-stuff', tone: 'accent' },
        { label: 'branch', value: 'main', tone: 'success' },
        { label: 'profile', value: 'facilitator', tone: 'accent' },
      ],
      [
        { label: 'context', value: '18% · 49k/272k', tone: 'success' },
        { label: 'model', value: 'gpt-5.6-sol', tone: 'text' },
        { label: 'thinking', value: 'medium', tone: 'thinkingMedium' },
      ],
    ])
  })

  it('omits the branch segment outside a Git repository', () => {
    const rows = createProfileFooterRows({ ...snapshot, branchName: null })

    expect(rows.at(0)).toStrictEqual([
      { label: 'repo', value: 'pi-dev-stuff', tone: 'accent' },
      { label: 'profile', value: 'facilitator', tone: 'accent' },
    ])
  })

  it('highlights context pressure near the context limit', () => {
    const rows = createProfileFooterRows({
      ...snapshot,
      contextUsage: { tokens: 250_000, contextWindow: 272_000, percent: 92 },
    })

    expect(rows.at(1)?.at(0)).toStrictEqual({
      label: 'context',
      value: '92% · 250k/272k',
      tone: 'error',
    })
  })
})
