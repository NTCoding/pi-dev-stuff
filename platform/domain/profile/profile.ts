import { z } from 'zod'

const thinkingLevelSchema = z.enum(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'])
const toolNameSchema = z.enum(['read', 'bash', 'powershell', 'edit', 'write', 'grep', 'find', 'ls'])
export const profileModelReferenceSchema = z
  .object({
    provider: z.string().trim().min(1),
    id: z.string().trim().min(1),
  })
  .brand('ProfileModelReference')
const profileDefaultsSchema = z
  .object({
    model: profileModelReferenceSchema.optional(),
    thinkingLevel: thinkingLevelSchema.optional(),
    tools: z.array(toolNameSchema).min(1).readonly().optional(),
  })
  .strict()
export const profileSchema = z
  .object({
    name: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().min(1),
    defaults: profileDefaultsSchema.optional(),
  })
  .strict()

export type ProfileModelReference = z.infer<typeof profileModelReferenceSchema>
export type Profile = Readonly<z.infer<typeof profileSchema>>

export function defineProfile(profile: Profile): Profile {
  profileSchema.parse(profile)
  return profile
}
