import { getBuiltinModel } from '@earendil-works/pi-ai/providers/all'
import { defineProfile } from '../../../platform/domain/profile/profile'
import { builtinProfileModel } from '../../../platform/domain/profile/pi-model-reference'
import { definePiProfile } from '../../../platform/domain/profile/pi-profile-extension'

export const profile = defineProfile({
  name: 'nick-grammar-rules',
  description:
    'Writes the way Nick writes, with every rule stated as a named grammatical construction',
  defaults: {
    model: builtinProfileModel(getBuiltinModel('opencode-go', 'deepseek-v4.1-flash')),
    thinkingLevel: 'low',
  },
})

export default definePiProfile(import.meta.url, profile)
