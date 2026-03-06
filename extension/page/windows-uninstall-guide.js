const cmdBlock = document.getElementById("cmdBlock");
const copyBtn = document.getElementById("copyBtn");

const uninstallCmd = `Remove-ItemProperty -Path "HKCU:\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.example.youtubetobrave" -Name "(Default)" -ErrorAction SilentlyContinue; Remove-Item -Path "HKCU:\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.example.youtubetobrave" -Recurse -ErrorAction SilentlyContinue; Remove-Item -Path "$env:LOCALAPPDATA\\YouTubeToBrave" -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "Uninstalled YouTube to Brave native host."`;

// Set code block text
cmdBlock.textContent = uninstallCmd;

// Copy button logic
copyBtn.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(uninstallCmd);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        copyBtn.classList.add("success");
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.classList.remove("success");
        }, 2000);
    } catch (err) {
        console.error("Failed to copy text: ", err);
        copyBtn.textContent = "Failed to copy";
    }
});
