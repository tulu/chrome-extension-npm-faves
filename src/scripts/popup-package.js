/**
 * Script that adds functionality to the extension's popup package view.
 *
 * Responsibilities:
 *  - Show the details of the package.
 *  - Redirects to remove package warning.
 */

(async () => {
  sendView();
  addBackNavigation();
  await showPackageInformation();
  addEventToCopyInstallation();
})();

/**
 * Sends the pageview event.
 */
function sendView() {
  npmFaves.tracking.a.sendView(
    npmFaves.helpers.excludeExtensionFromUrl(window.location.href, false)
  );
}

/**
 * Adds the back navigation link.
 */
function addBackNavigation() {
  let collectionId = npmFaves.helpers.getQueryStringValue(
    window.location.href,
    "collectionId"
  );
  collectionId = collectionId != "null" ? `id=${collectionId}` : "";
  const backButton = document.getElementById("backButton");
  backButton.href = `./popup-collection.html?${collectionId}`;
}

/**
 * Gets the package information from the storage and shows it in the view.
 * @param {string} packageName The name of the package.
 */
async function showPackageInformation() {
  try {
    const packageName = npmFaves.helpers.getQueryStringValue(
      window.location.href,
      "packageName"
    );
    let fave = await npmFaves.storage.getFave(packageName);
    if (fave) {
      const packageView = document.getElementById("packageView");
      packageView.innerHTML = getPackageView(fave);
    } else {
      const message = `${packageName} not found`;
      const messageType = "ERROR";
      location.href = `./popup-collection.html?notiMessage=${message}&notiType=${messageType}&${collectionId}`;
    }
  } catch (error) {
    console.log(error);
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
  // Size and files
  let sizeAndFiles = "";
  if (fave.unpackedSize && fave.fileCount) {
    sizeAndFiles = `<div style="width: 25%">
        <div class="package-attribute">Unpacked</div>
        <div class="package-value">
          ${prettyBytes.convert(fave.unpackedSize)}
        </div>
      </div>
      <div style="width: 25%">
        <div class="package-attribute">Files</div>
        <div class="package-value">${fave.fileCount}</div>
      </div>`;
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
    let link = "";
    if (npmFaves.helpers.isValidUrl(fave.homepageLink)) {
      link = `href="${fave.homepageLink}"`;
    }
    homepageLinkHtml = `<div class="package-properties">
      <div class="package-attribute">Homepage</div>
      <a class="package-value" target="_blank" ${link}>
        ${fave.homepageLink}
      </a>
    </div>`;
  }
  //Repository link
  let repositoryLinkHtml = "";
  if (fave.repositoryLink) {
    let link = "";
    if (npmFaves.helpers.isValidUrl(fave.repositoryLink)) {
      link = `href="${fave.repositoryLink}"`;
    }
    repositoryLinkHtml = `<div class="package-properties">
      <div class="package-attribute">Repository</div>
      <a class="package-value" target="_blank" ${link}>
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
        <img src="${getUserAvatar(maintainer)}" 
        title="${maintainer.trim()}">
      </a>`;
    });
  }
  // Delete url definition
  let deleteUrl = `./popup-delete-package.html?packageName=${fave.name}`;
  let collectionId = npmFaves.helpers.getQueryStringValue(
    window.location.href,
    "collectionId"
  );
  collectionId = collectionId != "null" ? `&collectionId=${collectionId}` : "";
  deleteUrl += collectionId;

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
  <div style="width: 25%">
    <div class="package-attribute">Version</div>
    <div class="package-value">${fave.version}</div>
  </div>
  <div style="width: 25%">
    <div class="package-attribute">License</div>
    <div class="package-value">${fave.license ? fave.license : "None"}</div>
  </div>
  ${sizeAndFiles}
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
    <a package-name="${fave.name}" href="${deleteUrl}">
        <span class="material-icons-outlined"> delete </span>
        Remove from faves
    </a>
</div>`;
}

/**
 * Returns the user avatar url based on the name.
 * 2 different services implemented but only 1 used
 * @param {string} maintainer username of the maintainer
 * @returns URL with a random avatar of the user
 */
function getUserAvatar(maintainer) {
  //let tinygraphs = `http://tinygraphs.com/labs/isogrids/hexa16/${maintainer.trim()}?theme=berrypie&numcolors=2&size=42&fmt=svg`;
  let dicebear = `https://avatars.dicebear.com/api/gridy/${maintainer.trim()}.svg`;
  return dicebear;
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
  npmFaves.ui.createNotification(
    npmFaves.ui.notificationTypes.SUCCESS,
    "Install snippet copied!",
    true
  );
  // Send copy to clipboard event to Google Analytics
  const packageName = npmFaves.helpers.getQueryStringValue(
    window.location.href,
    "packageName"
  );
  npmFaves.tracking.a.sendFaveSnippetCopied(packageName);
}
