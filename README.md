# YouTube to Brave Redirector

![YouTube to Brave Redirector](extension/assets/icon.png)

A Chrome extension + native host that redirects YouTube URLs from Chrome to Brave.

## Current Status

- ✅ macOS & Windows install flow implemented (guided)
- ✅ Native host version check integrated in popup
- ✅ Installer download from popup (downloads script plus `.command` for Mac or `.bat` for Windows)
- ✅ Guide pages for Mac and Windows install/uninstall
- 🚧 Linux installer flow not implemented yet (UI shows Coming Soon)

## Project Structure

```text
youtube-to-brave/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── assets/
│   │   ├── icon.png
│   │   ├── chrome-light.svg
│   │   ├── chrome-dark.svg
│   │   ├── brave-light.svg
│   │   ├── brave-dark.svg
│   │   ├── apple.svg
│   │   ├── windows.svg
│   │   └── linux.svg
│   ├── page/
│   │   ├── install.html
│   │   ├── install.css
│   │   ├── install-checker.js
│   │   ├── mac-install-guide.html
│   │   ├── mac-install-guide.css
│   │   ├── mac-install-guide.js
│   │   ├── mac-uninstall-guide.html
│   │   ├── mac-uninstall-guide.js
│   │   ├── windows-install-guide.html
│   │   ├── windows-install-guide.js
│   │   ├── windows-uninstall-guide.html
│   │   └── windows-uninstall-guide.js
│   └── native-host/
│       ├── script.py
│       ├── install-macos.command
│       └── install-windows.bat
├── native-host/
│   ├── script.py
│   └── setup.sh
├── PROJECT_SSOT.md
└── README.md
```

## Requirements

- Chrome Browser (v90+)
- Brave Browser
- Python 3.7+
- macOS or Windows (currently supported platforms)

## Quick Start (Recommended Flow)

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select `extension/`
4. Click the extension icon to open popup
5. Click **Download Installer** (automatically detects OS)
6. The popup downloads installer files and opens the corresponding install guide
7. Run the installer (`install-macos.command` on Mac or `install-windows.bat` on Windows)
8. Reload extension in `chrome://extensions`
9. Re-open popup and verify status is **Active**

## Alternative Manual Install (legacy dev script)

If you want to bypass the popup flow:

```bash
cd native-host
./setup.sh EXTENSION_ID
```

## Uninstall / Reset

You can open uninstall instructions from the popup:

- Popup → gear icon (top-right) → **Open [macOS/Windows] uninstall guide**

Or run manually:

**macOS:**
```bash
rm -f "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.example.youtubetobrave.json"
rm -rf "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts/youtube-to-brave"
```

**Windows (PowerShell):**
```powershell
Remove-ItemProperty -Path "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.example.youtubetobrave" -Name "(Default)" -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\YouTubeToBrave" -Recurse -Force -ErrorAction SilentlyContinue
```

## Troubleshooting

- If popup shows not installed:
  - Reload extension in `chrome://extensions`
  - Run **Connection Diagnostics** in popup
  - Verify manifest exists:

```bash
ls -la "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
```

- If Python path issue appears, ensure `python3` is available on PATH.

## Security Notes

- Native host only accepts `http://` and `https://` URLs.
- Native host communication restricted by `allowed_origins` to your extension ID.
- No external services; all processing is local.

## License

Unlicensed personal/experimental code.
