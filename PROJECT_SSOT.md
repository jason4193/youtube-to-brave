# YouTube to Brave Redirector - Single Source of Truth

**Last Updated:** March 6, 2026  
**Status:** In Development - Enhanced Installation UX Phase  
**Owner:** Jason4193

---

## Project Objective

Redirect YouTube links from Chrome browser to Brave browser seamlessly, allowing users who prefer Brave for YouTube but use Chrome for other browsing to maintain a consistent viewing experience without setting Brave as the system default browser.

**Primary Goals:**

- Frictionless YouTube detection and redirection
- Simple installation and setup for non-technical users
- Cross-platform support (macOS, Windows, Linux)
- Future Chrome Web Store distribution
- Automatic native host installation verification and updates

---

## Project Phase: Enhanced Installation UX (Current)

**Objective:** Reduce installation complexity by providing semi-automated native host installation within the extension UI.

**Key Improvements:**

1. Installation status detection within extension
2. Bundled native host files in extension package
3. One-click platform-specific installers (double-click to run)
4. Auto-detection of extension ID in installers
5. Version tracking and update prompts
6. Visual feedback and installation guides
7. Settings menu shortcuts to install/uninstall guide pages

---

## Tech Stack

### Fixed (Non-negotiable)

- **Chrome Extension Framework:** Manifest V3 (required by Chrome, Brave compatible)
- **Native Messaging API:** Chrome Runtime Native Messaging (only way to execute system commands from extension)
- **Python:** 3.7+ (native host runtime)
  - **Constraint:** No external dependencies; standard library only
  - **Reason:** Simplifies user setup, no pip/poetry required

### Architecture (Immutable)

```
User clicks YouTube link in Chrome
    ↓
Extension (webNavigation listener) detects URL
    ↓
Sends message via chrome.runtime.sendNativeMessage()
    ↓
Native host (Python) receives via stdin (Native Messaging protocol)
    ↓
Validates URL scheme (security check: http/https only)
    ↓
Opens URL in Brave via platform-specific subprocess call
    ↓
Responds to extension via stdout (Native Messaging protocol)
    ↓
Extension closes Chrome tab
```

### Platform-Specific Stack

| Component                | macOS                                                               | Windows                                                        | Linux                                           |
| ------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| **Native Host Manifest** | `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/` | `HKCU\Software\Google\Chrome\NativeMessagingHosts\` (Registry) | `~/.config/google-chrome/NativeMessagingHosts/` |
| **Python Interpreter**   | `/usr/bin/python3` or `/opt/homebrew/bin/python3`                   | `%PYTHONHOME%\python.exe` or bundled                           | System `python3`                                |
| **Open URL Command**     | `open -a "Brave Browser" <url>`                                     | `start brave://` or `.exe` path                                | `xdg-open <url>` with MIME type                 |
| **Installer**            | `.command` shell script (double-clickable)                          | `.bat` batch file or `.ps1` PowerShell                         | `.sh` shell script                              |
| **Installer Privileges** | User-level (no sudo)                                                | User-level HKCU (no admin)                                     | User-level (no sudo)                            |

---

## Project Structure (After Enhancement)

```
youtube-to-brave/
├── extension/
│   ├── manifest.json                    # Add: permissions for downloads, storage
│   ├── background.js                    # Update: installation checker on startup
│   ├── content.js                       # No changes (click detection)
│   ├── assets/                          # NEW FOLDER: Static assets
│   │   ├── icon.png                     # Extension icon
│   │   ├── chrome-light.svg             # Chrome icon for light mode
│   │   ├── chrome-dark.svg              # Chrome icon for dark mode
│   │   ├── brave-light.svg              # Brave icon for light mode
│   │   ├── brave-dark.svg               # Brave icon for dark mode
│   │   ├── apple.svg                    # Apple/macOS icon
│   │   ├── windows.svg                  # Windows icon
│   │   └── linux.svg                    # Linux icon
│   ├── page/                            # NEW FOLDER: UI pages
│   │   ├── install.html                 # Installation status UI
│   │   ├── install.css                  # Styles for install page
│   │   ├── install-checker.js           # Detection & download logic
│   │   ├── install-guide.html           # Unified install guide (all platforms)
│   │   ├── install-guide.js             # Platform-specific install logic
│   │   ├── uninstall-guide.html         # Unified uninstall guide (all platforms)
│   │   ├── uninstall-guide.js           # Platform-specific uninstall logic
│   │   ├── guide-common.css             # Shared styles for all guides
│   │   └── privacy-policy.html          # Privacy policy page
│   └── native-host/                     # NEW FOLDER: Bundled native host
│       ├── script.py                    # MOVED: From native-host/
│       ├── install-macos.command        # NEW: macOS installer
│       ├── install-windows.bat          # NEW: Windows installer (batch)
│       └── install-linux.sh             # NEW: Linux installer
│
├── native-host/                         # LEGACY (for development reference)
│   ├── script.py                        # Keep for local dev/testing
│   └── setup.sh                         # Keep for manual setup
│
├── PROJECT_SSOT.md                      # THIS FILE
├── README.md                            # Update: Add installation UI section
└── __pycache__/
```

