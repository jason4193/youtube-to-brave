console.log("Content script loaded");
document.addEventListener("click", function (e) {
  // Ensure the clicked element is a link (<a> tag) and has an href
  if (e.target.tagName === "A" && e.target.href) {
    const href = e.target.href;
    // Check if the link is to YouTube (includes youtube.com, youtu.be, or shorts)
    if (href.includes("youtube.com") || href.includes("youtu.be")) {
      console.log("YouTube link clicked:", href);
      // Note: The webNavigation listener in background.js will handle the redirect
      // This content script is available for future expansions or user-initiated interception
    }
  }
});
