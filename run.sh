#!/usr/bin/env bash
# ==============================================================================
# One-Command Launcher for Smart Traffic & Fuel Prediction System (Linux / macOS)
# ==============================================================================
set -e

# Detect python3 or python
if command -v python3 &>/dev/null; then
    PY_CMD="python3"
elif command -v python &>/dev/null; then
    PY_CMD="python"
else
    echo "Error: Python is not found. Please install Python 3.9+ from https://www.python.org"
    exit 1
fi

$PY_CMD run.py "$@"
