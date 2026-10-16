export class ProfileCatalogError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProfileCatalogError'
  }
}
