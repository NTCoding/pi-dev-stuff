import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadProfileCatalog } from '../profiles/profile-catalog'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const profilesDirectory = resolve(repositoryRoot, 'profiles')
const profiles = await loadProfileCatalog(profilesDirectory)

console.log(`Validated ${profiles.length} profile${profiles.length === 1 ? '' : 's'}`)
