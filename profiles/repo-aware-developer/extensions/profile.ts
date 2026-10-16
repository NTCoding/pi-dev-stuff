import { getBuiltinModel } from '@earendil-works/pi-ai/providers/all'
import { defineProfile } from '../../../platform/domain/profile/profile'
import { builtinProfileModel } from '../../../platform/domain/profile/pi-model-reference'
import { definePiProfile } from '../../../platform/domain/profile/pi-profile-extension'

export const profile = defineProfile({
  name: 'repo-aware-developer',
  description: 'Autonomous developer that implements specs against repository guidance',
  defaults: {
    model: builtinProfileModel(getBuiltinModel('openai-codex', 'gpt-5.6-sol')),
    thinkingLevel: 'high',
  },
})

export default definePiProfile(import.meta.url, profile)
