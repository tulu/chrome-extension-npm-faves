/**
 * Script that adds functionality to the extension's popup manage collection packages.
 *
 * Responsibilities:
 *  - Show warning and button to delete collection
 *  - Delete collection
 */

(async () => {
  sendView();
  loadCollection();
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
  try {
    const id = npmFaves.helpers.getQueryStringValue(window.location.href, "id");
    if (id) {
      collection = await npmFaves.storage.getCollectionById(id);
      if (collection) {
        // Set title and back button actions
        setUiElements(collection);
        // Get all faves
        const faves = await npmFaves.storage.getFaves();
        const packagesToShow = faves.map((fave) => ({
          name: fave.name,
          added: collection.packages.some((pack) => pack.name === fave.name),
        }));
        // Get packages HTML list
        let packagesListHtml = getPackagesListHtml(packagesToShow);
        document.getElementById("packagesContainer").innerHTML =
          packagesListHtml;
        // Add events to checkboxes
        addPackagesEvent();
      } else {
        // Collection not found
        returnWithError("Collection not found");
      }
    } else {
      // Id not set
      returnWithError("Id of collection not provided");
    }
  } catch (error) {
    console.log(error);
  }
}

function setUiElements(collection) {
  document.getElementById(
    "collectionTitle"
  ).innerHTML = `Manage packages: ${collection.name}`;
  document.getElementById(
    "backButton"
  ).href = `./popup-collection.html?id=${collection.id}`;
}

function returnWithError(message) {
  const messageType = "ERROR";
  location.href = `./popup-main.html?noti-message=${message}&noti-type=${messageType}`;
}

function getPackagesListHtml(packagesToShow) {
  let html = "<ul>";

  packagesToShow.forEach((pack) => {
    html += `<li>
    <input type="checkbox" id="${pack.name}" name="${pack.name}" value="${
      pack.name
    }" ${pack.added ? "checked" : ""}>
<label for="${pack.name}"> ${pack.name}</label>
        
    </li>`;
  });
  html += "</ul>";
  return html;
}

function addPackagesEvent() {
  let packageItems = document.querySelectorAll("input[type=checkbox]");
  packageItems.forEach((check) => {
    check.addEventListener("click", handlePackageManagement);
  });
}

async function handlePackageManagement() {
  try {
    const collectionId = npmFaves.helpers.getQueryStringValue(
      window.location.href,
      "id"
    );
    const packageName = this.value;
    const toAdd = this.checked;

    if (collectionId) {
      if (toAdd) {
        await npmFaves.storage.addToCollection(
          parseInt(collectionId),
          packageName
        );
      } else {
        await npmFaves.storage.removeFromCollection(
          parseInt(collectionId),
          packageName
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
}
