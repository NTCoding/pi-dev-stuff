# Repository guidance

## Structure

All platform code belongs under one of these directories:

- `platform/domain`: profile rules and domain concepts
- `platform/infra`: generic integrations such as Pi, Git, HTTP, file system, and processes

This architecture is documented but is not currently enforced by tooling. Follow it without adding an enforcement mechanism unless the user approves one.

Profiles belong in `profiles/<profile-name>`. A profile uses these built in conventions:

- `SYSTEM.md` provides its system prompt
- `extensions/` contains Pi extensions and must contain `profile.ts`
- `skills/` contains Agent Skills
- `prompts/` contains Pi prompt templates
- `themes/` contains Pi themes

Do not declare conventional resource paths in a profile. Add a path to TypeScript only when a resource cannot follow the convention.

## TypeScript

Profile definitions and other project DSLs must be TypeScript. Do not create a custom DSL or use JSON or YAML for them. Standard tool configuration files are allowed where the tool requires them.

Keep profile definitions declarative. Use existing Pi capabilities before adding custom platform code.

Use intention revealing names. Do not create generic `shared`, `common`, `helpers`, `utilities`, or `utils` folders.

## Verification

Use pnpm and Node 24. Run these checks before presenting work as complete:

```bash
pnpm run verify
```

Do not bypass lint, type, validation, test, or Git hook checks. Do not add suppression comments or other escape hatches.
