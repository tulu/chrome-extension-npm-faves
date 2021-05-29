/**
 * Script that adds functionality to the options page.
 *
 * Responsibilities:
 *  - Show the list of faved packages.
 */

(async () => {
  await showFavesList();
})();

/**
 * Loads faved packages from the storage and shows the list.
 * Also renders an option to remove from faves.
 */
async function showFavesList() {
  const favesContainer = document.getElementById("favesContainer");
  const foundTitle = document.getElementById("foundTitle");
  let faves = [];
  try {
    faves = await npmFaves.storage.getFaves();
    if (faves.length > 0) {
      let list = `<h3>Faved Packages</h3>
      <table class="fave-table"><thead><tr>
      <th>Name</th><th>Version</th><th>Published</th><th>Added</th>
      <th>Updated</th></tr></thead><tbody>`;

      faves.forEach((favePackage) => {
        list += getFavePackageRow(favePackage);
      });
      list += `</tbody></table>`;
      favesContainer.innerHTML = list;
      // Found title
      foundTitle.innerHTML = `1 package found`;
      if (faves.length > 1) {
        foundTitle.innerHTML = `${faves.length} packages found`;
      }
    } else {
      foundTitle.innerHTML = "0 packages found";
      favesContainer.innerHTML = `<div class="empty-list">
            No faved packages yet :(<br /> Please add some
        </div>`;
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Returns an html row with the package information
 * @param {object} fave A faved package
 * @returns {string} The html row for the package
 */
function getFavePackageRow(fave) {
  let updatedAt = "-";
  if (fave.updatedAt) {
    updatedAt = new Date(fave.updatedAt).toLocaleDateString();
  }
  return `<tr>
    <td>
        <a target="_blank" href="${fave.npmLink}">${fave.name}</a>
    </td>
    <td>${fave.version}</td>
    <td>${timeago.format(fave.date)}</td>
    <td>${new Date(fave.createdAt).toLocaleDateString()}</td>
    <td>${updatedAt}</td>
  </tr>`;
}

/**
 * Listens for onChanged event from the storage to update the list.
 */
chrome.storage.onChanged.addListener(async function (changes, areaName) {
  if (changes) {
    await showFavesList();
  }
});
