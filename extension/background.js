console.log("Background script loaded");

// Listen for top-level navigations to YouTube and redirect to Brave
chrome.webNavigation.onBeforeNavigate.addListener(function (details) {
  console.log("Navigating to:", details.url);
  // Only act on top-level (main-frame) navigations to avoid iframe/embed preloads
  if (details.frameId !== 0) {
    return;
  }

  try {
    const urlObj = new URL(details.url);
    const host = urlObj.hostname || "";
    const isYouTubeHost = host.includes("youtube.com") || host === "youtu.be";

    if (isYouTubeHost && details.tabId && details.tabId !== -1) {
      const tabId = details.tabId;
      const braveUrl = details.url;
      console.log(
        "YouTube URL detected (main frame), will send to native host:",
        tabId,
      );
      console.log("Sending to native host:", braveUrl);
      // Send to native host first, then remove the tab once we have a response
      sendViaNativePort({ url: braveUrl }, function (ok) {
        // ok === true when we received a positive response, false otherwise
        try {
          chrome.tabs.remove(tabId, function () {
            console.log("Removed tab after native host response:", tabId);
          });
        } catch (e) {
          console.warn("Failed to remove tab:", e);
        }
      });
    }
  } catch (err) {
    console.error("Error parsing navigation URL:", err, details.url);
  }
});

function sendViaNativePort(message, callback) {
  // callback(optional): function(ok:boolean)
  try {
    let responded = false;
    // fallback timer in case native host doesn't respond quickly
    const timeout = setTimeout(() => {
      if (!responded) {
        console.warn("Native host response timeout");
        responded = true;
        if (typeof callback === "function") callback(false);
      }
    }, 2000);

    chrome.runtime.sendNativeMessage(
      "com.example.youtubetobrave",
      message,
      (response) => {
        if (chrome.runtime.lastError) {
          // log the whole lastError object for diagnostics
          console.warn(
            "sendNativeMessage lastError:",
            chrome.runtime.lastError,
          );
        }
        if (!responded) {
          responded = true;
          clearTimeout(timeout);
          if (response) {
            console.log("Native host response:", response);
            if (typeof callback === "function") callback(true);
          } else {
            console.log("No response body from native host");
            if (typeof callback === "function") callback(false);
          }
        }
      },
    );
  } catch (err) {
    console.error("Error sending native message:", err, message);
    if (typeof callback === "function") callback(false);
  }
}
