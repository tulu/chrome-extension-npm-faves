/**
 * Script that adds functionality to the options page.
 *
 * Responsibilities:
 *  - Show the list of faved packages.
 */

(async () => {
  await sendView();
  const collectionId = getCollectionId();
  await showCollections(collectionId);
  await showFavesList(collectionId);
})();

/**
 * Sends the pageview event
 */
async function sendView() {
  await npmFaves.analytics.sendView(
    npmFaves.helpers.excludeExtensionFromUrl(window.location.href)
  );
}

/**
 * Returns the id of the collection taken from the url.
 * @returns {string} The id of the collection.
 */
function getCollectionId() {
  let collectionId = npmFaves.helpers.getQueryStringValue(
    window.location.href,
    "id"
  );
  collectionId = collectionId == "null" ? null : collectionId;
  return collectionId;
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
 * Loads faved packages from the storage and shows the list.
 */
async function showFavesList(collectionId) {
  try {
    let faves = [];
    let loaded = false;
    let collectionName = "All faves";
    let emptyMessage = "No faved packages yet :(<br /> Please add some";
    let collection = null;
    if (collectionId) {
      collection = await npmFaves.storage.getCollectionById(collectionId);
      if (collection) {
        faves = await npmFaves.storage.getCollectionFaves(collection.id);
        collectionName = collection.name + " packages";
        emptyMessage = "The collection is empty";
        loaded = true;
      }
    }

    if (!loaded) {
      faves = await npmFaves.storage.getFaves();
      document.getElementById("allFavesLink").className = "menu-item-active";
    }

    const favesContainer = document.getElementById("favesContainer");
    let addedAtColHeader = "";
    let dependencyTypeHeader = "";

    if (collection) {
      addedAtColHeader = "<th>In Collection</th>";
      dependencyTypeHeader = "<th>Dependency Type</th>";
    }
    if (faves.length > 0) {
      let list = `<h3>${collectionName}</h3>
      <table class="fave-table"><thead><tr>
      <th>Name</th><th>Version</th><th>Published</th><th>Added</th>
      <th>Updated</th>${dependencyTypeHeader}${addedAtColHeader}</tr></thead><tbody>`;

      faves.forEach((favePackage) => {
        list += getFavePackageRow(favePackage);
      });
      list += `</tbody></table>`;
      favesContainer.innerHTML = list;
    } else {
      favesContainer.innerHTML = `<div class="empty-list">
            ${emptyMessage}
        </div>`;
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Returns an html row with the package information.
 * @param {object} fave A faved package.
 * @returns {string} The html row for the package.
 */
function getFavePackageRow(fave) {
  let updatedAt = "-";
  let addedAt = "";
  let dependencyType = "";
  if (fave.updatedAt) {
    updatedAt = new Date(fave.updatedAt).toLocaleDateString();
  }
  if (fave.addedAt) {
    addedAt = `<td>${new Date(fave.addedAt).toLocaleDateString()}</td>`;
  }
  if (fave.dependencyType) {
    dependencyType = "dependency";
    if (fave.dependencyType == "dev") {
      dependencyType = "devDependency";
    }
    dependencyType = `<td>${dependencyType}</td>`;
  }
  return `<tr>
    <td>
        <a target="_blank" href="${fave.npmLink}">${fave.name}</a>
    </td>
    <td>${fave.version}</td>
    <td>${timeago.format(fave.date)}</td>
    <td>${new Date(fave.createdAt).toLocaleDateString()}</td>
    <td>${updatedAt}</td>
    ${dependencyType}
    ${addedAt}
  </tr>`;
}

/**
 * Listens for onChanged event from the storage to update the list.
 */
chrome.storage.onChanged.addListener(async function (changes, areaName) {
  if (changes) {
    const collectionId = getCollectionId();
    await showCollections(collectionId);
    await showFavesList(collectionId);
  }
});
