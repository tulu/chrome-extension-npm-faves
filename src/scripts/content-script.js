/**
 * Script to manage the behaviour on the https://www.npmjs.com/ website
 * defined on the manifest.json file.
 * -> "matches": ["https://www.npmjs.com/package/*"]
 *
 * Responsibilities:
 *  - Create link to add or remove from faves.
 *  - Communicate to user about the action.
 *  - Listens to Popup actions to update options.
 *  - Sends Add / Remove message to service worker
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
 * @param {string} message The message to show to the user.
 */
async function addButtonToPage(message) {
  try {
    // Get the name of the package
    let packageName = npmFaves.helpers.getUrlPartAfterToken(
      document.location.href,
      "package/"
    );
    // Get the package from the storage with false as second parameter
    // to not retrieve the updated information from the registry.
    const fave = await npmFaves.storage.getFave(packageName, false);
    let toAddToFaves = fave ? false : true;
    // Creates the button
    createFavesButton(toAddToFaves);
    // Show message if exists
    if (message) {
      npmFaves.ui.createNotification(
        npmFaves.ui.notificationTypes.INFO,
        message,
        false
      );
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Creates the "add to faves" or "remove from faves" button on the webpage.
 * @param {boolean} toAddToFaves If set to true indicates that the action
 * should be to add to faves, else should be to remove from faves.
 */
function createFavesButton(toAddToFaves) {
  // Check to see if button already exists
  let faveButton = document.querySelector("#npmFavesLink");

  // If exists remove the button
  if (faveButton) {
    faveButton.parentNode.removeChild(faveButton);
  }

  // Create the button
  faveButton = getFaveButtonElement(toAddToFaves);
  faveLink = faveButton.querySelector("a");

  // Add click event to link
  faveLink.addEventListener("click", handleFaveLinkClick);

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
function getFaveButtonElement(toAddToFaves) {
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

  let buttonHtml = `<div id="npmFavesLink" class="npmf_button ${faveButtonClass}">
    <a fave-action="${faveButtonAction}">
      <span class="material-icons-outlined">${faveButtonIcon}</span>
      ${faveButtonText}
    </a>
    <div id="npmfNotification"></div>
  </div>`;

  let tempDiv = document.createElement("div");
  tempDiv.innerHTML = buttonHtml.trim();

  return tempDiv.firstChild;
}

/**
 * Add to faves / Remove from faves click event handler.
 * Sends a message to the service worker as its not possible to get the
 * package information from the registry service from the content script.
 */
async function handleFaveLinkClick() {
  let displayMessage = "";
  let actionToSend = "";
  let confirmMessage = "";
  // Get the package name from the url
  const packageName = npmFaves.helpers.getUrlPartAfterToken(
    document.location.href,
    "package/"
  );
  // Get the action to perform from the link
  let add = true;
  let action = this.getAttribute("fave-action");
  if (action == "addToFaves") {
    actionToSend = "add";
    displayMessage = "Package added to faves :)";
  } else {
    actionToSend = "remove";
    displayMessage = "Package removed from faves :(";
    add = false;
    confirmMessage = await getConfirmMessage(packageName);
  }
  const message = {
    action: actionToSend,
    packageName: packageName,
  };

  // Show warning
  if (add || confirm(confirmMessage)) {
    // Disable button as it will be created again
    let faveButton = document.querySelector("#npmFavesLink");
    if (faveButton) {
      faveButton.className = "npmf_button npmf_disabled-button";
    }
    // Send message to the service worker
    chrome.runtime.sendMessage(message, function (response) {
      if (!response.result) {
        displayMessage = "An error ocurred :(";
      } else {
        // Send event to Google Analytics.
        // Can't centralize this call in the storage service because the add
        // function is called from the service worker and there is no window
        // in that context to execute the Google Analytics script
        if (response.action == "add") {
          npmFaves.tracking.a.sendFaveAdded(packageName);
        } else if (response.action == "remove") {
          npmFaves.tracking.a.sendFaveRemoved(packageName);
        }
      }

      // Adds again the new button
      addButtonToPage(displayMessage);
    });
  }
}

/**
 * Gets the removal confirmation message including the collections the package
 * was added to.
 * @param {string} packageName The name of the package to remove.
 * @returns {string} The message to show before removing.
 */
async function getConfirmMessage(packageName) {
  let message =
    "By removing the faved package it will also be removed from the collections it was added to";
  try {
    // Get the collections with the package
    const collections = await npmFaves.storage.getCollectionsByPackage(
      packageName
    );
    if (collections.length > 0) {
      message += `: ${collections.join(", ")}.`;
    } else {
      message += ".";
    }
    message += "\n\nDo you wan to proceed?";
  } catch (error) {
    console.log(error);
  }
  return message;
}

/**
 * The following listeners manage events to update the "to fave or not to fave"
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
    if (
      message.packageName ==
      npmFaves.helpers.getUrlPartAfterToken(document.location.href, "package/")
    ) {
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
