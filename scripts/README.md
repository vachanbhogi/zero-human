# Repository watcher

Run `./scripts/repo-watcher.sh /path/to/zero-human` from a separate terminal. It fetches `origin` every 60 seconds, reports movement of `origin/main` with changed paths, and reports changes to open PR summaries when authenticated `gh` is available.

Set `WATCH_INTERVAL_SECONDS` to change the interval and `WATCH_STATE_FILE` to choose the state file. The watcher only fetches and reads GitHub state. It never checks out, pulls, merges, rebases, resets, or changes another worktree.
