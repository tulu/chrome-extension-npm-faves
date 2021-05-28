/**
 * Script that adds functionality to the extension's popup.
 *
 * Responsibilities:
 *  - Show the list of faved packages.
 *  - Access the package information.
 */

(async () => {
  addSearchBarEvent();
  addNotificationEvent();
  checkNotification();
  await showFavesList();
})();

/**
 * Adds the keyup event to the search bar to open a new tab with the packages
 * list on npmjs.com with by pressing the Enter key and using the input's value
 * as the query.
 */
function addSearchBarEvent() {
  const searchBar = document.getElementById("searchInput");
  if (searchBar) {
    searchBar.addEventListener("keyup", function (event) {
      if (event.keyCode === 13 && searchBar.value.trim().length > 0) {
        event.preventDefault();
        let url = "https://www.npmjs.com/search?q=" + searchBar.value;
        chrome.tabs.create({ url: url });
      }
    });
  }
}

/**
 * Adds the close event to the notification.
 */
function addNotificationEvent() {
  const notificationCloseButton = document.getElementById(
    "npmfNotificationCloseButton"
  );
  if (notificationCloseButton) {
    notificationCloseButton.addEventListener("click", function () {
      this.parentElement.style.display = "none";
    });
  }
}

/**
 * Checks if the notification should be visible and if so then it sets
 * the message and type and displays it.
 */
function checkNotification() {
  const notificationMessage = getParameterByName("noti-message");
  const notificationType = getParameterByName("noti-type");
  const spanMessage = document.getElementById("npmfNotificationMessage");
  const divNotification = document.getElementById("npmfNotification");
  if (
    notificationMessage &&
    notificationType &&
    spanMessage &&
    divNotification
  ) {
    spanMessage.innerHTML = notificationMessage;
    divNotification.className = `npmf_notification npmf_${notificationType}`;
    divNotification.style.display = "block";
  }
}

/**
 * Returns the value of the parameter from the query string.
 * @param {string} name The name of the package.
 * @param {string} url The url of the page.
 * @returns {string} The value of the parameter.
 */
function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

/**
 * Loads faved packages from the storage and shows the list.
 * Also renders an option to remove from faves.
 */
async function showFavesList() {
  const favesContainer = document.getElementById("favesContainer");
  let faves = [];
  try {
    faves = await npmFaves.storage.getFaves();
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
 * @param {object} fave The package to create the list item.
 * @returns {string} The HTML markup of the package structure.
 */
function getPackageListElement(fave) {
  let publishInformation = "";
  if (fave.date) {
    publishInformation = `published ${
      fave.version
    } \n\u2022 ${timeago.format(fave.date)}`;
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
