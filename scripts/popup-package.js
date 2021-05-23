/**
 * Script that adds functionality to the extension's popup package view.
 *
 * Responsibilities:
 *  - Show the details of the package.
 *  - Remove selected package from faves
 */

 const packageName = getParameterByName("package-name");
 showPackageInformation(packageName);

async function showPackageInformation(packageName){
    const packageView = document.getElementById("packageView");
    let faves = await storageSyncGet("faves");
    let package = null;
    if (faves) {
        package = faves.filter((item) => item.name == packageName);
    }
    if(package.length == 1){
        packageView.innerHTML = getPackageView(package[0]);
    }else{
        alert("Package not found");
    }
}

function getPackageView(package){
return `<div class="package-name">${package.name}</div>
<div class="package-description">${package.description}</div>
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
  <a class="package-value" target="_blank"href="${package.npmLink}">
    ${package.npmLink}
  </a>
</div>
<div class="package-properties">
  <div class="package-attribute">Homepage</div>
  <a class="package-value" target="_blank" href="${package.homepageLink}">
  ${package.homepageLink}
  </a>
</div>
<div class="package-properties">
  <div class="package-attribute">Repository</div>
  <a class="package-value" target="_blank" href="${package.repositoryLink}">
  ${package.repositoryLink}
  </a>
</div>
<div class="package-properties">
  <div class="package-attribute">Last publish</div>
  <div class="package-value">${timeago.format(package.date)}</div>
</div>
<div class="package-properties">
  <div class="package-attribute">Collaborators</div>
  <div class="package-value">${package.maintainers}</div>
</div>`;
}

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

