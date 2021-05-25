/**
 * Script that adds functionality to the extension's popup.
 *
 * Responsibilities:
 *  - Show the list of faved packages.
 *  - Access the package information.
 *  - Remove selected package from faves
 */

(async () => {
  addSearchBarEvent();
  await showFavesList();
})();

/**
 * Adds the keyup event to the search bar to open a new tab with the packages
 * list on npmjs.com with by pressing the Enter key and using the input's value
 * as the query.
 */
function addSearchBarEvent() {
  const searchBar = document.getElementById("searchInput");
  searchBar.addEventListener("keyup", function (event) {
    if (event.keyCode === 13 && searchBar.value.trim().length > 0) {
      event.preventDefault();
      let url = "https://www.npmjs.com/search?q=" + searchBar.value;
      chrome.tabs.create({ url: url });
    }
  });
}

/**
 * Loads faved packages from the storage and shows the list.
 * Also renders an option to remove from faves.
 */
async function showFavesList() {
  const favesContainer = document.getElementById("favesContainer");
  let faves = [];
  try {
    faves = await storageSyncGet("faves");
  } catch (error) {
    console.log(error);
  }
  if (faves && faves.length > 0) {
    let list = "";
    faves.forEach((package) => {
      list += getPackageListElement(package);
    });
    favesContainer.innerHTML = list;

    addEventsToListPackages();
  } else {
    favesContainer.innerHTML = "<div class='empty-list'>No faves to show</div>";
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
  location.href = `./popup-package.html?package-name=${packageName}`;
}

/**
 * Generates and returns the HTML markup for the list item based on the
 * package information.
 * @param {object} package The package to create the list item
 * @returns {string} The HTML markup of the package structure
 */
function getPackageListElement(package) {
  let publishInformation = "";
  if (package.date) {
    publishInformation = `published ${
      package.version
    } \n\u2022 ${timeago.format(package.date)}`;
  }
  return `<div class="pack" package-name="${package.name}">
      <div class="pack-info">
        <div class="pack-name">${package.name}</div>
        <div class="pack-description">${package.description}</div>
        <div class="pack-version">
          <span class="pack-publisher">${package.publisher}</span>
          <span class="pack-date-version" datetime="${package.date}">
            ${publishInformation}
          </span>
        </div>
      </div>
    </div>`;
}
