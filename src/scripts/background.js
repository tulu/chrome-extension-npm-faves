/**
 * Main script running in the background.
 *
 * Responsibilities:
 *  - Show readme file:
 *    -  onInstalled event from the extension.
 *  - Handle the toolbar button based on the tab navigation.
 *    - onInstalled
 *    - storage.onChanged
 *    - tabs.onActivated
 *    - tabs.onUpdated
 *  - Reload npmjs.com tabs:
 *    -  onInstalled event from the extension.
 *  - Add / Remove fave:
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
  await updateToolbarButton();
});

/**
 * Listens for onChanged event from the storage to update the badge.
 */
chrome.storage.onChanged.addListener(async function (changes, areaName) {
  if (changes && changes.faves) {
    await updateToolbarButton();
  }
});

/**
 * Listens for messages from the content script to add or remove a package.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      await handlePackage(message.action, message.packageName);
      sendResponse({ result: true, action: message.action });
    } catch (error) {
      console.log(error);
      sendResponse({ result: false });
    }
  })();
  return true; // <-- Keeps the connection open.
});

/**
 * Listens to tab onActivated event to check if the site is npmjs.com.
 * Ref.: Fires when the active tab in a window changes.
 */
chrome.tabs.onActivated.addListener(function (activeInfo) {
  (async () => {
    try {
      updateToolbarButton();
    } catch (error) {
      console.log(error);
    }
  })();
});

/**
 * Listens to tab onUpdated event to check if the site is npmjs.com.
 * Ref.: Fired when a tab is updated.
 */
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  (async () => {
    try {
      // Check if completed, active
      if (changeInfo.status && changeInfo.status == "complete" && tab.active) {
        updateToolbarButton();
      }
    } catch (error) {
      console.log(error);
    }
  })();
});

// Functions <<<==============================================================

/**
 * Shows the readme file in a new tab.
 */
function showReadme() {
  let url = chrome.runtime.getURL("views/readme.html");
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

/**
 * Updates the extension's toolbar button image and badge based on the current
 * active url.
 */
async function updateToolbarButton() {
  try {
    const validUrls = [
      "https://www.npmjs.com", // npmjs.com site
      `chrome-extension://${chrome.runtime.id}`, // extension's url
      "chrome://extensions/", // extension management
    ];
    // Get the current tab
    const tab = await getCurrentTab();
    const index = validUrls.findIndex((url) => {
      return tab.url.startsWith(url);
    }, tab);
    if (index == 0) {
      // The active tab is npmjs.com
      // Check the package in the url
      let packageName = npmFaves.helpers.getUrlPartAfterToken(
        tab.url,
        "package/"
      );
      if (packageName) {
        // Check if package is faved
        const fave = await npmFaves.storage.getFave(packageName, false);
        if (fave) {
          // The package is already faved
          // Show a colored icon with a green badge and a "tick" sign
          changeToolbarButtonStyle(true, "✓", "#6aa84fff");
        } else {
          // The package is NOT faved yet
          // Show a colored icon with a blue badge and a "plus" sign
          changeToolbarButtonStyle(true, "+", "#3c78d8ff");
        }
      } else {
        // The url is npmjs.com but not a package page
        // Show a colored icon with the number of faved packages in the badge
        let faves = await npmFaves.storage.getFaves();
        let favesCount = faves.length > 0 ? faves.length.toString() : "";
        changeToolbarButtonStyle(true, favesCount, "#cb3837ff");
      }
    } else if (index == 1 || index == 2) {
      // The active tab is the extension or the chrome extensions management
      // Show a colored icon with no badge
      changeToolbarButtonStyle(true);
    } else {
      // The active tab is not valid for the extension
      // Show a "disabled" icon with no badge
      changeToolbarButtonStyle(false);
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Changes the styles of the button in the toolbar.
 * @param {boolean} enabled Show enabled or disabled icon.
 * @param {string} badgeText The text to show in the badge. Empty by default.
 * @param {string} badgeBackground The background color of the badge. Empty by
 * default.
 */
function changeToolbarButtonStyle(
  enabled,
  badgeText = "",
  badgeBackground = "#fff"
) {
  let iconPath = "../images/npm-faves-logo-32.png";
  if (!enabled) {
    iconPath = "../images/npm-faves-logo-grey-32.png";
  }
  // Change the badge icon
  chrome.action.setIcon({ path: iconPath });
  // Change the badge text
  chrome.action.setBadgeText({
    text: badgeText,
  });
  // Change the badge background color
  chrome.action.setBadgeBackgroundColor({ color: badgeBackground });
}

/**
 * Gets the current active tab.
 * @returns {Tab} The current tab.
 */
async function getCurrentTab() {
  let tab = null;
  try {
    const queryOptions = { active: true, currentWindow: true };
    [tab] = await chrome.tabs.query(queryOptions);
  } catch (error) {
    // There is a fancy error in chrome 91: 
    // “Tabs cannot be edited right now (user may be dragging a tab)”
    // By adding a timeout and calling the api again it works...
    await timeout(100);
    tab = getCurrentTab();
  }
  return tab;
}

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
