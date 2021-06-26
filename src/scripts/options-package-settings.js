/**
 * Script that adds functionality to the package.json settings page.
 *
 * Responsibilities:
 *  - Show the default package.json information.
 *  - Save the default package.json information.
 */

(async () => {
  sendView();
  await showCollections(null);
  await loadPackageJson();
  addSaveEvent();
})();

/**
 * Sends the pageview event
 */
function sendView() {
  npmFaves.tracking.a.sendView(
    npmFaves.helpers.excludeExtensionFromUrl(window.location.href)
  );
}

/**
 * Shows the list of collections and sets the active collection style.
 * @param {integer} collectionId The current collection id.
 */
async function showCollections(collectionId) {
  try {
    const collections = await npmFaves.storage.getCollections();
    const collectionsContainer = document.getElementById("collectionsList");
    if (collections.length > 0) {
      let list = ``;
      collections.forEach((collection) => {
        let active = collection.id == collectionId;
        list += getCollectionListElement(collection, active);
      });
      collectionsContainer.innerHTML = list;
    } else {
      collectionsContainer.innerHTML = "";
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Returns the HTML element for the collection in the menu.
 * @param {object} collection The collection to create the menu element.
 * @param {boolean} active Indicates if the collection is the active one.
 * @returns {string} HTML representation of the menu option
 */
function getCollectionListElement(collection, active) {
  let type = npmFaves.helpers.getCollectionIcon(collection.type);
  let activeClass = active ? "menu-item-active" : "";
  return `<a class="${activeClass}" href="./options.html?id=${collection.id}">
              <span class="material-icons-outlined">  ${type} </span>${collection.name}
              <span id="allFavesCount" class="badge">(${collection.packages.length})</span>
            </a>`;
}

/**
 * Loads the package.json default information.
 */
async function loadPackageJson() {
  try {
    let packageJson = await npmFaves.storage.getPackageJson();
    packageJson = JSON.parse(packageJson);
    document.getElementById("txtVersion").value = packageJson.version;
    document.getElementById("txtAuthor").value = packageJson.author;
    document.getElementById("txtGithubUser").value = getGithubUser(
      packageJson.repository.url
    );
    document.getElementById("txtLicense").value = packageJson.license;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Returns the Github username extracted from the repository url.
 * @param {string} repositoryUrl Url of the repository.
 * @returns {string} The Github username.
 */
function getGithubUser(repositoryUrl) {
  return repositoryUrl.split("/")[3];
}

/**
 * Adds the save event to the button
 */
function addSaveEvent() {
  const saveButton = document.getElementById("savePackageJson");
  saveButton.addEventListener("click", savePackageJson);
}

/**
 * Saves the package.json default information.
 */
async function savePackageJson() {
  try {
    // Validate the input information
    if (validInput()) {
      // Get the input elements
      const txtVersion = document.getElementById("txtVersion");
      const txtAuthor = document.getElementById("txtAuthor");
      const txtGithubUser = document.getElementById("txtGithubUser");
      const txtLicense = document.getElementById("txtLicense");
      // Save the information
      await npmFaves.storage.saveDefaultPackageJson(
        txtVersion.value,
        txtAuthor.value,
        txtGithubUser.value,
        txtLicense.value
      );
      // Send tracking event
      npmFaves.tracking.a.sendPackageJsonSaved();
      await loadPackageJson();
      showNotification("SUCCESS", "Default package.json information saved");
    } else {
      showNotification("ERROR", "The min length for all fields is 3 chars");
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Validates the input information.
 * @returns {boolean} Returns true if the input is valid.
 */
function validInput() {
  const txtVersion = document.getElementById("txtVersion");
  const txtAuthor = document.getElementById("txtAuthor");
  const txtGithubUser = document.getElementById("txtGithubUser");
  const txtLicense = document.getElementById("txtLicense");
  // The only defined validation
  const minLength = 3;
  return (
    txtVersion.value.length >= minLength &&
    txtAuthor.value.length >= minLength &&
    txtGithubUser.value.length >= minLength &&
    txtLicense.value.length >= minLength
  );
}

/**
 * Shows a message.
 * @param {string} type The type of message to display.
 * @param {string} message The message to display.
 */
function showNotification(type, message) {
  npmFaves.ui.createNotification(
    npmFaves.ui.notificationTypes[type],
    message,
    true
  );
}

/**
 * Listens for onChanged event from the storage to update the list.
 */
chrome.storage.onChanged.addListener(async function (changes, areaName) {
  if (changes) {
    await showCollections(null);
  }
});
