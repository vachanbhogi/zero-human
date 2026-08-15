#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
tmp="$(mktemp -d)"
mkdir -p "$tmp/bin" "$tmp/repo/.git"

cat > "$tmp/bin/git" <<'EOF'
#!/usr/bin/env bash
case "$*" in
  "rev-parse --is-inside-work-tree") exit 0 ;;
  "fetch --prune origin") [[ "${WATCH_FAIL_FETCH:-0}" == 1 ]] && exit 1 || exit 0 ;;
  "rev-parse origin/main") printf '%s\n' "${WATCH_MAIN_SHA:-oldsha}" ;;
  "diff --name-status oldsha newsha") printf 'M\tREADME.md\n' ;;
esac
EOF
cat > "$tmp/bin/gh" <<'EOF'
#!/usr/bin/env bash
[[ "$1" == auth ]] && { [[ "${WATCH_FAIL_GH:-0}" == 1 ]] && exit 1 || exit 0; }
printf '#1 test 2026-08-15 Test https://example.test/1\n'
EOF
cat > "$tmp/bin/sleep" <<'EOF'
#!/usr/bin/env bash
[[ "${WATCH_STOP_AFTER_SLEEP:-0}" == 1 ]] && exit 99
exit 0
EOF
chmod +x "$tmp/bin"/*

printf 'oldsha\n#1 old\n' > "$tmp/state"
set +e
failure_output="$(PATH="$tmp/bin:$PATH" TMPDIR="$tmp" WATCH_STATE_FILE="$tmp/state" WATCH_FAIL_FETCH=1 WATCH_STOP_AFTER_SLEEP=1 "$root/scripts/repo-watcher.sh" "$tmp/repo" 2>&1)"
failure_status=$?
set -e
[[ "$failure_status" -ne 0 ]]
grep -q 'WARNING: git fetch failed' <<<"$failure_output"
grep -q '^oldsha$' "$tmp/state"

set +e
gh_failure_output="$(PATH="$tmp/bin:$PATH" TMPDIR="$tmp" WATCH_STATE_FILE="$tmp/state" WATCH_FAIL_GH=1 WATCH_STOP_AFTER_SLEEP=1 "$root/scripts/repo-watcher.sh" "$tmp/repo" 2>&1)"
gh_failure_status=$?
set -e
[[ "$gh_failure_status" -ne 0 ]]
grep -q 'WARNING: open PR snapshot failed' <<<"$gh_failure_output"
grep -q '^oldsha$' "$tmp/state"

movement_output="$(PATH="$tmp/bin:$PATH" TMPDIR="$tmp" WATCH_STATE_FILE="$tmp/state" WATCH_MAIN_SHA=newsha WATCH_MAX_CYCLES=1 "$root/scripts/repo-watcher.sh" "$tmp/repo" 2>&1)"
grep -q 'ALERT origin/main moved: oldsha -> newsha' <<<"$movement_output"
grep -q $'M\tREADME.md' <<<"$movement_output"
printf 'repo watcher failure and movement checks passed\n'
