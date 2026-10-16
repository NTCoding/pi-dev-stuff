import type { Api, Model } from '@earendil-works/pi-ai'
import {
  profileModelReferenceSchema,
  type ProfileModelReference,
} from '../../domain/profile/profile'

export function builtinProfileModel(model: Model<Api>): ProfileModelReference {
  return profileModelReferenceSchema.parse({ provider: model.provider, id: model.id })
}
