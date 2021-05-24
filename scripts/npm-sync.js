/**
 * Script with functions to sync information with npm repositories.
 *
 * * Responsibilities:
 *  - Retrieve package information from defined repository.
 */

/**
 * Just a facade to decide temporarily which service to use.
 * @param {string} packageName The name of the package
 * @returns {object} The package with the fetched information
 */
async function getPackageInfoByName(packageName) {
  return getPackageInfoByNameFromNpms(packageName);
}

/**
 * Fetches the package information from npms.io
 * @param {string} packageName The name of the package
 * @returns {object} The package with the fetched information
 */
async function getPackageInfoByNameFromNpms(packageName) {
  // Base repository url
  const syncBaseUrl = "https://api.npms.io/v2/package";

  const package = {
    name: packageName,
    description: "N/A",
    version: "N/A",
    date: "N/A",
    publisher: "N/A",
    homepageLink: "N/A",
    repositoryLink: "N/A",
    npmLink: "N/A",
    license: "N/A",
    maintainers:"N/A",
    quality: "N/A",
    popularity: "N/A",
    maintenance: "N/A",
  };
  try {
    const response = await fetch(`${syncBaseUrl}/${packageName}`);
    if (response.ok && response.status == 200) {
      const json = await response.json();
      package.name = json.collected.metadata.name;
      package.description = json.collected.metadata.description;
      package.version = json.collected.metadata.version;
      package.date = json.collected.metadata.date;
      package.publisher = json.collected.metadata.publisher.username;
      package.homepageLink = json.collected.metadata.links.homepage;
      package.repositoryLink = json.collected.metadata.links.repository;
      package.npmLink = json.collected.metadata.links.npm;
      package.license = json.collected.metadata.license;
      package.maintainers = json.collected.metadata.maintainers
        .map((maintainer) => maintainer.username)
        .join(", ");

      package.quality = json.score.detail.quality;
      package.popularity = json.score.detail.popularity;
      package.maintenance = json.score.detail.maintenance;
    }
  } catch (error) {
    console.log(error);
  }
  console.log(package);
  return package;
}

/**
 * Fetches the package information from npmjs.org.
 *
 * DOESN'T WORK! :(
 *
 * Access to fetch at 'https://registry.npmjs.org/express' from origin
 * 'https://www.npmjs.com' has been blocked by CORS policy: No
 * 'Access-Control-Allow-Origin' header is present on the requested resource.
 * If an opaque response serves your needs, set the request's mode to 'no-cors'
 * to fetch the resource with CORS disabled.
 *
 * With no-cors an opaque response is received.
 *
 * If called from popup.js happens the same but the origin is
 * chrome://"extension" instead of https://www.npmjs.co
 *
 * @param {string} packageName The name of the package
 * @returns {object} The package with the fetched information
 */
async function getPackageInfoByNameFromNpmjs(packageName) {
  const baseUrl = "https://registry.npmjs.org";

  const package = {
    name: packageName,
    description: "N/A",
    version: "N/A",
    date: "N/A",
    publisher: "N/A",
    homepageLink: "N/A",
    repositoryLink: "N/A",
    npmLink: "N/A",
    license: "N/A",
    maintainers:"N/A",
    quality: "N/A",
    popularity: "N/A",
    maintenance: "N/A",
  };
  try {
    const response = await fetch(`${baseUrl}/${packageName}`, {
      mode: "no-cors",
    });

    if (response.ok) {
      const json = await response.json();

      // Get latest version
      const version = json["dist-tags"].latest;
      const versionObj = json.versions[version];

      package.name = versionObj.name;
      package.description = versionObj.description;
      package.version = versionObj.version;
      package.date = json.time[version];
      package.publisher = versionObj._npmUser.name;
      package.homepageLink = versionObj.homepage;
      package.repositoryLink = versionObj.repository.url;
      package.license = versionObj.license;

      package.fileCount = versionObj.dist.fileCount;
      package.unpackedSize = versionObj.dist.unpackedSize;
      package.maintainers = versionObj.maintainers
        .map((maintainer) => maintainer.name)
        .join(",");
    }
  } catch (error) {
    console.log(error);
  }
  return package;
}
