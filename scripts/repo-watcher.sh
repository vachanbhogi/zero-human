#!/usr/bin/env bash
set -euo pipefail

repo_dir="${1:-$(git rev-parse --show-toplevel)}"
interval="${WATCH_INTERVAL_SECONDS:-60}"
state_file="${WATCH_STATE_FILE:-${TMPDIR:-/tmp}/zero-human-repo-watcher.state}"
max_cycles="${WATCH_MAX_CYCLES:-0}"
cycles=0

cd "$repo_dir"
git rev-parse --is-inside-work-tree >/dev/null

snapshot_prs() {
  command -v gh >/dev/null 2>&1 || return 1
  gh auth status >/dev/null 2>&1 || return 1
  gh pr list --state open --limit 100 --json number,title,headRefName,updatedAt,url \
    --jq 'sort_by(.number) | .[] | "#\(.number) \(.headRefName) \(.updatedAt) \(.title) \(.url)"'
}

warn() { printf '[%s] WARNING: %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*" >&2; }

previous_main=""
previous_prs=""
if [[ -f "$state_file" ]]; then
  previous_main="$(sed -n '1p' "$state_file")"
  previous_prs="$(sed '1d' "$state_file")"
fi

while :; do
  if ! git fetch --prune origin; then
    warn "git fetch failed; preserving last good state and retrying"
    sleep "$interval"
    continue
  fi
  if ! current_main="$(git rev-parse origin/main)"; then
    warn "reading origin/main failed; preserving last good state and retrying"
    sleep "$interval"
    continue
  fi
  prs_available=1
  if ! current_prs="$(snapshot_prs)"; then
    warn "open PR snapshot failed; preserving last good state and retrying"
    current_prs="$previous_prs"
    prs_available=0
  fi

  if [[ -n "$previous_main" && "$current_main" != "$previous_main" ]]; then
    printf 'ALERT origin/main moved: %s -> %s\n' "$previous_main" "$current_main"
    git diff --name-status "$previous_main" "$current_main"
  fi
  if [[ "$prs_available" -eq 1 && -n "$previous_prs" && "$current_prs" != "$previous_prs" ]]; then
    printf 'ALERT open PR state changed:\n%s\n' "$current_prs"
  fi
  if [[ -z "$previous_main" ]]; then
    printf 'Watching origin/main at %s\n' "$current_main"
  fi

  {
    printf '%s\n' "$current_main"
    printf '%s\n' "$current_prs"
  } > "$state_file"
  previous_main="$current_main"
  previous_prs="$current_prs"
  cycles=$((cycles + 1))
  if [[ "$max_cycles" -gt 0 && "$cycles" -ge "$max_cycles" ]]; then
    exit 0
  fi
  sleep "$interval"
done
