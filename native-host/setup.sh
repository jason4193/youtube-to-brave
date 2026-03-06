#!/usr/bin/env bash
set -euo pipefail

# Minimal setup: find python3, write manifest, and set up debug flag
# Usage: ./setup.sh <EXTENSION_ID>

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <EXTENSION_ID>"
  exit 1
fi

EXT_ID="$1"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_PATH="$SCRIPT_DIR/script.py"

# find python3 path
PYTHON_BIN="$(command -v python3 || true)"
if [ -z "$PYTHON_BIN" ]; then
  if [ -x "/opt/homebrew/bin/python3" ]; then
    PYTHON_BIN="/opt/homebrew/bin/python3"
  elif [ -x "/usr/local/bin/python3" ]; then
    PYTHON_BIN="/usr/local/bin/python3"
  else
    PYTHON_BIN=""
  fi
fi

if [ -z "$PYTHON_BIN" ]; then
  echo "Warning: python3 not found on PATH and no common fallback found. The script will still write the manifest but native host may not run."
else
  echo "Detected python3: $PYTHON_BIN"
fi

MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"

# Verify manifest directory exists
if [ ! -d "$MANIFEST_DIR" ]; then
  echo "Creating manifest directory: $MANIFEST_DIR"
  mkdir -p "$MANIFEST_DIR" || { echo "Error: Failed to create $MANIFEST_DIR"; exit 1; }
fi

MANIFEST_PATH="$MANIFEST_DIR/com.example.youtubetobrave.json"

if [ -f "$MANIFEST_PATH" ]; then
  cp "$MANIFEST_PATH" "$MANIFEST_PATH.bak.$(date +%s)"
fi

cat > "$MANIFEST_PATH" <<EOF
{
  "name": "com.example.youtubetobrave",
  "description": "YouTube to Brave Redirector",
  "path": "$SCRIPT_PATH",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXT_ID/"
  ]
}
EOF

echo "Wrote manifest to $MANIFEST_PATH"

# Update script.py shebang to detected python3 (cross-platform compatible: sed -i.bak)
if [ -n "$PYTHON_BIN" ]; then
  # Use .bak suffix for sed -i to work on both macOS and Linux
  sed -i.bak "1s|^#!/.*python3|#!$PYTHON_BIN|" "$SCRIPT_PATH"
  rm -f "$SCRIPT_PATH.bak"  # Remove backup file after successful edit
  echo "Updated $SCRIPT_PATH shebang to: $PYTHON_BIN"
else
  echo "Warning: could not detect python3 path, shebang not updated"
fi

FLAGFILE="$HOME/.youtube_redirect_debug_enabled"
rm -f "$FLAGFILE" || true
echo "Debug disabled"

echo "Done."