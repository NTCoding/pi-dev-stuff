import { loadProfileCatalog } from '../profiles/profile-catalog'

const profilesDirectory = process.argv[2]
if (!profilesDirectory) {
  console.error('Usage: tsx profile-catalog-json.ts <profiles-directory>')
  process.exit(1)
}

const catalog = await loadProfileCatalog(profilesDirectory)
console.log(JSON.stringify(catalog.map(({ profile, profileRoot }) => ({ profile, profileRoot }))))
