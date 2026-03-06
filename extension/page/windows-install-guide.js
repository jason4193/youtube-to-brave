document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const extId = urlParams.get("extId");

    const extIdEl = document.getElementById("extId");
    if (extIdEl) {
        if (extId) {
            extIdEl.textContent = extId;
        } else {
            extIdEl.textContent = "Not specified. Please find it in chrome://extensions";
            extIdEl.classList.remove("inline-code");
        }
    }
});
