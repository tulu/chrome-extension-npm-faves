/**
 * Script that adds functionality to the extension's popup delete collection.
 *
 * Responsibilities:
 *  - Show warning and button to delete collection
 *  - Delete collection
 */

(async () => {
  sendView();
  loadPackage();
  addDeleteEvent();
})();

/**
 * Sends the pageview event
 */
function sendView() {
  npmFaves.tracking.a.sendView(
    npmFaves.helpers.excludeExtensionFromUrl(window.location.href, false)
  );
}

async function loadPackage() {
  const packageName = npmFaves.helpers.getQueryStringValue(
    window.location.href,
    "packageName"
  );
  let collectionId = npmFaves.helpers.getQueryStringValue(
    window.location.href,
    "collectionId"
  );
  collectionId = collectionId != "null" ? `&collectionId=${collectionId}` : "";
  if (packageName) {
    const fave = await npmFaves.storage.getFave(packageName, false);
    if (fave) {
      document.getElementById(
        "faveTitle"
      ).innerHTML = `Delete fave: ${fave.name}`;
      document.getElementById(
        "backButton"
      ).href = `./popup-package.html?packageName=${packageName}${collectionId}`;
    }
  }
}

/**
 * Adds the delete event to the button
 */
function addDeleteEvent() {
  const deleteButton = document.getElementById("deleteButton");
  deleteButton.addEventListener("click", deleteFave);
}

async function deleteFave() {
  try {
    // Get the package name from url
    const packageName = npmFaves.helpers.getQueryStringValue(
      window.location.href,
      "packageName"
    );
    // Remove the fave from storage
    await npmFaves.storage.removeFave(packageName);
    // Send remove event to Google Analytics
    npmFaves.tracking.a.sendFaveRemoved(packageName);
    // Notify to the content script
    notifyEvent({ action: "remove", packageName: packageName });
    // Returns to main view with a message to show
    let collectionId = npmFaves.helpers.getQueryStringValue(
      window.location.href,
      "collectionId"
    );
    collectionId = collectionId != "null" ? `&id=${collectionId}` : "";

    const message = `${packageName} removed from faves :(`;
    const messageType = "SUCCESS";
    location.href = `./popup-collection.html?notiMessage=${message}&notiType=${messageType}${collectionId}`;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Notifies the unfave event.
 * @param {object} message The message to send with the action to perform.
 * @param {string} message.action The action to perform (add | remove).
 * @param {string} message.packageName The name of the package.
 */
 function notifyEvent(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, message);
    });
  }