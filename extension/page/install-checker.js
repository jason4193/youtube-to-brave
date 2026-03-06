// ── install-checker.js ──────────────────────────────────
// Detection logic and UI updates for the install status page.
// Loaded by install.html — runs in popup context.

const NATIVE_HOST = "com.example.youtubetobrave";
const MAC_INSTALLER_PATH = "native-host/install-macos.command";
const MAC_NATIVE_SCRIPT_PATH = "native-host/script.py";
const MAC_GUIDE_PAGE = "page/mac-install-guide.html";
const MAC_UNINSTALL_GUIDE_PAGE = "page/mac-uninstall-guide.html";

const WIN_INSTALLER_PATH = "native-host/install-windows.bat";
const WIN_NATIVE_SCRIPT_PATH = "native-host/script.py";
const WIN_GUIDE_PAGE = "page/windows-install-guide.html";
const WIN_UNINSTALL_GUIDE_PAGE = "page/windows-uninstall-guide.html";

// ── DOM refs ──────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const body = document.body;

const heroLabel = $("heroLabel");
const platformIcon = $("platformIcon");
const platformName = $("platformName");
const platformBadge = $("platformBadge");
const versionHost = $("versionHost");
const versionExt = $("versionExt");
const btnDownload = $("btnDownload");
const btnDownloadText = $("btnDownloadText");
const btnDiag = $("btnDiag");
const diagOutput = $("diagOutput");
const btnSettings = $("btnSettings");
const settingsMenu = $("settingsMenu");

let currentPlatform = "Unknown";

// ── Platform Detection ────────────────────────────────────
function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("linux")) return "Linux";
  return "Unknown";
}

function showPlatformIcon(platform) {
  const icons = { macOS: "iconMac", Windows: "iconWin", Linux: "iconLinux" };
  // Hide all icons first
  ["iconMac", "iconWin", "iconLinux"].forEach((id) => {
    const el = $(id);
    if (el) el.style.display = "none";
  });
  // Show the matching icon
  const target = $(icons[platform]);
  if (target) target.style.display = "";
}

// ── Extension Version ─────────────────────────────────────
function getExtensionVersion() {
  try {
    return chrome.runtime.getManifest().version;
  } catch (e) {
    return "?.?.?";
  }
}

// ── Native Host Check ─────────────────────────────────────
function checkNativeHost() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({
        ok: false,
        error: "timeout",
        message: "No response within 3 seconds",
      });
    }, 3000);

    try {
      chrome.runtime.sendNativeMessage(
        NATIVE_HOST,
        { action: "version" },
        (response) => {
          clearTimeout(timeout);
          if (chrome.runtime.lastError) {
            const msg = chrome.runtime.lastError.message || "Unknown error";
            resolve({ ok: false, error: "lastError", message: msg });
            return;
          }
          if (response && response.status === "ok") {
            resolve({
              ok: true,
              version: response.version || "unknown",
              response,
            });
          } else if (response) {
            // Legacy host without version support — still connected
            resolve({
              ok: true,
              version: response.version || "legacy",
              response,
            });
          } else {
            resolve({
              ok: false,
              error: "empty",
              message: "Empty response from native host",
            });
          }
        },
      );
    } catch (e) {
      clearTimeout(timeout);
      resolve({ ok: false, error: "exception", message: e.message });
    }
  });
}

// ── UI State Transitions ──────────────────────────────────
function setStatus(status) {
  // status: "not-installed" | "checking" | "active"
  body.setAttribute("data-status", status);

  const labels = {
    "not-installed": "Not Installed",
    checking: "Checking",
    active: "Active",
  };
  heroLabel.textContent = labels[status] || status;
}

function showDownloadButton(shouldShow) {
  btnDownload.classList.toggle("hidden", !shouldShow);
}

function setDownloadButtonLoading(isLoading, text) {
  btnDownload.disabled = isLoading;
  if (text) {
    btnDownloadText.textContent = text;
  }
}

