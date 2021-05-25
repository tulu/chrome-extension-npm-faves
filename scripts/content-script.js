/**
 * Script to manage the behaviour on the https://www.npmjs.com/ website
 * defined on the manifest.json file
 * -> "matches": ["https://www.npmjs.com/package/*"]
 *
 * Responsibilities:
 *  - Create link to add or remove from faves.
 *  - Communicate to user about the action.
 *  - Listens to Popup actions to update options.
 */
try {
  if (validatePageContent()) {
    injectStyles();
    addButtonToPage();
  } else {
    console.log("The url is not valid for the content script: " + document.URL);
  }
} catch (error) {
  console.log(error);
}

/**
 * Validate if the current page is valid for the link injection.
 * It could happen that the page loads with a captcha and the script does not
 * find the needed elements to inject the faves link.
 */
function validatePageContent() {
  return document.querySelector("ul[role=tablist]") ? true : false;
}

/**
 * Adds the needed styles for the buttons to the page.
 * The buttons styles are separated in another file "buttons.css".
 * The manifest.json was modified to enable this file through the
 * web_accessible_resources section.
 */
function injectStyles() {
  const styles = [
    chrome.runtime.getURL("./styles/buttons.css"),
    chrome.runtime.getURL("./styles/notifications.css"),
    "https://fonts.googleapis.com/icon?family=Material+Icons|Material+Icons+Outlined",
  ];
  styles.forEach((href) => {
    let link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.getElementsByTagName("head")[0].appendChild(link);
  });
}

/**
 * Adds a link to the page to "add to faves" or "remove from faves" based on
 * the content_script's matches on the manifest.json file.
 */
async function addButtonToPage(message) {
  let packageName = getPackageNameFromUrl();
  if (packageName) {
    // Check if fave already added
    let faves = await storageSyncGet("faves");
    let toAddToFaves =
      faves && faves.find((fave) => fave.name == packageName) ? false : true;
    // Creates the button
    createFavesButton(toAddToFaves, message);
  }
}

/**
 * Creates the "add to faves" or "remove from faves" button on the webpage.
 * @param {boolean} toAddToFaves If set to true indicates that the action
 * should be to add to faves, else should be to remove from faves.
 */
function createFavesButton(toAddToFaves, message) {
  // Check to see if button already exists
  let faveButton = document.querySelector("#npmFavesLink");

  // If exists remove the button
  if (faveButton) {
    faveButton.parentNode.removeChild(faveButton);
  }

  // Create the button
  faveButton = getFaveButtonElement(toAddToFaves, message);
  faveLink = faveButton.querySelector("a");
  let notificationCloseButton = faveButton.querySelector(
    "#npmfNotificationCloseButton"
  );

  // Add click event to link
  faveLink.addEventListener("click", handleFaveLinkClick);
  notificationCloseButton.addEventListener("click", function () {
    this.parentElement.style.display = "none";
  });

  // Add button to the page
  // This could break if the npmjs page changes
  document
    .querySelector("ul[role=tablist]")
    .parentElement.children[0].children[0].append(faveButton);
}

/**
 * Generates the faves button from a html template using a boolean parameter
 * for its configuration.
 * @param {boolean} toAddToFaves If set to true indicates that the action
 * should be to add to faves, else should be to remove from faves.
 * @returns {object} The button element.
 */
function getFaveButtonElement(toAddToFaves, message) {
  let faveButtonAction = "addToFaves",
    faveButtonText = "Add to faves",
    faveButtonIcon = "add",
    faveButtonClass = "npmf_confirm-button";

  if (!toAddToFaves) {
    faveButtonAction = "removeFromFaves";
    faveButtonText = "Remove from faves";
    faveButtonIcon = "delete";
    faveButtonClass = "npmf_cancel-button";
  }

  let notificationDisplay = message ? "display:block" : "display:none";

  let buttonHtml = `<div id="npmFavesLink" class="npmf_button ${faveButtonClass}">
    <a class="pack-unfave" fave-action="${faveButtonAction}">
      <span class="material-icons-outlined">${faveButtonIcon}</span>
      ${faveButtonText}
    </a>
    <div id="npmfNotification" class="npmf_notification_site" style="${notificationDisplay}">
      <span id="npmfNotificationCloseButton" class="npmf_notification-close"
        >&times;</span
      >
      <span id="npmfNotificationMessage">${message}</span>
    </div>
  </div>`;

  let tempDiv = document.createElement("div");
  tempDiv.innerHTML = buttonHtml.trim();

  return tempDiv.firstChild;
}

/**
 * Add to faves / Remove from faves click event handler.
 */
async function handleFaveLinkClick() {
  // Get the action to perform
  let packageName = getPackageNameFromUrl();
  if (packageName) {
    let action = this.getAttribute("fave-action");
    let faves = await storageSyncGet("faves");
    if (!faves) {
      faves = [];
    }
    if (action == "addToFaves") {
      let package = await getPackageInfoByName(packageName);
      faves.push(package);
    } else {
      faves = faves.filter((item) => item.name !== packageName);
    }
    faves.sort((a, b) => (a.name > b.name ? 1 : -1));
    await storageSyncSet({ faves: faves });
    let message = "Package added to faves :)";
    if (action != "addToFaves") {
      message = "Package removed from faves :(";
    }
    addButtonToPage(message);
  }
}

/**
 * Gets the name of the package from the URL.
 * @returns {string} The name of the package.
 */
function getPackageNameFromUrl() {
  let splitted = document.location.href.split("package/");
  if (splitted.length == 2) {
    return splitted[1];
  }
  return null;
}

/**
 * The following listeners manage events to update the to fave or not to fave
 * link based on the extension's pop up interactions (currently unfave).
 * The interaction with the pop up can happen whether the tab is active or not.
 *  - If the tab is active the "onMessage" event is executed (popup.js sends
 *    the message).
 *  - If the tab is inactive the "visibilitychange" event is used when the tab
 *    gets focus.
 */

/**
 * Listens for messages from the pop up regarding removing from faves.
 * Works when the tab is active.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action == "remove") {
    if (message.packageName == getPackageNameFromUrl()) {
      addButtonToPage("Package removed from faves :(");
    }
  }
});

/**
 * Listens for visibility change events of the tab to update the link.
 * Works when the tab was inactive during fave removal through the pop up.
 */
document.addEventListener("visibilitychange", function (e) {
  if (!document.hidden) {
    var pattern = /https:\/\/www.npmjs.com\/package\//;
    if (pattern.test(window.location.href)) {
      addButtonToPage();
    }
  }
});
