export type ProfilePromptContextFile = Readonly<{
  path: string
  content: string
}>

export type ProfileSystemPromptSections = Readonly<{
  /** The profile's own SYSTEM.md content; the prompt is built around it. */
  profilePrompt: string
  cwd: string
  /** Extra instructions appended after the profile prompt. */
  appendSystemPrompt?: string | undefined
  /** Project instruction files to embed as project context. */
  contextFiles?: readonly ProfilePromptContextFile[] | undefined
  /** Pi-specific rendering of available skills, prepared by the caller. */
  skillsPrompt?: string | undefined
}>

function buildProjectContext(
  contextFiles: readonly ProfilePromptContextFile[],
): string | undefined {
  if (contextFiles.length === 0) {
    return undefined
  }

  const instructions = contextFiles
    .map(
      ({ path, content }) =>
        `<project_instructions path="${path}">\n${content}\n</project_instructions>`,
    )
    .join('\n\n')
  return `<project_context>\n\nProject-specific instructions and guidelines:\n\n${instructions}\n\n</project_context>`
}

/**
 * Domain rule for the profile system prompt: the profile prompt wins over
 * Pi's default, followed by appended instructions, project context, and
 * skills, and closed by the working directory.
 */
export function buildProfileSystemPrompt(sections: ProfileSystemPromptSections): string {
  const orderedSections = [
    sections.profilePrompt.trimEnd(),
    sections.appendSystemPrompt,
    buildProjectContext(sections.contextFiles ?? []),
    sections.skillsPrompt,
  ].filter((section): section is string => typeof section === 'string' && section.length > 0)
  const workingDirectory = sections.cwd.replaceAll('\\', '/')
  return `${orderedSections.join('\n\n')}\n\nCurrent working directory: ${workingDirectory}\n`
}
