#!/usr/bin/env bash
set -euo pipefail

repo_dir="${1:-$(git rev-parse --show-toplevel)}"
interval="${WATCH_INTERVAL_SECONDS:-60}"
state_file="${WATCH_STATE_FILE:-${TMPDIR:-/tmp}/zero-human-repo-watcher.state}"

cd "$repo_dir"
git rev-parse --is-inside-work-tree >/dev/null

snapshot_prs() {
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    gh pr list --state open --limit 100 --json number,title,headRefName,updatedAt,url \
      --jq 'sort_by(.number) | .[] | "#\(.number) \(.headRefName) \(.updatedAt) \(.title) \(.url)"'
  else
    printf '%s\n' "gh unavailable or unauthenticated; open PR summaries unavailable"
  fi
}

previous_main=""
previous_prs=""
if [[ -f "$state_file" ]]; then
  previous_main="$(sed -n '1p' "$state_file")"
  previous_prs="$(sed '1d' "$state_file")"
fi

while :; do
  git fetch --prune origin
  current_main="$(git rev-parse origin/main)"
  current_prs="$(snapshot_prs)"

  if [[ -n "$previous_main" && "$current_main" != "$previous_main" ]]; then
    printf 'ALERT origin/main moved: %s -> %s\n' "$previous_main" "$current_main"
    git diff --name-status "$previous_main" "$current_main"
  fi
  if [[ -n "$previous_prs" && "$current_prs" != "$previous_prs" ]]; then
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
  sleep "$interval"
done
