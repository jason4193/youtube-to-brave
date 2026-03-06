function getExtId() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("extId");
  return fromQuery || chrome.runtime.id;
}

function buildCommands(extId) {
  return [
    "cd ~/Downloads/YouTubeToBrave",
    "chmod +x install-macos.command",
    `./install-macos.command ${extId}`,
  ].join("\n");
}

function init() {
  const extId = getExtId();
  const extIdEl = document.getElementById("extId");
  const cmdBlock = document.getElementById("cmdBlock");
  const copyBtn = document.getElementById("copyBtn");

  extIdEl.textContent = extId;
  const commands = buildCommands(extId);
  cmdBlock.textContent = commands;

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(commands);
      copyBtn.textContent = "Copied";
      setTimeout(() => {
        copyBtn.textContent = "Copy Commands";
      }, 1400);
    } catch (error) {
      copyBtn.textContent = "Copy failed";
      setTimeout(() => {
        copyBtn.textContent = "Copy Commands";
      }, 1400);
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
