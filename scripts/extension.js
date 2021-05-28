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
 *  - Add / Remove fave
 *    -  onMessage event sent from the content script.
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

/**
 * Listens for messages from the content script to add or remove a package.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      await handlePackage(message.action, message.packageName);
      sendResponse({ result: true });
    } catch (error) {
      console.log(error);
      sendResponse({ result: false });
    }
  })();
  return true; // <-- Keeps the connection open.
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
  let faves = await npmFaves.storage.getFaves();
  let favesCount = faves.length > 0 ? faves.length.toString() : "";
  chrome.action.setBadgeText({
    text: favesCount,
  });
  chrome.action.setBadgeBackgroundColor({ color: "#C90813" }, () => {});
}

/**
 * Adds or removes a fave according to the action.
 * @param {string} action The action to perform (add | remove).
 * @param {string} packageName The name of the package.
 */
async function handlePackage(action, packageName) {
  try {
    if (action == "add") {
      // Add the package to faves
      await npmFaves.storage.addFave(packageName);
    } else if (action == "remove") {
      // Remove the package from faves
      await npmFaves.storage.removeFave(packageName);
    }
  } catch (error) {
    console.log(error);
  }
}