---

## Core Components & Constraints

### Extension (Chrome Extension Manifest V3)

**Permissions Required:**

- `activeTab` - access current tab
- `scripting` - inject content scripts
- `webNavigation` - detect navigation events
- `nativeMessaging` - communicate with native host
- `downloads` - trigger installer downloads (NEW)
- `storage` - cache installation status (NEW)

**Permissions Granted:**

- `*://*.youtube.com/*` - detect YouTube navigations
- `*://*.youtu.be/*` - detect short-form YouTube URLs

**Core Logic:**

1. **background.js**: Listens for YouTube navigations via `chrome.webNavigation.onBeforeNavigate`
2. **install-checker.js** (NEW): Detects native host, prompts installation if missing
3. **install.html** (NEW): Visual status page with download buttons
4. **Settings menu** (NEW): Opens mac install and uninstall guide pages

### Native Host (Python Script)

**Entry Point:** `script.py` at runtime-detected path

**Process Flow:**

1. Read 4-byte length prefix from stdin (little-endian)
2. Read message body from stdin as JSON
3. Extract `url` field
4. Validate scheme is `http://` or `https://` (security)
5. Send JSON response to extension
6. Execute subprocess to open Brave with URL
7. Log to `~/youtube_redirect_debug.log` if DEBUG enabled

**Version System (NEW):**

- Constant `VERSION = "1.0.0"` at top of file
- Respond to `{"action": "version"}` with version info
- Extension checks mismatch and prompts update

**No External Dependencies:**

- Uses only: `os`, `sys`, `struct`, `json`, `subprocess`, `pathlib`
- Reason: Eliminates pip/package manager complexity for users

### Installers (Platform-Specific)

**All installers must:**

1. Auto-detect extension ID (scan Chrome extensions directory)
2. Detect native host installation status
3. Copy/overwrite native host files to correct location
4. Write native messaging manifest with correct extension ID
5. Show success/failure dialog
6. Return exit code for extension detection in future releases

**macOS (.command file):**

- Double-clickable (execute .command files natively)
- Uses `open -a` and `osascript` for dialogs
- Writes to `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/`

**Windows (.bat file):**

- Double-clickable via File Explorer
- Writes to Registry (HKCU, no admin required)
- Alternative: `.ps1` PowerShell script with GUI dialogs

**Linux (.sh file):**

- Requires `chmod +x` then `./install-linux.sh` (not double-clickable by default)
- Uses `zenity` or `kdialog` if available, else terminal prompts
- Writes to `~/.config/google-chrome/NativeMessagingHosts/`
- Allow install as user-level (no sudo)

---

## Development Roadmap

### Phase 1: Enhanced Installation (CURRENT)

**Scope:** Implement installation UI and detection within extension
**Files Modified:**

- ✏️ `manifest.json` - add permissions, update paths
- ✏️ `background.js` - startup check
- ✏️ `native-host/script.py` - add version constant
- ✨ `extension/page/install.html` - UI
- ✨ `extension/page/install.css` - styles
- ✨ `extension/page/install-checker.js` - detection logic
- ✨ `extension/page/install-guide.html` - unified install guide (all platforms)
- ✨ `extension/page/install-guide.js` - platform-specific install logic
- ✨ `extension/page/uninstall-guide.html` - unified uninstall guide (all platforms)
- ✨ `extension/page/uninstall-guide.js` - platform-specific uninstall logic
- ✨ `extension/page/guide-common.css` - shared styles for guides
- ✨ `extension/page/privacy-policy.html` - privacy policy page
- ✨ `extension/assets/` - browser and OS icons
- ✨ `extension/native-host/script.py` - copy bundled version
- ✨ `extension/native-host/install-macos.command`
- ✨ `extension/native-host/install-windows.bat`
- ✨ `extension/native-host/install-linux.sh`

