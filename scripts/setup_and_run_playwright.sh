#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "== Playwright setup and headless test runner =="

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 not found. Install python3 and try again." >&2
  exit 1
fi

VENV_DIR="$ROOT_DIR/.venv"
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment at $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

echo "Activating virtual environment"
# shellcheck source=/dev/null
. "$VENV_DIR/bin/activate"

echo "Upgrading pip and installing Playwright"
python -m pip install --upgrade pip setuptools wheel
python -m pip install playwright

echo "Installing Chromium for Playwright (may take a while)"
python -m playwright install chromium

echo "Running headless tests"
python3 test/run_headless_test.py

echo "Headless tests finished"
