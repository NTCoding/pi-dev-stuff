# Pi profiles

Typed profiles for launching Pi with a system prompt, extensions, skills, prompts, themes, and runtime defaults.

## Set up

```bash
nvm use
corepack enable
pnpm install --frozen-lockfile
```

## Launch

Choose a profile interactively:

```bash
./pi-launcher.sh
```

Choose one directly:

```bash
./pi-launcher.sh --profile facilitator
```

Pass remaining arguments to Pi:

```bash
./pi-launcher.sh --profile facilitator --thinking high
```

List profiles:

```bash
./pi-launcher.sh --list-profiles
```

Explicit Pi arguments override defaults declared by a profile.

## Profile convention

Each directory under `profiles/` is a profile:

```text
profiles/example/
  SYSTEM.md
  extensions/
    profile.ts
    optional-extension.ts
  skills/
  prompts/
  themes/
```

Only `SYSTEM.md` and `extensions/profile.ts` are required. Pi discovers the other conventional directories when they are present.

A profile definition is TypeScript:

```typescript
import { getBuiltinModel } from '@earendil-works/pi-ai/providers/all'
import { defineProfile } from '../../../platform/domain/profile/profile'
import { definePiProfile } from '../../../platform/infra/pi/pi-profile-extension'
import { builtinProfileModel } from '../../../platform/infra/pi/pi-model-reference'

export const profile = defineProfile({
  name: 'example',
  description: 'Explains the purpose of the profile',
  defaults: {
    model: builtinProfileModel(getBuiltinModel('openai-codex', 'gpt-5.6-terra')),
    thinkingLevel: 'high',
    tools: ['read', 'grep'],
  },
})

export default definePiProfile(import.meta.url, profile)
```

`builtinProfileModel` makes built in provider and model identifiers compile time safe. Omit any defaults which should continue to come from the user’s Pi settings.

## Verification

```bash
pnpm run verify
```

The build compiles the TypeScript project and validates every profile. The pre-commit hook runs the complete verification gate.
