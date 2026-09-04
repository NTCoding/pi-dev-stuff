import { basename } from 'node:path'
import type {
  ContextUsage,
  ExtensionAPI,
  ExtensionContext,
  ThemeColor,
} from '@earendil-works/pi-coding-agent'
import { truncateToWidth } from '@earendil-works/pi-tui'

type ThinkingLevel = ReturnType<ExtensionAPI['getThinkingLevel']>

type FooterSegment = Readonly<{
  label: string
  value: string
  tone: ThemeColor
}>

export type ProfileFooterSnapshot = Readonly<{
  repositoryName: string
  branchName: string | null
  profileName: string
  contextUsage: ContextUsage | undefined
  modelName: string
  thinkingLevel: ThinkingLevel
}>

const thinkingTones: Readonly<Record<ThinkingLevel, ThemeColor>> = {
  off: 'thinkingOff',
  minimal: 'thinkingMinimal',
  low: 'thinkingLow',
  medium: 'thinkingMedium',
  high: 'thinkingHigh',
  xhigh: 'thinkingXhigh',
  max: 'thinkingMax',
}

function formatTokenCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}m`
  }

  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  }

  return `${count}`
}

function formatContextUsage(contextUsage: ContextUsage | undefined): string {
  const tokens = contextUsage?.tokens
  const percentage = contextUsage?.percent
  if (typeof tokens === 'number' && typeof percentage === 'number' && contextUsage) {
    return `${Math.round(percentage)}% · ${formatTokenCount(tokens)}/${formatTokenCount(contextUsage.contextWindow)}`
  }

  return '—'
}

function contextTone(contextUsage: ContextUsage | undefined): ThemeColor {
  const percentage = contextUsage?.percent
  if (typeof percentage === 'number' && percentage >= 90) {
    return 'error'
  }

  if (typeof percentage === 'number' && percentage >= 70) {
    return 'warning'
  }

  return 'success'
}

export function createProfileFooterRows(
  snapshot: ProfileFooterSnapshot,
): readonly (readonly FooterSegment[])[] {
  const branchSegment: readonly FooterSegment[] = snapshot.branchName
    ? [{ label: 'branch', value: snapshot.branchName, tone: 'success' }]
    : []
  return [
    [
      { label: 'repo', value: snapshot.repositoryName, tone: 'accent' },
      ...branchSegment,
      { label: 'profile', value: snapshot.profileName, tone: 'accent' },
    ],
    [
      {
        label: 'context',
        value: formatContextUsage(snapshot.contextUsage),
        tone: contextTone(snapshot.contextUsage),
      },
      { label: 'model', value: snapshot.modelName, tone: 'text' },
      {
        label: 'thinking',
        value: snapshot.thinkingLevel,
        tone: thinkingTones[snapshot.thinkingLevel],
      },
    ],
  ]
}

function workingDirectoryName(workingDirectory: string): string {
  const directoryName = basename(workingDirectory)
  if (directoryName.length > 0) {
    return directoryName
  }

  return workingDirectory
}

async function findRepositoryName(pi: ExtensionAPI, workingDirectory: string): Promise<string> {
  const gitResult = await pi
    .exec('git', ['-C', workingDirectory, 'rev-parse', '--show-toplevel'])
    .catch(() => undefined)
  if (gitResult?.code === 0 && gitResult.stdout.trim().length > 0) {
    return workingDirectoryName(gitResult.stdout.trim())
  }

  return workingDirectoryName(workingDirectory)
}

export async function installProfileFooter(
  pi: ExtensionAPI,
  context: ExtensionContext,
  profileName: string,
): Promise<void> {
  const repositoryName = await findRepositoryName(pi, context.cwd)
  if (context.mode === 'tui') {
    context.ui.setFooter((tui, theme, footerData) => {
      const unsubscribe = footerData.onBranchChange(() => tui.requestRender())
      const renderSegment = (segment: FooterSegment): string =>
        `${theme.fg('dim', segment.label)} ${theme.fg(segment.tone, segment.value)}`
      return {
        dispose: unsubscribe,
        invalidate: (): void => undefined,
        render: (width: number): string[] => {
          const snapshot: ProfileFooterSnapshot = {
            repositoryName,
            branchName: footerData.getGitBranch(),
            profileName,
            contextUsage: context.getContextUsage(),
            modelName: context.model?.id ?? 'none',
            thinkingLevel: pi.getThinkingLevel(),
          }
          const separator = theme.fg('borderMuted', ' │ ')
          return createProfileFooterRows(snapshot).map((row) =>
            truncateToWidth(row.map(renderSegment).join(separator), width),
          )
        },
      }
    })
  }
}
