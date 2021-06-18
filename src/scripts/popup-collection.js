/**
 * Script that adds functionality to the extension's popup collections view.
 *
 * Responsibilities:
 *  - Show the collection information and all faved packages.
 *  - Access the package information.
 *  - Access to collection actions:
 *    - Edit collection
 *    - Manage collection packages
 *    - Delete collection
 */

(async () => {
  sendView();
  checkNotification();
  await showCollectionInformation();
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
 * Shows the collection information.
 */
async function showCollectionInformation() {
  try {
    const titleEl = document.getElementById("collectionTitle");
    const typeEl = document.getElementById("collectionType");
    // Get collection to show
    let collectionId = npmFaves.helpers.getQueryStringValue(
      window.location.href,
      "id"
    );
    collectionId = collectionId == "null" ? null : collectionId;
    let faves = [];
    if (!collectionId) {
      // No collection selected
      faves = await npmFaves.storage.getFaves();
      titleEl.innerHTML = "All faves";
      typeEl.innerHTML = "favorite";
      setActions(null);
    } else {
      // Check for collection
      collection = await npmFaves.storage.getCollectionById(collectionId);
      if (collection) {
        titleEl.innerHTML = collection.name;
        typeEl.innerHTML = npmFaves.helpers.getCollectionIcon(collection.type);
        setActions(collection.id);
        faves = await npmFaves.storage.getCollectionFaves(collection.id);
      } else {
        // Return to main and show error
        const message = "Collection not found";
        const messageType = "ERROR";
        location.href = `./popup-main.html?notiMessage=${message}&notiType=${messageType}`;
      }
    }
    const favesContainer = document.getElementById("favesContainer");
    if (faves.length > 0) {
      let list = "";
      faves.forEach((favePackage) => {
        list += getPackageListElement(favePackage);
      });
      favesContainer.innerHTML = list;
      // Add navigation links
      addEventsToListPackages();
    } else {
      favesContainer.innerHTML =
        "<div class='empty-list'>No faves to show</div>";
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Sets the available actions to the collection.
 * @param {integer} collectionId The id of the collection.
 */
function setActions(collectionId) {
  const actionsEl = document.getElementById("collectionActions");
  if (!collectionId) {
    // All faves so options are hidden
    actionsEl.style.visibility = "hidden";
  } else {
    // Set the actions for each link
    const actionEditEl = document.getElementById("actionEdit");
    const actionManageEl = document.getElementById("actionManage");
    const actionDeleteEl = document.getElementById("actionDelete");
    const actionDownloadEl = document.getElementById("actionDownload");
    actionEditEl.href = `./popup-edit-collection.html?id=${collectionId}`;
    actionManageEl.href = `./popup-manage-collection.html?id=${collectionId}`;
    actionDeleteEl.href = `./popup-delete-collection.html?id=${collectionId}`;
    actionDownloadEl.addEventListener("click", handleDownloadPackage);
  }
}

/**
 * Adds the click event to the list of packages to access the package view
 * with more detailed information.
 */
function addEventsToListPackages() {
  let packageListItems = document.querySelectorAll("div.pack");
  packageListItems.forEach((link) => {
    link.addEventListener("click", handleViewPackageClick);
  });
}

/**
 * Package list item click event handler to access the package details.
 */
async function handleViewPackageClick() {
  let packageName = this.getAttribute("package-name");
  const collectionId = npmFaves.helpers.getQueryStringValue(
    window.location.href,
    "id"
  );
  location.href = `./popup-package.html?packageName=${packageName}&collectionId=${collectionId}`;
}

/**
 * Generates and returns the HTML markup for the list item based on the
 * package information.
 * @param {object} fave The package to create the list item.
 * @returns {string} The HTML markup of the package structure.
 */
function getPackageListElement(fave) {
  let publishInformation = "";
  if (fave.date) {
    publishInformation = `published ${fave.version} \n\u2022 ${timeago.format(
      fave.date
    )}`;
  }

  let description = fave.description ? fave.description : "";

  return `<div class="pack" package-name="${fave.name}">
        <div class="pack-info">
          <div class="pack-name">${fave.name}</div>
          <div class="pack-description">${description}</div>
          <div class="pack-version">
            <span class="pack-publisher">${fave.publisher}</span>
            <span class="pack-date-version" datetime="${fave.date}">
              ${publishInformation}
            </span>
          </div>
        </div>
      </div>`;
}

async function handleDownloadPackage() {
  try {
    let collectionId = npmFaves.helpers.getQueryStringValue(
      window.location.href,
      "id"
    );
    collectionId = collectionId == "null" ? null : collectionId;
    if (collectionId) {
      const packagejson = await npmFaves.storage.getPackageJson(collectionId);
      downloadFile("package.json", packagejson);
    }
  } catch (error) {
    console.log(error);
  }
}

function downloadFile(filename, text) {
  var element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text)
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
