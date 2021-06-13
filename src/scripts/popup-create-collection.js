/**
 * Script that adds functionality to the extension's popup create collection.
 *
 * Responsibilities:
 *  - Show form to add new collection.
 */

(async () => {
  sendView();
  loadCollection();
  addSaveEvent();
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
 * Loads the collection information if exits
 */
async function loadCollection() {
  const id = npmFaves.helpers.getQueryStringValue(window.location.href, "id");
  if (id) {
    collection = await npmFaves.storage.getCollectionById(id);
    if (collection) {
      document.getElementById("txtName").value = collection.name;
      document.getElementById("selType").value = collection.type;
    }
  }
}

/**
 * Adds the save event to the button
 */
function addSaveEvent() {
  const saveButton = document.getElementById("saveCollection");
  saveButton.addEventListener("click", saveCollection);
}

/**
 * Saves the collection
 */
async function saveCollection() {
  const name = document.getElementById("txtName").value;
  const type = document.getElementById("selType").value;
  const id = npmFaves.helpers.getQueryStringValue(window.location.href, "id");
  if (await validName(name)) {
    let collection = {};
    if (id) {
      collection = await npmFaves.storage.getCollectionById(id);
    }
    collection.name = name;
    collection.type = type;
    // Saves the collection
    collection = await npmFaves.storage.saveCollection(collection);
    // Redirects to collection view
    location.href = `./popup-collection.html?id=${collection.id}`;
  } else {
    // Show message as name is not valid
    const message = "The collection name must have 3 chars min and be unique";
    npmFaves.ui.createNotification(
      npmFaves.ui.notificationTypes.ERROR,
      message,
      true
    );
  }
}

/**
 * Validates the collection name based on length and uniqueness
 * @param {string} name
 * @returns {boolean} True if is valid
 */
async function validName(name) {
  // Min length 3 chars because yes
  if (name.length < 3) {
    return false;
  }
  // Check if name already used
  const collection = await npmFaves.storage.getCollectionByName(name);
  if (collection) {
    return false;
  }
  return true;
}
