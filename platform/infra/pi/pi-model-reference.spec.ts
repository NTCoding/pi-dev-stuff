import { getBuiltinModel } from '@earendil-works/pi-ai/providers/all'
import { describe, expect, it } from 'vitest'
import { builtinProfileModel } from './pi-model-reference'

describe('Pi model reference', () => {
  it('creates a profile model from Pi built in model identifiers', () => {
    const model = builtinProfileModel(getBuiltinModel('openai-codex', 'gpt-5.6-terra'))

    expect(model).toStrictEqual({
      provider: 'openai-codex',
      id: 'gpt-5.6-terra',
    })
  })
})
