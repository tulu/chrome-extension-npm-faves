/**
 * Script that adds functionality to the extension's popup edit collection.
 *
 * Responsibilities:
 *  - Show form to add or edit collection.
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
      document.getElementById("collectionTitle").innerHTML = "Edit collection";
      document.getElementById("collectionType").innerHTML = "edit";
      document.getElementById("txtName").value = collection.name;
      document.getElementById("selType").value = collection.type;
      document.getElementById(
        "backButton"
      ).href = `./popup-collection.html?id=${collection.id}`;
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
  try {
    const name = document.getElementById("txtName").value;
    const type = document.getElementById("selType").value;
    const id = npmFaves.helpers.getQueryStringValue(window.location.href, "id");
    let collection = {};
    //Check if id and valid collection
    if (id) {
      collection = await npmFaves.storage.getCollectionById(id);
      if (!collection) {
        throw new Error("Collection not found");
      }
    }
    // Validate the name length and uniqueness
    if (await validName(name, id)) {
      collection.name = name;
      collection.type = type;
      // Saves the collection
      collection = await npmFaves.storage.saveCollection(collection);
      // Redirects to collection view
      location.href = `./popup-collection.html?id=${collection.id}`;
    } else {
      throw new Error(
        "The collection name must have 3 chars min and be unique"
      );
    }
  } catch (error) {
    console.log(error);
    // Show message as name is not valid
    npmFaves.ui.createNotification(
      npmFaves.ui.notificationTypes.ERROR,
      error,
      true
    );
  }
}

/**
 * Validates the collection name based on length and uniqueness
 * @param {string} name
 * @param {string} id Collection id to validate
 * @returns {boolean} True if is valid
 */
async function validName(name, id) {
  try {
    // Min length 3 chars because yes
    if (name.length < 3) {
      return false;
    }
    // Check if name already used
    const collection = await npmFaves.storage.getCollectionByName(name);
    if (collection && collection.id != id) {
      return false;
    }
    return true;
  } catch (error) {
    console.log(error);
  }
  return false;
}
