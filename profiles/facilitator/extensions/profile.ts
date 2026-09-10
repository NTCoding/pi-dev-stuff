import { getBuiltinModel } from '@earendil-works/pi-ai/providers/all'
import { defineProfile } from '../../../platform/domain/profile/profile'
import { builtinProfileModel } from '../../../platform/infra/pi/pi-model-reference'
import { definePiProfile } from '../../../platform/infra/pi/pi-profile-extension'

export const profile = defineProfile({
  name: 'facilitator',
  description: 'Facilitates exploration and implementation without taking decisions for the user',
  defaults: {
    model: builtinProfileModel(getBuiltinModel('opencode-go', 'deepseek-v4-flash')),
    thinkingLevel: 'high',
  },
})

export default definePiProfile(import.meta.url, profile)