function downloadResource(resourcePath, filename) {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(
      {
        url: chrome.runtime.getURL(resourcePath),
        filename,
        saveAs: false,
        conflictAction: "uniquify",
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(downloadId);
      },
    );
  });
}

async function downloadMacBundle() {
  await downloadResource(
    MAC_INSTALLER_PATH,
    "YouTubeToBrave/install-macos.command",
  );
  await downloadResource(MAC_NATIVE_SCRIPT_PATH, "YouTubeToBrave/script.py");
}

async function downloadWinBundle() {
  await downloadResource(
    WIN_INSTALLER_PATH,
    "YouTubeToBrave/install-windows.bat",
  );
  await downloadResource(WIN_NATIVE_SCRIPT_PATH, "YouTubeToBrave/script.py");
}

function openGuidePage(baseUrl, includeExtId = false) {
  const urlParams = includeExtId ? `?extId=${encodeURIComponent(chrome.runtime.id)}` : "";
  const url = chrome.runtime.getURL(`${baseUrl}${urlParams}`);

  if (chrome.tabs && chrome.tabs.create) {
    chrome.tabs.create({ url });
    return;
  }

  window.open(url, "_blank");
}

// ── Diagnostics ───────────────────────────────────────────
async function runDiagnostics() {
  diagOutput.classList.add("visible");
  diagOutput.textContent = "Running diagnostics...\n";

  const platform = detectPlatform();
  const extVersion = getExtensionVersion();

  diagOutput.textContent += `Platform:    ${platform}\n`;
  diagOutput.textContent += `Extension:   v${extVersion}\n`;
  diagOutput.textContent += `Native Host: ${NATIVE_HOST}\n`;
  diagOutput.textContent += `\nConnecting to native host...\n`;

  const result = await checkNativeHost();

  if (result.ok) {
    diagOutput.textContent += `Status:      Connected\n`;
    diagOutput.textContent += `Host Ver:    ${result.version}\n`;
    if (result.response) {
      diagOutput.textContent += `Response:    ${JSON.stringify(result.response)}\n`;
    }
  } else {
    diagOutput.textContent += `Status:      Failed\n`;
    diagOutput.textContent += `Error:       ${result.error}\n`;
    diagOutput.textContent += `Message:     ${result.message}\n`;

    // Platform-specific hints
    if (result.message && result.message.includes("not found")) {
      diagOutput.textContent += `\nHint: Native host manifest not found.\n`;
      if (platform === "macOS") {
        diagOutput.textContent += `Expected at: ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/${NATIVE_HOST}.json\n`;
      } else if (platform === "Windows") {
        diagOutput.textContent += `Expected at: HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${NATIVE_HOST}\n`;
      } else if (platform === "Linux") {
        diagOutput.textContent += `Expected at: ~/.config/google-chrome/NativeMessagingHosts/${NATIVE_HOST}.json\n`;
      }
    }
  }
}

