export class ProfileChooserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProfileChooserError'
  }
}
