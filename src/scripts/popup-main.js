/**
 * Script that adds functionality to the extension's popup.
 *
 * Responsibilities:
 *  - Show the list of options and collections.
 *  - Access the collection information.
 *  - Access the create collection option.
 *  - Access the options page
 *  - Add search package in npmjs.com site functionality 
 */

(async () => {
  sendView();
  addSearchBarEvent();
  checkNotification();
  addMenuEvents();
  await showAllFavesCount();
  await showCollectionsList();
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
    "notiMessage"
  );
  const notificationType = npmFaves.helpers.getQueryStringValue(
    window.location.href,
    "notiType"
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

/**
 * Shows the list of the existing collections to navigate to them.
 */
async function showCollectionsList() {
  try {
    const collections = await npmFaves.storage.getCollections();
    const collectionsContainer = document.getElementById("collectionsList");
    if (collections.length > 0) {
      let list = "";
      collections.forEach((collection) => {
        list += getCollectionListElement(collection);
      });
      collectionsContainer.innerHTML = list;
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Returns the HTML representation of the collection.
 * @param {object} collection The collection.
 * @returns {string} Html of the collection element.
 */
function getCollectionListElement(collection) {
  let type = npmFaves.helpers.getCollectionIcon(collection.type);
  return `<a class="menu-item" href="./popup-collection.html?id=${collection.id}">
    <span class="material-icons-outlined"> ${type} </span>
    ${collection.name}<span class="badge">(${collection.packages.length})</span>
    <span class="material-icons-outlined">arrow_right</span>
  </a>`;
}

/**
 * Displays the amount of faved packages for the "All faves" collection.
 */
async function showAllFavesCount() {
  try {
    let faves = await npmFaves.storage.getFaves();
    let badge = faves.length > 0 ? `(${faves.length})` : "";
    document.getElementById("allFavesCount").innerHTML = badge;
  } catch (error) {
    console.log(error);
  }
}
