/**
 * Script that adds functionality to the extension's popup package view.
 *
 * Responsibilities:
 *  - Show the details of the package.
 *  - Remove selected package from faves.
 */

(async () => {
  const packageName = getParameterByName("package-name");
  await checkNewVersion(packageName);
  await showPackageInformation(packageName);
  addEventToCopyInstallation();
  addEventsToRemoveLinks();
  addNotificationEvent();
})();

/**
 * Gets the package information from the storage and shows it in the view.
 * @param {string} packageName
 */
async function showPackageInformation(packageName) {
  const packageView = document.getElementById("packageView");
  let faves = await storageSyncGet("faves");
  let package = null;
  if (faves) {
    package = faves.filter((item) => item.name == packageName);
  }
  if (package.length == 1) {
    packageView.innerHTML = getPackageView(package[0]);
  } else {
    console.log(`Package ${packageName} not found!`);
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
 * Generates the html of the view to display the package's information.
 * The avatars for the maintainers are generated with
 * https://www.tinygraphs.com/.
 * @param {object} package The package to show.
 * @returns {string} The html representing the view.
 */
function getPackageView(package) {
  //npm link
  let npmLinkHtml = `<a class="package-value">Not available</a>`;
  if (package.npmLink) {
    npmLinkHtml = `<a class="package-value" target="_blank" 
    href="${package.npmLink}">${package.npmLink}</a>`;
  }
  //Homepage link
  let homepageLinkHtml = `<a class="package-value">Not available</a>`;
  if (package.homepageLink) {
    homepageLinkHtml = `<a class="package-value" target="_blank" 
    href="${package.homepageLink}">${package.homepageLink}</a>`;
  }
  //Repository link
  let repositoryLinkHtml = `<a class="package-value">Not available</a>`;
  if (package.repositoryLink) {
    repositoryLinkHtml = `<a class="package-value" target="_blank" 
    href="${package.repositoryLink}">${package.repositoryLink}</a>`;
  }
  // Date
  let lastPublish = "Not available";
  if (package.date) {
    lastPublish = timeago.format(package.date);
  }
  // Maintainers
  let maintainersHtml = "Not available";
  if (package.maintainers) {
    maintainersHtml = "";
    const baseUrl = "https://www.npmjs.com/";
    package.maintainers.split(",").forEach((maintainer) => {
      maintainersHtml += `<a target="_blank" href="${baseUrl}~${maintainer.trim()}">
        <img src="http://tinygraphs.com/labs/isogrids/hexa16/${maintainer.trim()}?theme=berrypie&numcolors=2&size=42&fmt=svg" 
        title="${maintainer.trim()}">
      </a>`;
    });
  }

  // Return the full html view
  return `<div class="package-name">${package.name}</div>
<div class="package-description">${package.description}</div>
<div class="package-properties no-border">
  <div class="package-attribute">Install</div>
  <div class="package-installation">
  <span class="material-icons-outlined"> chevron_right </span> 
  <span id="installSnippet">npm i ${package.name}</span>
  <span class="material-icons-outlined copy-icon">content_copy</span>
  </div>
</div>
<div class="package-properties" style="display: flex">
  <div style="width: 50%">
    <div class="package-attribute">Version</div>
    <div class="package-value">${package.version}</div>
  </div>
  <div style="width: 50%">
    <div class="package-attribute">License</div>
    <div class="package-value">${package.license}</div>
  </div>
</div>
<div class="package-properties">
  <div class="package-attribute">npm Site</div>
  ${npmLinkHtml}
</div>
<div class="package-properties">
  <div class="package-attribute">Homepage</div>
  ${homepageLinkHtml}
</div>
<div class="package-properties">
  <div class="package-attribute">Repository</div>
  ${repositoryLinkHtml}
</div>
<div class="package-properties">
  <div class="package-attribute">Last publish</div>
  <div class="package-value">${lastPublish}</div>
</div>
<div class="package-properties">
  <div class="package-attribute">Collaborators</div>
  <div class="package-collaborators">${maintainersHtml}</div>
</div>
<div class="npmf_button npmf_cancel-button">
    <a package-name="${package.name}" class="pack-unfave">
        <span class="material-icons-outlined"> delete </span>
        Remove from faves
    </a>
</div>`;
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
 * Adds the click event listeners in order to copy the install snippet.
 */
function addEventToCopyInstallation() {
  const divSnippet = document.querySelector("div.package-installation");
  if (divSnippet) {
    divSnippet.addEventListener("click", handleCopySnippetClick);
  }
}

/**
 * Snippet event handler to copy the text to the clipboard
 */
function handleCopySnippetClick() {
  var r = document.createRange();
  r.selectNode(document.getElementById("installSnippet"));
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(r);
  document.execCommand("copy");
  window.getSelection().removeAllRanges();
  showNotification("Install snippet copied!", "notification-success");
}

/**
 * Shows a message with the defined text and type
 * @param {string} notificationMessage The message to show
 * @param {string} notificationType The ype of message to show
 */
function showNotification(notificationMessage, notificationType) {
  const divNotification = document.getElementById("npmfNotification");
  const spanMessage = document.getElementById("npmfNotificationMessage");
  spanMessage.innerHTML = notificationMessage;
  divNotification.className = `npmf_notification npmf_${notificationType}`;
  divNotification.style.display = "block";
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
  let packageName = this.getAttribute("package-name");
  let faves = await storageSyncGet("faves");
  if (faves) {
    faves = faves.filter((item) => item.name !== packageName);
    faves.sort((a, b) => (a.name > b.name ? 1 : -1));
    await storageSyncSet({ faves: faves });
  }
  notifyEvent({ action: "remove", packageName: packageName });
  // Returns to main view with a message to show
  const message = `${packageName} removed from faves :(`;
  const messageType = "notification-success";
  location.href = `./popup-main.html?noti-message=${message}&noti-type=${messageType}`;
}

/**
 * Notifies the unfave event.
 * @param {object} message
 */
function notifyEvent(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
}

/**
 * Checks if there is a new version of the package and if there is then the 
 * information is updated.
 * @param {string} packageName The name of the package to update
 */
async function checkNewVersion(packageName) {
  let faves = await storageSyncGet("faves");
  let package = null;
  if (faves) {
    package = faves.filter((item) => item.name == packageName);
  }
  if (package.length == 1) {
    const newVersion = await getPackageVersion(package[0].name);
    if (newVersion && newVersion != package[0].version) {
      await updatePackageInformation(package[0].name);
    }
  } else {
    console.log(`Package ${packageName} not found to check for new version`);
  }
}

/**
 * Updates the package information and stores it.
 * @param {string} packageName The name of the package
 */
async function updatePackageInformation(packageName) {
  // Gets the package with the updated information
  const package = await getPackageInfoByName(packageName);
  // Retrieves the faves from the storage
  let faves = await storageSyncGet("faves");
  let packagePosition = -1;
  if (faves) {
    packagePosition = faves
      .map(function (e) {
        return e.name;
      })
      .indexOf(packageName);
    if (packagePosition > -1) {
      faves[packagePosition] = package;
      faves.sort((a, b) => (a.name > b.name ? 1 : -1));
      await storageSyncSet({ faves: faves });
    }
  }
}
