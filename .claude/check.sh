#!/usr/bin/env bash
# The repo's check: type check, lint and production build, the three commands of AGENTS.md "Before calling
# something finished" that finish in seconds. CI runs this same file on every pull request, and the stop hook runs it
# before an agent may finish (its limit is 300 s; this takes 3 s with node_modules and 7 s with the install).
#
#   bash .claude/check.sh
#
# Runs every step even when one fails, prints the last 20 lines of each failing step followed by one "FAIL:" line
# naming it, and exits 0 only when none failed. The last line repeats the failing names, so it survives the stop hook,
# which shows only the tail of the output: "3 steps, 2 failed: typecheck, lint", or "3 steps, 0 failed".
#
# Not in here, on purpose: there are no unit tests in this repo, so none were left out. Two other checks stay out
# (AGENTS.md lists both as part of "finished", so run them by hand before a pull request):
#   pnpm references                 one pass over the whole git history, cached in .context/, which a new worktree does
#                                   not have. It had not finished after 9 minutes on a fresh worktree. CI cannot run it
#                                   either: actions/checkout fetches one commit, and there is no history to read.
#   pnpm --dir native typecheck     needs the Expo workshop installed (cd native && pnpm install). Run it when native/
#                                   changed.
#
# A worktree has no node_modules (gitignored), and a killed install leaves one without its tools. When tsc, oxlint or
# vite is missing from node_modules/.bin this runs `pnpm install --frozen-lockfile` first: it only reads pnpm-lock.yaml,
# never rewrites it, and the stop hook only gives an agent three attempts, so failing here with "run pnpm install" would
# cost an attempt for a step the script can do itself.
set -u

cd "$(dirname "${BASH_SOURCE[0]}")/.." || { echo "check.sh: cannot find the repo root" >&2; exit 1; }

if ! command -v pnpm >/dev/null 2>&1; then
  echo "check.sh: pnpm is missing. Install it (https://pnpm.io/installation) and run again." >&2
  exit 1
fi
if ! command -v node >/dev/null 2>&1; then
  echo "check.sh: node is missing. Install the version in .nvmrc and run again." >&2
  exit 1
fi

# scripts/routes.mjs runs TypeScript with plain node, which needs the major pinned in .nvmrc. The major has at most 3
# digits: a longer number overflows the comparison below, which would then pass by mistake.
nvmrc=$(tr -d '[:space:]' < .nvmrc)
if ! [[ $nvmrc =~ ^v?[0-9]{1,3}(\.[0-9]+\.[0-9]+)?$ ]]; then
  echo "check.sh: .nvmrc says \"$nvmrc\", which is not a major (24) or a version (v24.12.0). Put one of those in .nvmrc." >&2
  exit 1
fi
want=${nvmrc#v}
want=${want%%.*}
have=$(node -p 'process.versions.node.split(".")[0]')
if [ "$have" -lt "$want" ]; then
  echo "check.sh: node $have is too old, .nvmrc wants $want. Run: nvm install && nvm use" >&2
  exit 1
fi

steps=0
failed=0
failed_names=""

# Runs one command, hides its output when it passes, shows its last 20 lines and a FAIL line when it does not.
# Lint runs with --quiet: the repo carries warnings on purpose, and 20 lines of them would bury the error that failed it.
step() {
  local name=$1 out code
  shift
  steps=$((steps + 1))
  if out=$("$@" 2>&1); then
    echo "ok: $name"
  else
    code=$?
    printf '%s\n' "$out" | tail -n 20
    echo "FAIL: $name ($*, exit $code)"
    failed=$((failed + 1))
    failed_names="$failed_names${failed_names:+, }$name"
  fi
}

# The install is a step like the others, so a failure shows the command and its real exit code and the summary line
# still ends the output. The steps below need the install, so they do not run after it fails.
#
# It runs when a tool the steps run is missing from node_modules/.bin, which also covers a missing node_modules. An
# install that was killed halfway leaves a node_modules that exists but has no tools; checking only the folder would
# fail every later run with "tsc: command not found" until someone deleted it by hand. The rerun repairs it.
for tool in tsc oxlint vite; do
  if [ ! -x "node_modules/.bin/$tool" ]; then
    echo "check.sh: node_modules/.bin/$tool is missing, running: pnpm install --frozen-lockfile"
    step install pnpm install --frozen-lockfile
    break
  fi
done

if [ "$failed" -eq 0 ]; then
  step typecheck pnpm typecheck
  step lint pnpm lint --quiet
  step build pnpm build
fi

echo "$steps steps, $failed failed${failed_names:+: $failed_names}"
[ "$failed" -eq 0 ]
