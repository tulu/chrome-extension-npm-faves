/**
 * Script with functions to sync information with npm repositories.
 *
 * * Responsibilities:
 *  - Retrieve package information from defined repository.
 */

/**
 * Base url for retrieving packages information
 */
const syncBaseUrl = "https://api.npms.io/v2/package";

/**
 * Just a facade to decide temporarily which service to use.
 * @param {string} packageName The name of the package
 * @returns {object} The package with the fetched information
 */
async function getPackageInfoByName(packageName) {
  return getPackageInfoByNameFromNpmjs(packageName);
}

/**
 * Fetches the package information from npms.io
 * @param {string} packageName The name of the package
 * @returns {object} The package with the fetched information
 */
async function getPackageInfoByNameFromNpms(packageName) {
  const package = {
    name: packageName,
    description: "Description not available",
    version: "0.0",
    date: null,
    publisher: "somebody",
    homepageLink: null,
    repositoryLink: null,
    npmLink: null,
    license: "Unlicensed",
    maintainers: null,
  };
  try {
    const response = await fetch(
      `${syncBaseUrl}/${encodeURIComponent(packageName)}`
    );
    if (response.ok && response.status == 200) {
      const json = await response.json();
      package.name = json.collected.metadata.name;
      package.description = json.collected.metadata.description;
      package.version = json.collected.metadata.version;
      package.date = json.collected.metadata.date;
      package.publisher = json.collected.metadata.publisher.username;
      package.homepageLink = json.collected.metadata.links.homepage
        ? decodeURIComponent(json.collected.metadata.links.homepage)
        : null;
      package.repositoryLink = json.collected.metadata.links.repository
        ? decodeURIComponent(json.collected.metadata.links.repository)
        : null;
      package.npmLink = decodeURIComponent(json.collected.metadata.links.npm);
      package.license = json.collected.metadata.license;
      package.maintainers = json.collected.metadata.maintainers
        .map((maintainer) => maintainer.username)
        .join(", ");
    }
  } catch (error) {
    console.log(error);
  }
  return package;
}

/**
 * Fetches the package current version
 * @param {string} packageName The package name
 * @returns {string} The package version
 */
async function getPackageVersion(packageName) {
  let version = null;
  const response = await fetch(
    `${syncBaseUrl}/${encodeURIComponent(packageName)}`
  );
  if (response.ok && response.status == 200) {
    const json = await response.json();
    version = json.collected.metadata.version;
  }
  return version;
}

/**
 * Fetches the package information from npmjs.org.
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
  const npmjsBaseUrl = "https://www.npmjs.com/package";

  const package = {
    name: packageName,
    description: "Description not available",
    version: "0.0",
    date: null,
    publisher: "somebody",
    homepageLink: null,
    repositoryLink: null,
    npmLink: null,
    license: "Unlicensed",
    maintainers: null,
  };
  try {
    const response = await fetch(
      `${baseUrl}/${encodeURIComponent(packageName)}`,
      {}
    );

    if (response.ok) {
      const json = await response.json();

      // Get latest version
      const version = json["dist-tags"].latest;
      const versionObj = json.versions[version];

      package.name = versionObj.name;
      package.description = versionObj.description;
      package.version = versionObj.version;
      package.date = json.time[version];
      package.publisher = versionObj._npmUser
        ? versionObj._npmUser.name
        : "somebody";
      package.homepageLink = versionObj.homepage
        ? decodeURIComponent(versionObj.homepage)
        : null;
      package.repositoryLink =
        versionObj.repository && versionObj.repository.url
          ? decodeURIComponent(versionObj.repository.url)
          : null;
      package.npmLink = `${npmjsBaseUrl}/${packageName}`;
      package.license = versionObj.license;

      package.fileCount = versionObj.dist ? versionObj.dist.fileCount : null;
      package.unpackedSize = versionObj.dist
        ? versionObj.dist.unpackedSize
        : null;
      package.maintainers = versionObj.maintainers
        .map((maintainer) => maintainer.name)
        .join(", ");
    }
  } catch (error) {
    console.log(error);
  }
  return package;
}
