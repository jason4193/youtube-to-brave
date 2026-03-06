function buildCommands() {
  return [
    'rm -f "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.example.youtubetobrave.json"',
    'rm -rf "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts/youtube-to-brave"',
  ].join("\n");
}

function init() {
  const cmdBlock = document.getElementById("cmdBlock");
  const copyBtn = document.getElementById("copyBtn");

  const commands = buildCommands();
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
