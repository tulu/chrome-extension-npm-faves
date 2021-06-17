/**
 * Script that adds functionality to the options page.
 *
 * Responsibilities:
 *  - Show the list of faved packages.
 */

(async () => {
  sendView();
  const collectionId = getCollectionId();
  await showCollections(collectionId);
  await showFavesList(collectionId);
})();

/**
 * Sends the pageview event
 */
function sendView() {
  npmFaves.tracking.a.sendView(
    npmFaves.helpers.excludeExtensionFromUrl(window.location.href)
  );
}

function getCollectionId() {
  let collectionId = npmFaves.helpers.getQueryStringValue(
    window.location.href,
    "id"
  );
  collectionId = collectionId == "null" ? null : collectionId;
  return collectionId;
}

async function showCollections(collectionId) {
  try {
    const collections = await npmFaves.storage.getCollections();
    const collectionsContainer = document.getElementById("collectionsList");
    if (collections.length > 0) {
      let list = `<div class="collectionListTitle"><span class="material-icons-outlined">  collections_bookmark </span>Collections</div>`;
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
 * Also renders an option to remove from faves.
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
    if (collection) {
      addedAtColHeader = "<th>In Collection</th>";
    }
    if (faves.length > 0) {
      let list = `<h3>${collectionName}</h3>
      <table class="fave-table"><thead><tr>
      <th>Name</th><th>Version</th><th>Published</th><th>Added</th>
      <th>Updated</th>${addedAtColHeader}</tr></thead><tbody>`;

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
  if (fave.updatedAt) {
    updatedAt = new Date(fave.updatedAt).toLocaleDateString();
  }
  if (fave.addedAt) {
    addedAt = `<td>${new Date(fave.addedAt).toLocaleDateString()}</td>`;
  }
  return `<tr>
    <td>
        <a target="_blank" href="${fave.npmLink}">${fave.name}</a>
    </td>
    <td>${fave.version}</td>
    <td>${timeago.format(fave.date)}</td>
    <td>${new Date(fave.createdAt).toLocaleDateString()}</td>
    <td>${updatedAt}</td>
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
