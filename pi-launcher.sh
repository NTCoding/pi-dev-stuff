#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
tsx_executable="$script_dir/node_modules/.bin/tsx"

if [[ ! -x "$tsx_executable" ]]; then
  printf 'Pi profile dependencies are not installed. Run pnpm install in %s\n' "$script_dir" >&2
  exit 1
fi

exec "$tsx_executable" "$script_dir/platform/infra/cli/profile-launcher.ts" "$@"
