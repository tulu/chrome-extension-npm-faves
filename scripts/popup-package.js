/**
 * Script that adds functionality to the extension's popup package view.
 *
 * Responsibilities:
 *  - Show the details of the package.
 *  - Remove selected package from faves.
 */

(async () => {
  await showPackageInformation();
  addEventToCopyInstallation();
  addEventsToRemoveLinks();
  addNotificationEvent();
})();

/**
 * Gets the package information from the storage and shows it in the view.
 * @param {string} packageName The name of the package.
 * @todo Show not found message in UI.
 */
async function showPackageInformation() {
  try {
    const packageName = getParameterByName("package-name");
    let fave = await npmFaves.storage.getFave(packageName);
    if (fave) {
      const packageView = document.getElementById("packageView");
      packageView.innerHTML = getPackageView(fave);
    } else {
      console.log(`Package ${packageName} not found!`);
    }
  } catch (error) {
    console.log(error);
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
 * @param {object} fave The package to show.
 * @returns {string} The html representing the view.
 */
function getPackageView(fave) {
  // Description
  let descriptionHtml = "";
  if (fave.description) {
    descriptionHtml = `<div class="package-description">${fave.description}</div>`;
  }
  //npm link
  let npmLinkHtml = "";
  if (fave.npmLink) {
    npmLinkHtml = `<div class="package-properties">
      <div class="package-attribute">npm Site</div>
      <a class="package-value" target="_blank" href="${fave.npmLink}">
        ${fave.npmLink}
      </a>
    </div>`;
  }
  //Homepage link
  let homepageLinkHtml = "";
  if (fave.homepageLink) {
    homepageLinkHtml = `<div class="package-properties">
      <div class="package-attribute">Homepage</div>
      <a class="package-value" target="_blank" href="${fave.homepageLink}">
        ${fave.homepageLink}
      </a>
    </div>`;
  }
  //Repository link
  let repositoryLinkHtml = "";
  if (fave.repositoryLink) {
    repositoryLinkHtml = `<div class="package-properties">
      <div class="package-attribute">Repository</div>
      <a class="package-value" target="_blank" href="${fave.repositoryLink}">
        ${fave.repositoryLink}
      </a>
    </div>`;
  }
  // Date
  let lastPublish = "Not available";
  if (fave.date) {
    lastPublish = timeago.format(fave.date);
  }
  // Maintainers
  let maintainersHtml = "Not available";
  if (fave.maintainers) {
    maintainersHtml = "";
    const baseUrl = "https://www.npmjs.com/";
    fave.maintainers.split(",").forEach((maintainer) => {
      maintainersHtml += `<a target="_blank" href="${baseUrl}~${maintainer.trim()}">
        <img src="http://tinygraphs.com/labs/isogrids/hexa16/${maintainer.trim()}?theme=berrypie&numcolors=2&size=42&fmt=svg" 
        title="${maintainer.trim()}">
      </a>`;
    });
  }

  // Return the full html view
  return `<div class="package-name">${fave.name}</div>
${descriptionHtml}
<div class="package-properties no-border">
  <div class="package-attribute">Install</div>
  <div class="package-installation">
  <span class="material-icons-outlined"> chevron_right </span> 
  <span id="installSnippet">npm i ${fave.name}</span>
  <span class="material-icons-outlined copy-icon">content_copy</span>
  </div>
</div>
<div class="package-properties" style="display: flex">
  <div style="width: 50%">
    <div class="package-attribute">Version</div>
    <div class="package-value">${fave.version}</div>
  </div>
  <div style="width: 50%">
    <div class="package-attribute">License</div>
    <div class="package-value">${fave.license}</div>
  </div>
</div>
<div class="package-properties" style="display: flex">
  <div style="width: 50%">
    <div class="package-attribute">Unpacked Size</div>
    <div class="package-value">
      ${prettyBytes.convert(fave.unpackedSize)}
    </div>
  </div>
  <div style="width: 50%">
    <div class="package-attribute">Total Files</div>
    <div class="package-value">${fave.fileCount}</div>
  </div>
</div>
${npmLinkHtml}
${homepageLinkHtml}
${repositoryLinkHtml}
<div class="package-properties">
  <div class="package-attribute">Last publish</div>
  <div class="package-value">${lastPublish}</div>
</div>
<div class="package-properties">
  <div class="package-attribute">Collaborators</div>
  <div class="package-collaborators">${maintainersHtml}</div>
</div>
<div class="npmf_button npmf_cancel-button">
    <a package-name="${fave.name}" class="pack-unfave">
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
 * Snippet event handler to copy the text to the clipboard.
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
 * Shows a message with the defined text and type.
 * @param {string} notificationMessage The message to show.
 * @param {string} notificationType The ype of message to show.
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
  try {
    // Get the package name from link
    let packageName = this.getAttribute("package-name");
    // Remove the fave from storage
    await npmFaves.storage.removeFave(packageName);
    // Notify to the content script
    notifyEvent({ action: "remove", packageName: packageName });
    // Returns to main view with a message to show
    const message = `${packageName} removed from faves :(`;
    const messageType = "notification-success";
    location.href = `./popup-main.html?noti-message=${message}&noti-type=${messageType}`;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Notifies the unfave event.
 * @param {object} message The message to send with the action to perform.
 * @param {string} message.action The action to perform (add | remove).
 * @param {string} message.packageName The name of the package.
 */
function notifyEvent(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
}
