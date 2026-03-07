// ── install-guide.js ──────────────────────────────────────
// Unified install guide for all platforms (macOS, Windows, Linux).
// Uses URL parameter ?platform=macos|windows|linux to determine platform.

// ── Platform Configuration ─────────────────────────────────
const PLATFORM_CONFIG = {
  macos: {
    displayName: "macOS",
    title: "Install Native Host (macOS)",
    subtitle: 'Files were downloaded to <strong>~/Downloads/YouTubeToBrave</strong>. Run these commands in Terminal.',
    installType: "commands", // "commands" or "executable"
    commandsBuilder: (extId) => [
      "cd ~/Downloads/YouTubeToBrave",
      "chmod +x install-macos.command",
      `./install-macos.command ${extId}`,
    ],
    copyButtonText: "Copy Commands",
    additionalInstructions: null,
  },
  windows: {
    displayName: "Windows",
    title: "Install Native Host (Windows)",
    subtitle: 'Files were downloaded to <strong>Downloads\\YouTubeToBrave</strong>.',
    installType: "executable", // "commands" or "executable"
    commandsBuilder: null,
    copyButtonText: null,
    additionalInstructions: {
      html: `
        <p>Locate the downloaded folder and double-click <strong>install-windows.bat</strong> to complete the setup.</p>
        <p class="note" style="margin-top: 1rem; font-size: 0.9em; opacity: 0.8;">
          <em>Note:</em> If Windows SmartScreen prompts "Windows protected your PC", click <strong>More info</strong> 
          and then <strong>Run anyway</strong>.
        </p>
      `,
    },
  },
  linux: {
    displayName: "Linux",
    title: "Install Native Host (Linux)",
    subtitle: 'Files were downloaded to <strong>~/Downloads/YouTubeToBrave</strong>. Run these commands in Terminal.',
    installType: "commands",
    commandsBuilder: (extId) => [
      "cd ~/Downloads/YouTubeToBrave",
      "chmod +x install-linux.sh",
      `./install-linux.sh ${extId}`,
    ],
    copyButtonText: "Copy Commands",
    additionalInstructions: null,
  },
};

// ── Utility Functions ──────────────────────────────────────
function getExtId() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("extId");
  return fromQuery || chrome.runtime.id;
}

function getPlatform() {
  const params = new URLSearchParams(window.location.search);
  const platform = params.get("platform");
  return platform && PLATFORM_CONFIG[platform] ? platform : "macos"; // default to macOS
}

function renderCommandsUI(config, extId) {
  const commands = config.commandsBuilder(extId).join("\n");
  return `
    <pre id="cmdBlock" class="cmd">${commands}</pre>
    <button id="copyBtn" class="btn">${config.copyButtonText}</button>
  `;
}

function renderExecutableUI(config) {
  return config.additionalInstructions.html;
}

function setupCopyButton(commands) {
  const copyBtn = document.getElementById("copyBtn");
  if (!copyBtn) return;

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(commands);
      copyBtn.textContent = "Copied";
      setTimeout(() => {
        copyBtn.textContent = PLATFORM_CONFIG[getPlatform()].copyButtonText;
      }, 1400);
    } catch (error) {
      copyBtn.textContent = "Copy failed";
      setTimeout(() => {
        copyBtn.textContent = PLATFORM_CONFIG[getPlatform()].copyButtonText;
      }, 1400);
    }
  });
}

// ── Initialization ─────────────────────────────────────────
function init() {
  const platform = getPlatform();
  const config = PLATFORM_CONFIG[platform];
  const extId = getExtId();

  // Update page title and subtitle
  document.title = config.title;
  document.getElementById("pageTitle").textContent = config.title;
  document.getElementById("pageSubtitle").innerHTML = config.subtitle;

  // Display extension ID
  document.getElementById("extId").textContent = extId;

  // Render installation instructions based on type
  const instructionContent = document.getElementById("instructionContent");
  if (config.installType === "commands") {
    instructionContent.innerHTML = renderCommandsUI(config, extId);
    const commands = config.commandsBuilder(extId).join("\n");
    setupCopyButton(commands);
  } else if (config.installType === "executable") {
    instructionContent.innerHTML = renderExecutableUI(config);
  }
}

document.addEventListener("DOMContentLoaded", init);
