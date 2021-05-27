/**
 * Main script running in the background.
 *
 * Responsibilities:
 *  - Show readme file:
 *    -  onInstalled event from the extension.
 *  - Update the badge of the extension with the number of faves:
 *    -  onInstalled event from the extension.
 *    -  onChanged event from the storage.
 *  - Reload npmjs.com tabs:
 *    -  onInstalled event from the extension.
 */

// Event listeners <<<=========================================================

/**
 * Listens for onInstalled events of the extension to show the readme file and
 * update the badge.
 */
chrome.runtime.onInstalled.addListener(async function (reason) {
  // Shows readme file only when the installed reason is INSTALL
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    showReadme();
  }
  await reloadNpmTabs();
  await updateFavesBadgeWithQuantity();
});

/**
 * Listens for onChanged event from the storage to update the badge.
 */
chrome.storage.onChanged.addListener(async function (changes, areaName) {
  if (changes && changes.faves) {
    await updateFavesBadgeWithQuantity();
  }
});


// Functions <<<==============================================================
 
/**
 * Shows the readme file in a new tab.
 */
 function showReadme() {
  let url = chrome.runtime.getURL("readme.html");
  chrome.tabs.create({ url });
}

/**
 * Reloads the tabs that match the npmjs site.
 * This fixes the "Extension context invalidated error" when updating the 
 * extension. 😎
 */
async function reloadNpmTabs() {
  const tabs = await chrome.tabs.query({
    currentWindow: true,
    url: "*://www.npmjs.com/*",
  });

  tabs.forEach((tab) => {
    chrome.tabs.reload(tab.id);
  });
}

/**
 * Updates the number of faved packages in the badge of the extension.
 */
 async function updateFavesBadgeWithQuantity() {
  let faves = await storageSyncGet("faves");
  let favesCount = faves && faves.length > 0 ? faves.length.toString() : "";
  chrome.action.setBadgeText({
    text: favesCount,
  });
  chrome.action.setBadgeBackgroundColor({ color: "#C90813" }, () => {});
}