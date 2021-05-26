/**
 * Script with functions to retrieve information from npm registry.
 * 2 Proxies are defined:
 *  - https://registry.npmjs.org
 *  - https://api.npms.io/v2/package
 *
 * * Responsibilities:
 *  - Retrieve package information with the package name as the input.
 */

/**
 * Functions to retrieve information from https://registry.npmjs.org.
 */
const npmjsProxy = (function () {
  // Registry url
  const registryBaseUrl = "https://registry.npmjs.org";
  // npmjs site url
  const npmjsBaseUrl = "https://www.npmjs.com/package";

  /**
   * Fetches the package information from https://registry.npmjs.org.
   * @param {string} packageName The name of the package.
   * @returns {object} The package with the fetched information.
   */
  const getPackageInformation = async function (packageName) {
    // Response object definition
    const package = {
      name: packageName,
      description: null,
      version: null,
      date: null,
      publisher: null,
      homepageLink: null,
      repositoryLink: null,
      npmLink: `${npmjsBaseUrl}/${packageName}`,
      license: null,
      fileCount: null,
      unpackedSize: null,
      maintainers: null,
    };
    try {
      const response = await fetch(
        `${registryBaseUrl}/${encodeURIComponent(packageName)}`
      );

      if (response.ok && response.status == 200) {
        const json = await response.json();

        // Get latest version
        const latest = json["dist-tags"].latest;
        const versionObj = json.versions[latest];

        package.name = versionObj.name ? versionObj.name : packageName;
        package.description = versionObj.description
          ? versionObj.description
          : null;
        package.version = versionObj.version ? versionObj.version : null;
        package.date = json.time[latest] ? json.time[latest] : null;
        package.publisher = versionObj._npmUser
          ? versionObj._npmUser.name
          : null;
        package.homepageLink = versionObj.homepage
          ? decodeURIComponent(versionObj.homepage)
          : null;

        if (versionObj.repository && versionObj.repository.url) {
          // The url has the protocol in the beginning like "git+{url}"
          let url = versionObj.repository.url;
          url = url.slice(url.indexOf("http"));
          package.repositoryLink = url;
        }
        package.license = versionObj.license ? versionObj.license : null;
        package.maintainers = versionObj.maintainers
          ? versionObj.maintainers
              .map((maintainer) => maintainer.name)
              .join(", ")
          : null;
        // Only available in https://registry.npmjs.org
        package.fileCount = versionObj.dist ? versionObj.dist.fileCount : null;
        package.unpackedSize = versionObj.dist
          ? versionObj.dist.unpackedSize
          : null;
      }
    } catch (error) {
      console.log(error);
    }
    return package;
  };

  /**
   * Fetches the package current version from https://registry.npmjs.org.
   * @param {string} packageName The package name.
   * @returns {string} The package version.
   */
  const getPackageVersion = async function (packageName) {
    let version = null;
    try {
      const response = await fetch(
        `${registryBaseUrl}/${encodeURIComponent(packageName)}`
      );
      if (response.ok && response.status == 200) {
        const json = await response.json();
        const latest = json["dist-tags"].latest;
        const versionObj = json.versions[latest];
        version = versionObj.version ? versionObj.version : null;
      }
    } catch (error) {
      console.log(error);
    }
    return version;
  };

  return {
    getPackageInformation,
    getPackageVersion,
  };
})();

/**
 * * Functions to retrieve information from https://api.npms.io/.
 */
const npmsioProxy = (function () {
  // Registry url
  const registryBaseUrl = "https://api.npms.io/v2/package";
  // npmjs site url
  const npmjsBaseUrl = "https://www.npmjs.com/package";

  /**
   * Fetches the package information from https://api.npms.io/v2/package.
   * @param {string} packageName The name of the package.
   * @returns {object} The package with the fetched information.
   */
  const getPackageInformation = async function (packageName) {
    // Response object definition
    const package = {
      name: packageName,
      description: null,
      version: null,
      date: null,
      publisher: null,
      homepageLink: null,
      repositoryLink: null,
      npmLink: `${npmjsBaseUrl}/${packageName}`,
      license: null,
      fileCount: null,
      unpackedSize: null,
      maintainers: null,
    };
    try {
      const response = await fetch(
        `${registryBaseUrl}/${encodeURIComponent(packageName)}`
      );

      if (response.ok && response.status == 200) {
        const json = await response.json();

        if (json.collected && json.collected.metadata) {
          // Shortcut
          const metadata = json.collected.metadata;

          package.name = metadata.name ? metadata.name : packageName;
          package.description = metadata.description
            ? metadata.description
            : null;
          package.version = metadata.version ? metadata.version : null;
          package.date = metadata.date ? metadata.date : null;
          package.publisher =
            metadata.publisher && metadata.publisher.username
              ? metadata.publisher.username
              : null;
          if (metadata.links) {
            package.homepageLink = metadata.links.homepage
              ? decodeURIComponent(metadata.links.homepage)
              : null;
            package.repositoryLink = metadata.links.repository
              ? decodeURIComponent(metadata.links.repository)
              : null;
          }
          package.license = metadata.license ? metadata.license : null;
          package.maintainers = metadata.maintainers
            ? metadata.maintainers
                .map((maintainer) => maintainer.username)
                .join(", ")
            : null;
          // Only available in https://registry.npmjs.org
          package.fileCount = null;
          package.unpackedSize = null;
        }
      }
    } catch (error) {
      console.log(error);
    }
    return package;
  };

  /**
   * Fetches the package current version from https://api.npms.io/v2/package.
   * @param {string} packageName The package name.
   * @returns {string} The package version.
   */
  const getPackageVersion = async function (packageName) {
    let version = null;
    try {
      const response = await fetch(
        `${registryBaseUrl}/${encodeURIComponent(packageName)}`
      );
      if (response.ok && response.status == 200) {
        const json = await response.json();
        if (
          json.collected &&
          json.collected.metadata &&
          json.collected.metadata.version
        ) {
          version = json.collected.metadata.version;
        }
      }
    } catch (error) {
      console.log(error);
    }
    return version;
  };

  return {
    getPackageInformation,
    getPackageVersion,
  };
})();