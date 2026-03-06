# YouTube to Brave Redirector

![YouTube to Brave Redirector](extension/icon.png)
For those who prefer to watch YouTube videos in the Brave browser, but still stuck with Chrome for other browsing. Here's a simple Chrome extension solution that detects YouTube links and opens them in Brave instead.

This project consists of a Chrome extension that listens for navigations to YouTube URLs and a native host program that opens those URLs in Brave. The extension communicates with the native host using Chrome's Native Messaging API, which all programs are running locally with no external servers involved.

## Project Structure

```
youtube-to-brave/
├── extension/              # Chrome web extension files
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   └── icon.png
├── native-host/            # Native host program (local machine)
│   ├── script.py
│   └── setup.sh
├── README.md
└── __pycache__/
```

## Quick Overview

- The extension detects navigations to YouTube and calls a native host `com.example.youtubetobrave`.
- The native host opens the URL in Brave and replies to the extension with a small acknowledgement.

## Requirements

- **Chrome Browser** (version 90+)
- **Brave Browser** (latest version)
- **Python 3** (3.7 or higher)
  - On macOS with Homebrew: `/opt/homebrew/bin/python3` or `/usr/local/bin/python3`
  - On Linux: `python3` from your package manager
- **macOS or Linux** (Windows not currently supported)
- No additional Python packages required (uses only standard library)

## Setup Instructions

### 1. Load Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Navigate to the `extension/` folder in this project and select it
5. The extension will load and display in the list with your extension ID
6. Note your extension ID for use in the next step

### 2. Install Native Host

1. Ensure `python3` is installed and accessible. On macOS with Homebrew this is typically `/opt/homebrew/bin/python3`.

2. Make sure `script.py` is executable:

```bash
chmod +x native-host/script.py
```

3. Run the setup script from the `native-host/` directory to write the native messaging manifest. Replace `EXTENSION_ID` with your extension ID (from chrome://extensions):

```bash
cd native-host
./setup.sh EXTENSION_ID
```

Example:

```bash
./setup.sh inojbnigjmpkgmkcfhiahghpjgjngnkp
```

The native host manifest will be installed to:

- `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.example.youtubetobrave.json`

## Testing

1. Open Chrome DevTools:
   - Right-click the extension icon and select **Inspect**
   - Or: Go to `chrome://extensions` → Click the extension → Inspect views → **Service worker**

2. In the DevTools console, you should see logs from the background script

3. Navigate to or click a YouTube link (e.g., `https://youtube.com/watch?v=...` or `https://youtu.be/...`)

4. The extension will:
   - Detect the YouTube URL
   - Send it to the native host
   - Open it in Brave
   - Remove the tab from Chrome

5. Check debug logs (optional):

```bash
tail -f ~/youtube_redirect_debug.log
```

## Security & Cleanup

- When testing is finished, remove the debug log to avoid leaking URLs or other data:

```bash
rm -f ~/youtube_redirect_debug.log
```

## Troubleshooting

- If Chrome reports "Native host has exited." and the native host log does not show entries:
  - Verify the manifest `allowed_origins` exactly matches your extension ID (including trailing slash)
  - Check the manifest is installed at `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`
  - Verify the `path` in the manifest points to the correct `script.py` location
  - Ensure `script.py` shebang points to an accessible Python interpreter

## Files Overview

### Extension Files (`extension/`)

- `manifest.json` — extension manifest with permissions and metadata
- `background.js` — service worker that listens for YouTube navigations
- `content.js` — content script that runs on YouTube pages
- `icon.png` — extension icon (128x128)

### Native Host Files (`native-host/`)

- `script.py` — native host program that opens Brave and validates URLs
- `setup.sh` — helper script to install the native messaging host manifest

## License

Unlicensed personal/experimental code.
