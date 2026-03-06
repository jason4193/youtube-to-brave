#!/usr/bin/env bash
set -euo pipefail

HOST_NAME="com.example.youtubetobrave"
HOST_DESCRIPTION="YouTube to Brave Redirector"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUNDLED_SCRIPT="$SCRIPT_DIR/script.py"

if [[ ! -f "$BUNDLED_SCRIPT" ]]; then
  osascript -e 'display alert "Installer Error" message "Missing bundled native host script.py" as critical'
  exit 1
fi

find_extension_id() {
  local chrome_root="$HOME/Library/Application Support/Google/Chrome"
  local profile_dir
  local ext_root
  local ext_id
  local version_dir
  local manifest

  for profile_dir in "$chrome_root"/*; do
    [[ -d "$profile_dir" ]] || continue
    ext_root="$profile_dir/Extensions"
    [[ -d "$ext_root" ]] || continue

    for ext_id in "$ext_root"/*; do
      [[ -d "$ext_id" ]] || continue

      for version_dir in "$ext_id"/*; do
        manifest="$version_dir/manifest.json"
        [[ -f "$manifest" ]] || continue

        if grep -q '"name"[[:space:]]*:[[:space:]]*"YouTube to Brave Redirector"' "$manifest"; then
          basename "$ext_id"
          return 0
        fi
      done
    done
  done

  return 1
}

is_valid_extension_id() {
  local id="$1"
  [[ "$id" =~ ^[a-p]{32}$ ]]
}

prompt_extension_id() {
  local default_id="$1"
  osascript - "$default_id" <<'APPLESCRIPT'
on run argv
  set suggestedId to ""
  if (count of argv) > 0 then
    set suggestedId to item 1 of argv
  end if

  set guideText to "YouTube to Brave — Native Host Installer" & return & return & ¬
    "Paste your Chrome Extension ID below, then click Install." & return & return & ¬
    "How to find it:" & return & ¬
    "1) Open chrome://extensions" & return & ¬
    "2) Enable Developer mode" & return & ¬
    "3) Copy the extension ID for 'YouTube to Brave Redirector'"

  set response to display dialog guideText with title "YouTube to Brave Installer" default answer suggestedId buttons {"Cancel", "Install"} default button "Install" with icon note
  return text returned of response
end run
APPLESCRIPT
}

DETECTED_EXT_ID="$(find_extension_id || true)"
DEFAULT_EXT_ID="${1:-$DETECTED_EXT_ID}"

EXT_ID="$(prompt_extension_id "$DEFAULT_EXT_ID" || true)"

if [[ -z "$EXT_ID" ]]; then
  osascript -e 'display alert "Installation Cancelled" message "No Extension ID provided." as warning'
  exit 1
fi

if ! is_valid_extension_id "$EXT_ID"; then
  osascript -e 'display alert "Invalid Extension ID" message "Expected a 32-character lowercase Chrome extension ID (letters a-p only)." as warning'
  exit 1
fi

PYTHON_BIN="$(command -v python3 || true)"
if [[ -z "$PYTHON_BIN" ]]; then
  if [[ -x "/opt/homebrew/bin/python3" ]]; then
    PYTHON_BIN="/opt/homebrew/bin/python3"
  elif [[ -x "/usr/local/bin/python3" ]]; then
    PYTHON_BIN="/usr/local/bin/python3"
  fi
fi

if [[ -z "$PYTHON_BIN" ]]; then
  osascript -e 'display alert "Python 3 Not Found" message "Install Python 3, then run this installer again." as critical'
  exit 1
fi

MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
HOST_DIR="$MANIFEST_DIR/youtube-to-brave"
MANIFEST_PATH="$MANIFEST_DIR/${HOST_NAME}.json"
TARGET_SCRIPT="$HOST_DIR/script.py"

mkdir -p "$HOST_DIR"
cp "$BUNDLED_SCRIPT" "$TARGET_SCRIPT"
chmod +x "$TARGET_SCRIPT"

sed -i.bak "1s|^#!/.*python3|#!$PYTHON_BIN|" "$TARGET_SCRIPT"
rm -f "$TARGET_SCRIPT.bak"

cat > "$MANIFEST_PATH" <<EOF
{
  "name": "${HOST_NAME}",
  "description": "${HOST_DESCRIPTION}",
  "path": "${TARGET_SCRIPT}",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://${EXT_ID}/"
  ]
}
EOF

osascript -e 'display notification "Installation in progress..." with title "YouTube to Brave"'

osascript -e 'display notification "Native host installed successfully. Reload the extension popup to verify status." with title "YouTube to Brave"'
osascript -e 'display dialog "Installation complete.\n\nNext:\n1) Reload the extension on chrome://extensions\n2) Open the extension popup and confirm status is Active." buttons {"OK"} default button "OK"'

echo "Done"
echo "Manifest: $MANIFEST_PATH"
echo "Script:   $TARGET_SCRIPT"
echo "Ext ID:   $EXT_ID"
