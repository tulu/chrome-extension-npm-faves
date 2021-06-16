/**
 * Script that adds functionality to the extension's popup delete collection.
 *
 * Responsibilities:
 *  - Show warning and button to delete collection
 *  - Delete collection
 */

(async () => {
  sendView();
  loadCollection();
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

/**
 * Loads the collection information if exists.
 */
async function loadCollection() {
  try {
    const id = npmFaves.helpers.getQueryStringValue(window.location.href, "id");
    if (id) {
      const collection = await npmFaves.storage.getCollectionById(id);
      if (collection) {
        document.getElementById(
          "collectionTitle"
        ).innerHTML = `Delete collection: ${collection.name}`;
        document.getElementById(
          "backButton"
        ).href = `./popup-collection.html?id=${collection.id}`;
      } else {
        // Returns to main view with a error message to show
        const message = `Collection not found`;
        const messageType = "ERROR";
        location.href = `./popup-main.html?notiMessage=${message}&notiType=${messageType}`;
      }
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Adds the delete event to the button.
 */
function addDeleteEvent() {
  const deleteButton = document.getElementById("deleteButton");
  deleteButton.addEventListener("click", deleteCollection);
}

/**
 * deletes the collection.
 */
async function deleteCollection() {
  try {
    const id = npmFaves.helpers.getQueryStringValue(window.location.href, "id");
    //Check if id and valid collection
    if (id) {
      let collection = await npmFaves.storage.getCollectionById(id);
      if (collection) {
        // Collection found, can be deleted
        // Deletes the collection
        await npmFaves.storage.deleteCollection(collection.id);
        // Returns to main view with a message to show
        const message = `Collection ${collection.name} was deleted :(`;
        const messageType = "SUCCESS";
        location.href = `./popup-main.html?notiMessage=${message}&notiType=${messageType}`;
      } else {
        // Returns to main view with a error message to show
        const message = `Collection not found`;
        const messageType = "ERROR";
        location.href = `./popup-main.html?notiMessage=${message}&notiType=${messageType}`;
      }
    }
  } catch (error) {
    console.log(error);
  }
}
