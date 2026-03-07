// ── uninstall-guide.js ────────────────────────────────────
// Unified uninstall guide for all platforms (macOS, Windows, Linux).
// Uses URL parameter ?platform=macos|windows|linux to determine platform.

// ── Platform Configuration ─────────────────────────────────
const PLATFORM_CONFIG = {
  macos: {
    displayName: "macOS",
    title: "Uninstall Native Host (macOS)",
    subtitle: "Use these commands in Terminal to fully remove the native host before a clean reinstall.",
    uninstallTitle: "Run Uninstall Commands",
    commandsBuilder: () => [
      'rm -f "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.example.youtubetobrave.json"',
      'rm -rf "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts/youtube-to-brave"',
    ],
    copyButtonText: "Copy Commands",
    showDetails: false,
    details: null,
  },
  windows: {
    displayName: "Windows",
    title: "Uninstall Native Host (Windows)",
    subtitle: "Run the following command in PowerShell to remove the native host.",
    uninstallTitle: "Uninstall Command",
    commandsBuilder: () => [
      'Remove-ItemProperty -Path "HKCU:\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.example.youtubetobrave" -Name "(Default)" -ErrorAction SilentlyContinue; Remove-Item -Path "HKCU:\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.example.youtubetobrave" -Recurse -ErrorAction SilentlyContinue; Remove-Item -Path "$env:LOCALAPPDATA\\YouTubeToBrave" -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "Uninstalled YouTube to Brave native host."',
    ],
    copyButtonText: "Copy Command",
    showDetails: true,
    details: [
      'Removes the registry key <span class="inline-code">HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.example.youtubetobrave</span>',
      'Deletes the installation folder at <span class="inline-code">%LOCALAPPDATA%\\YouTubeToBrave</span>',
    ],
  },
  linux: {
    displayName: "Linux",
    title: "Uninstall Native Host (Linux)",
    subtitle: "Use these commands in Terminal to fully remove the native host.",
    uninstallTitle: "Run Uninstall Commands",
    commandsBuilder: () => [
      'rm -f "$HOME/.config/google-chrome/NativeMessagingHosts/com.example.youtubetobrave.json"',
      'rm -rf "$HOME/.config/google-chrome/NativeMessagingHosts/youtube-to-brave"',
    ],
    copyButtonText: "Copy Commands",
    showDetails: false,
    details: null,
  },
};

// ── Utility Functions ──────────────────────────────────────
function getPlatform() {
  const params = new URLSearchParams(window.location.search);
  const platform = params.get("platform");
  return platform && PLATFORM_CONFIG[platform] ? platform : "macos"; // default to macOS
}

function renderCommandsUI(commands, buttonText) {
  return `
    <pre id="cmdBlock" class="cmd">${commands}</pre>
    <button id="copyBtn" class="btn">${buttonText}</button>
  `;
}

function setupCopyButton(commands, buttonText) {
  const copyBtn = document.getElementById("copyBtn");
  if (!copyBtn) return;

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(commands);
      copyBtn.textContent = "Copied!";
      copyBtn.classList.add("success");
      setTimeout(() => {
        copyBtn.textContent = buttonText;
        copyBtn.classList.remove("success");
      }, 2000);
    } catch (error) {
      console.error("Failed to copy text: ", error);
      copyBtn.textContent = "Failed to copy";
      setTimeout(() => {
        copyBtn.textContent = buttonText;
      }, 2000);
    }
  });
}

// ── Initialization ─────────────────────────────────────────
function init() {
  const platform = getPlatform();
  const config = PLATFORM_CONFIG[platform];

  // Update page title and subtitle
  document.title = config.title;
  document.getElementById("pageTitle").textContent = config.title;
  document.getElementById("pageSubtitle").textContent = config.subtitle;

  // Update uninstall section title
  document.getElementById("uninstallTitle").textContent = config.uninstallTitle;

  // Render uninstall commands
  const commands = config.commandsBuilder().join("\n");
  const uninstallContent = document.getElementById("uninstallContent");
  uninstallContent.innerHTML = renderCommandsUI(commands, config.copyButtonText);
  setupCopyButton(commands, config.copyButtonText);

  // Show details section if configured
  if (config.showDetails && config.details) {
    const detailsSection = document.getElementById("detailsSection");
    const detailsList = document.getElementById("detailsList");
    detailsSection.style.display = "";
    config.details.forEach((detail) => {
      const li = document.createElement("li");
      li.innerHTML = detail;
      detailsList.appendChild(li);
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