**Success Criteria:**

- [x] Extension detects native host status on startup
- [x] Install page shows support state (macOS and Windows supported; Linux coming soon)
- [x] Download button triggers correct installer download
- [x] Download flow opens unified install guide with platform-specific instructions
- [x] Unified guide pages reduce code duplication
- [x] Platform detection via URL parameter (?platform=macos|windows|linux)
- [x] Double-click installer completes installation (macOS/Windows)
- [x] Extension detects successful installation and shows ✅ status
- [x] YouTube redirection works with new installer setup
- [ ] All platforms fully tested and documented

### Phase 2: Windows Support (POST Phase 1)

**Scope:** Refactor for cross-platform, test on Windows
**Files Modified:**

- ✏️ `native-host/script.py` - Windows subprocess call
- ✏️ `extension/native-host/script.py` - Windows subprocess call
- ✨ Complete `.bat` installer testing

### Phase 3: Chrome Web Store Publication (POST Phase 2)

**Scope:** Meet Web Store requirements, handle review process
**Files Modified:**

- ✏️ `README.md` - add Web Store link
- ✨ Store assets (icons, descriptions)

**Requirements:**

- Privacy policy document
- Extension description (<1000 chars)
- Screenshots (1280x800 minimum)
- Category selection
- Content rating form

---

## Known Constraints & Non-Negotiables

### Chrome Security Model

- ❌ Extension **cannot** write to system directories directly
- ❌ Extension **cannot** execute shell commands
- ❌ Extension **cannot** modify registry (Windows) or system files
- ✅ Extension **can** trigger file downloads to user Downloads folder
- ✅ Extension **can** bundle files as runtime resources

**Decision:** Use semi-automated installers (user double-clicks, installer handles system-level changes)

### No System-Wide Link Interception

- ❌ Cannot intercept YouTube links from outside Chrome/Brave
- ❌ Cannot intercept without becoming the default handler (contradicts goal)
- **Current Scope:** Chrome navigation only (acceptable trade-off for Phase 1)

### Python Shebang Handling

- **macOS/Linux:** Shebang line specifies exact Python path (auto-detected during install)
- **Windows:** File association handles `python script.py` (no shebang needed)

### No Update Without Re-install

- Native host updates require running installer again
- Extension updates auto-sync via Chrome Web Store
- **Rationale:** Security model; prevents silent execution of system changes

---

## Version Management

### Extension Version

- Defined in `manifest.json` as `"version": "X.Y.Z"`
- Updates auto-deliver via Chrome Web Store

### Native Host Version

- Defined in `native-host/script.py` as `VERSION = "X.Y.Z"`
- Must match extension version for compatibility
- Extension checks via `{"action": "version"}` message
- Mismatch triggers "Update Available" prompt

### Versioning Scheme

- **X (Major):** Breaking changes to native messaging protocol
- **Y (Minor):** Backward-compatible features
- **Z (Patch):** Bug fixes

**Example:** Both extension and native host bundled as 1.0.0

- If extension updates to 1.1.0, native host should also be 1.1.0
- Installers always include native host version matching extension

---

## Testing Strategy

### Unit Tests (Not Implemented - Desktop Extension Framework Limitation)

Native Messaging Framework doesn't support traditional unit testing.

### Integration Tests (Manual - Defined)

**Installation Flow (All Platforms):**

1. Fresh install from Chrome Web Store (in Phase 3)
2. Extension shows "Not Installed" status
3. Download platform-specific installer
4. Run installer (double-click)
5. Verify manifest exists in correct location
6. Extension shows "✅ Installed" status

**Redirection Flow (All Platforms):**

1. Click YouTube link in Chrome
2. Native host receives message
3. URL opens in Brave
4. Chrome tab closes
5. Debug log contains successful response

**Version Mismatch:**

1. Manually downgrade native host version
2. Extension detects mismatch
3. Shows "Update Available" prompt
4. Download and run new installer
5. Extension detects version match

### Debug Logging

