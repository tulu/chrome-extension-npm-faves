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
      list += getPackageHtml(package);
    });
    favesContainer.innerHTML = list;
    addEventsToRemoveLinks();
  } else {
    favesContainer.innerHTML = "<div class='empty-list'>No faves to show</div>";
  }
}

/**
 * Generates and returns the HTML markup for the list item based on the
 * package information.
 * @param {object} package The package to create the list item
 * @returns {string} The HTML markup of the package structure
 */
function getPackageHtml(package) {
  return `<div class="pack">
      <div class="pack-info">
        <div class="pack-name">${package.name}</div>
        <div class="pack-description">${package.description}</div>
        <div class="pack-version">
          <span class="pack-publisher">${package.publisher}</span>
          <span class="pack-date-version">
            published ${package.version} \n\u2022 ${package.date}
          </span>
        </div>
      </div>
      <div class="pack-nav">
        <a pack-name="${package.name}" class="pack-unfave">Remove</a>
      </div>
    </div>`;
}

/**
 * Adds the click event listeners to the unfave links for each package.
 */
function addEventsToRemoveLinks() {
  let unfaveLinks = document.querySelectorAll("a.pack-unfave");
  unfaveLinks.forEach((link) => {
    link.addEventListener("click", handleUnfaveLinkClick);
  });
}

/**
 * Unfave link click event handler to remove package from faves, update the
 * list and notify the content script to update the link on the webpage if
 * active.
 */
async function handleUnfaveLinkClick() {
  let packageName = this.getAttribute("pack-name");
  let faves = await storageSyncGet("faves");
  if (faves) {
    faves = faves.filter((item) => item.name !== packageName);
    faves.sort((a, b) => (a.name > b.name ? 1 : -1));
    await storageSyncSet({ faves: faves });
  }
  await showFavesList();
  notifyEvent({ action: "remove", packageName: packageName });
}

function notifyEvent(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
}
