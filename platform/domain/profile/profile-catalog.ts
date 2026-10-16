import { z } from 'zod'
import { profileSchema, type Profile } from './profile'
import { ProfileCatalogError } from './profile-catalog-errors'

export type ProfileCatalogEntry = Readonly<{
  profile: Profile
  profileRoot: string
}>

const serializedProfileCatalogSchema = z.array(
  z.object({
    profile: profileSchema,
    profileRoot: z.string().min(1),
  }),
)

function parseCatalogJson(output: string): unknown {
  try {
    return JSON.parse(output)
  } catch {
    throw new ProfileCatalogError('Catalog process did not produce valid JSON')
  }
}

/**
 * Parses the serialized profile catalog produced by the catalog child
 * process. The catalog is a domain concept: Pi knows nothing about profile
 * catalogs, only this repository does.
 */
export function parseProfileCatalog(output: string): readonly ProfileCatalogEntry[] {
  const result = serializedProfileCatalogSchema.safeParse(parseCatalogJson(output))
  if (!result.success) {
    throw new ProfileCatalogError('Catalog process did not produce a valid profile list')
  }

  return result.data
}
