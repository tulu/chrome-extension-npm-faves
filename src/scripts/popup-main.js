/**
 * Script that adds functionality to the extension's popup.
 *
 * Responsibilities:
 *  - Show the list of options and collections.
 *  - Access the collection information.
 *  - Access the create collection option.
 *  - Access the options page
 */

(async () => {
  sendView();
  addSearchBarEvent();
  checkNotification();
  addMenuEvents();
})();

/**
 * Sends the pageview event
 */
function sendView() {
  npmFaves.tracking.a.sendView(
    npmFaves.helpers.excludeExtensionFromUrl(window.location.href, false)
  );
}

/**
 * Adds click events to the different menu options
 */
function addMenuEvents() {
  // Options link
  let optionsLink = document.getElementById("linkOptions");
  if (optionsLink) {
    optionsLink.addEventListener("click", function () {
      chrome.runtime.openOptionsPage();
    });
  }
}

/**
 * Adds the keyup event to the search bar to open a new tab with the packages
 * list on npmjs.com with by pressing the Enter key and using the input's value
 * as the query.
 */
function addSearchBarEvent() {
  const searchBar = document.getElementById("searchInput");
  if (searchBar) {
    searchBar.addEventListener("keyup", function (event) {
      if (event.keyCode === 13 && searchBar.value.trim().length > 0) {
        event.preventDefault();
        let url = "https://www.npmjs.com/search?q=" + searchBar.value;
        chrome.tabs.create({ url: url });
      }
    });
  }
}

/**
 * Checks if the notification should be visible and if so then it sets
 * the message and type and displays it.
 */
function checkNotification() {
  const notificationMessage = npmFaves.helpers.getQueryStringValue(
    window.location.href,
    "noti-message"
  );
  const notificationType = npmFaves.helpers.getQueryStringValue(
    window.location.href,
    "noti-type"
  );
  // Checks the query string to create a message
  if (notificationMessage && notificationType) {
    npmFaves.ui.createNotification(
      npmFaves.ui.notificationTypes[notificationType],
      notificationMessage,
      true
    );
  }
}