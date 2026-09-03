#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
prompts_dir="$script_dir/system-prompts"

prompts=()
prompt_names=()
for prompt in "$prompts_dir"/*; do
  [[ -f "$prompt" ]] || continue
  prompts+=("$prompt")
  filename="$(basename -- "$prompt")"
  prompt_names+=("${filename%.*}")
done

if ((${#prompts[@]} == 0)); then
  printf 'No system prompt files found in %s\n' "$prompts_dir" >&2
  exit 1
fi

PS3='Choose a system prompt: '
select prompt_name in "${prompt_names[@]}"; do
  if [[ "$REPLY" =~ ^[0-9]+$ ]] && (( REPLY >= 1 && REPLY <= ${#prompts[@]} )); then
    exec pi --system-prompt "${prompts[REPLY - 1]}" "$@"
  fi
  printf 'Invalid selection. Please try again.\n' >&2
done