- Set environment variable: `export YTB_DEBUG=1`
- Or create flag file: `touch ~/.youtube_redirect_debug_enabled`
- Logs written to `~/youtube_redirect_debug.log`
- **Production:** Debug disabled by default (no log file)

---

## Security Considerations

### URL Validation

- **Requirement:** Only `http://` and `https://` schemes allowed
- **Reason:** Prevent protocol-switching attacks (e.g., `file://`, `ftp://`)
- **Implementation:** Scheme validation in `script.py` before subprocess execution

### Extension Isolation

- Native Messaging API requires explicit `allowed_origins` per extension
- Manifest specifies `chrome-extension://<EXTENSION_ID>/` only
- No other extension can communicate with this native host

### No Admin/Root Execution

- macOS/Linux installers run as user (no sudo)
- Windows installer writes to HKCU (current user registry, no admin)
- Reduces attack surface, better user experience

### Minimal Browser Behavior Modification

- Only intercepts Chrome's own YouTube navigations
- Does not hijack keyboard shortcuts or global hotkeys
- Content script is passive (click detection only, no execution)

---

## Future Enhancements (Out of Current Scope)

- [ ] Support Firefox
- [ ] System-wide link interception (complex, separate project)
- [ ] Settings UI (redirect to different browser, whitelist/blacklist)
- [ ] Analytics (optional, privacy-preserving)
- [ ] Automatic native host update via extension update
- [ ] Support for YouTube alternative domains (YouTube Music, YouTube Shorts)
- [ ] Reverse: Open links in Chrome from Brave

---

## Decision Log

| Date       | Decision                                              | Rationale                                                   |
| ---------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| 2026-03-06 | Semi-automated installers (download + double-click)   | Balances UX simplicity with Chrome security model           |
| 2026-03-06 | Bundle native host in extension package               | Single distribution point, version sync, offline capability |
| 2026-03-06 | No external Python dependencies                       | Simplifies user setup, no package manager required          |
| 2026-03-06 | Platform-specific installers over universal installer | Simpler logic, better UX, handles platform quirks elegantly |
| 2026-03-06 | Version checking via native messaging                 | Enables update detection without external servers           |

---

## Quick Reference: File Locations by Platform

### macOS

```
Native Host Manifest:  ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.example.youtubetobrave.json
Native Host Script:    ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/youtube-to-brave/script.py
Debug Log:             ~/youtube_redirect_debug.log
```

### Windows

```
Native Host Registry:  HKCU\Software\Google\Chrome\NativeMessagingHosts\com.example.youtubetobrave
Native Host Script:    %LOCALAPPDATA%\YouTubeToBrave\script.py
Debug Log:             %USERPROFILE%\youtube_redirect_debug.log
```

### Linux

```
Native Host Manifest:  ~/.config/google-chrome/NativeMessagingHosts/com.example.youtubetobrave.json
Native Host Script:    ~/.config/google-chrome/NativeMessagingHosts/youtube-to-brave/script.py
Debug Log:             ~/youtube_redirect_debug.log
```

---

## Quick Reference: Core APIs

### Chrome Extension APIs Used

```javascript
chrome.webNavigation.onBeforeNavigate.addListener(); // Detect navigations
chrome.tabs.remove(tabId); // Close tab after redirect
chrome.runtime.sendNativeMessage(); // Send to native host
chrome.downloads.download(); // NEW: Download installer
chrome.storage.local.get / set(); // NEW: Cache status
chrome.runtime.getURL(); // NEW: Get bundled file URL
```

### Native Messaging Protocol

```
Format: [4-byte little-endian length][JSON message]
Example Request:  {"url": "https://youtube.com/watch?v=..."}
Example Response: {"status": "ok", "url": "https://youtube.com/watch?v=..."}
```

---

## Glossary

- **SSOT:** Single Source of Truth - this document
- **Native Host:** Python script running on user machine with OS-level access
- **Native Messaging:** Chrome API for extension ↔ native host communication
- **Manifest:** Configuration file for extension (.json) or native host (.json)
- **Shebang:** First line of script specifying interpreter (e.g., `#!/usr/bin/python3`)
- **HKCU:** Windows registry hive for current user (no admin needed)
- **Extension ID:** Unique 32-character identifier assigned by Chrome

---

**Document Status:** APPROVED FOR DEVELOPMENT  
**Next Review:** After Phase 1 completion  
**Maintained By:** Development Team
