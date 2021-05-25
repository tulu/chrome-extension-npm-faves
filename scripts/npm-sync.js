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
    description: "Description not available",
    version: "0.0",
    date: null,
    publisher: "somebody",
    homepageLink: null,
    repositoryLink: null,
    npmLink: null,
    license: "Not available",
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
      package.homepageLink = json.collected.metadata.links.homepage;
      package.repositoryLink = json.collected.metadata.links.repository;
      package.npmLink = json.collected.metadata.links.npm;
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