// ── Init ──────────────────────────────────────────────────
async function init() {
  // 1. Platform
  const platform = detectPlatform();
  currentPlatform = platform;
  showPlatformIcon(platform);
  platformName.textContent = platform;
  const supported = ["macOS", "Windows"].includes(platform);
  if (supported) {
    platformBadge.style.display = "";
    platformBadge.textContent = "Supported";
    platformBadge.className = "badge badge-green";
    btnDownload.disabled = false;
    btnDownload.title = `Download the native host installer for ${platform}`;
    if (btnDownloadText.textContent === "macOS only (coming soon)") {
      btnDownloadText.textContent = "Download Installer";
    }
  } else {
    platformBadge.style.display = "";
    platformBadge.textContent = "Coming Soon";
    platformBadge.className = "badge badge-gray";
    btnDownload.disabled = true;
    btnDownload.title = "Installer is not available for your platform";
    btnDownloadText.textContent = "macOS/Windows only";
  }

  // 2. Extension version
  const extVer = getExtensionVersion();
  versionExt.textContent = extVer;

  // 3. Start checking
  setStatus("checking");
  versionHost.textContent = "...";

  const result = await checkNativeHost();

  if (result.ok) {
    setStatus("active");
    versionHost.textContent = result.version;

    // Check version mismatch
    if (
      result.version !== "unknown" &&
      result.version !== "legacy" &&
      result.version !== extVer
    ) {
      versionHost.classList.add("mismatch");
      versionHost.title =
        "Version mismatch — consider updating the native host";
      btnDownloadText.textContent = "Update Installer";
      showDownloadButton(true);
    } else {
      showDownloadButton(false);
    }
  } else {
    setStatus("not-installed");
    versionHost.textContent = "N/A";
    showDownloadButton(true);
  }

  // 4. Settings menu
  if (settingsMenu) {
    settingsMenu.innerHTML = ""; // clear any existing items
    const addMenuItem = (text, onClick) => {
      const btn = document.createElement("button");
      btn.className = "settings-item";
      btn.textContent = text;
      btn.addEventListener("click", () => {
        onClick();
        settingsMenu.classList.remove("visible");
      });
      settingsMenu.appendChild(btn);
    };

    if (platform === "macOS") {
      addMenuItem("Open macOS install guide", () => openGuidePage(MAC_GUIDE_PAGE, true));
      addMenuItem("Open macOS uninstall guide", () => openGuidePage(MAC_UNINSTALL_GUIDE_PAGE));
    } else if (platform === "Windows") {
      addMenuItem("Open Windows install guide", () => openGuidePage(WIN_GUIDE_PAGE, true));
      addMenuItem("Open Windows uninstall guide", () => openGuidePage(WIN_UNINSTALL_GUIDE_PAGE));
    } else {
      addMenuItem("Open macOS install guide", () => openGuidePage(MAC_GUIDE_PAGE, true));
      addMenuItem("Open macOS uninstall guide", () => openGuidePage(MAC_UNINSTALL_GUIDE_PAGE));
      addMenuItem("Open Windows install guide", () => openGuidePage(WIN_GUIDE_PAGE, true));
      addMenuItem("Open Windows uninstall guide", () => openGuidePage(WIN_UNINSTALL_GUIDE_PAGE));
    }
  }
}

// ── Event Listeners ───────────────────────────────────────
btnDiag.addEventListener("click", () => {
  runDiagnostics();
});

if (btnSettings && settingsMenu) {
  btnSettings.addEventListener("click", () => {
    settingsMenu.classList.toggle("visible");
  });

  document.addEventListener("click", (event) => {
    const clickedInsideMenu = settingsMenu.contains(event.target);
    const clickedSettingsButton = btnSettings.contains(event.target);
    if (!clickedInsideMenu && !clickedSettingsButton) {
      settingsMenu.classList.remove("visible");
    }
  });
}

btnDownload.addEventListener("click", () => {
  if (!["macOS", "Windows"].includes(currentPlatform)) {
    btnDownloadText.textContent = "macOS/Windows only";
    return;
  }

  (async () => {
    try {
      setDownloadButtonLoading(true, `Downloading ${currentPlatform} installer...`);
      if (currentPlatform === "macOS") {
        await downloadMacBundle();
        setDownloadButtonLoading(false, "Downloaded — Opening setup guide...");
        openGuidePage(MAC_GUIDE_PAGE, true);
      } else if (currentPlatform === "Windows") {
        await downloadWinBundle();
        setDownloadButtonLoading(false, "Downloaded — Opening setup guide...");
        openGuidePage(WIN_GUIDE_PAGE, true);
      }
      setTimeout(() => {
        btnDownloadText.textContent = "Download Installer";
      }, 2500);
    } catch (error) {
      setDownloadButtonLoading(false, "Download failed — Retry");
      if (diagOutput) {
        diagOutput.classList.add("visible");
        diagOutput.textContent = `Download error: ${error.message}`;
      }
    }
  })();
});

// ── Boot ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", init);
