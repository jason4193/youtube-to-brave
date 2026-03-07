# Privacy Policy — YouTube to Brave Redirector

Last updated: March 7, 2026

## Summary

YouTube to Brave Redirector is designed to work locally on your device.

- The extension detects YouTube navigation in Chrome and sends only the URL needed to open it in Brave.
- The native host script receives that URL through Chrome Native Messaging and opens Brave locally.
- No analytics, tracking, account login, cloud sync, or external API calls are used by this project.

## Data we process

### Extension

The extension may process:

- YouTube page URLs from `youtube.com` and `youtu.be` when navigation happens in Chrome.
- Your platform type (macOS/Windows/Linux) for installer guidance in the popup UI.
- Extension version and native host version for compatibility checks.

The extension may download local installer files (`install-macos.command`, `install-windows.bat`, and `script.py`) to your Downloads folder only when you click the installer button.

### Native host script

The native host script may process:

- The URL provided by the extension (expected `http` or `https`) to open Brave.
- Version-check messages from the extension.

The script validates URL scheme and ignores unsupported input.

## What we do **not** collect

- We do not collect personal identity data.
- We do not send browsing data to external servers.
- We do not sell or share data with third parties.
- We do not run remote code or download executable code at runtime.

## Storage and retention

By default, data is **not stored** persistently.

- Extension: no telemetry or browsing history database is maintained.
- Native host: no logs are persisted in normal mode.

### Debug mode (optional, off by default)

If debug mode is explicitly enabled by the user (`YTB_DEBUG=1` or marker file), the native host writes diagnostic logs to:

- `~/youtube_redirect_debug.log` (macOS/Linux path shown by script behavior)

These logs are local to your device and can be deleted by the user at any time.

## Permissions rationale

- `webNavigation`: detect navigations to YouTube links.
- `nativeMessaging`: send URL/version messages to local native host.
- `downloads`: save installer files when the user explicitly requests install.
- `tabs`: close the original Chrome tab only after a successful handoff to native host.
- Host permissions (`youtube.com`, `youtu.be`): limit behavior to YouTube domains.

## User control

- You can remove the extension at any time in `chrome://extensions`.
- You can uninstall the native host using provided uninstall guidance pages.
- You can disable debug logging (default) and remove debug log files manually.

## Contact

Project homepage / support:

- https://github.com/jason4193/youtube-to-brave
