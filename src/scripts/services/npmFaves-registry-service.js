/**
 * Functions to retrieve information of the packages from
 * https://registry.npmjs.org.
 *
 * * Responsibilities:
 *  - Retrieve package information with the package name as the input.
 *  - Retrieve package latest version with the package name as the input.
 */

/**
 * Global namespace definition.
 */
var npmFaves = npmFaves || {};

(function () {
  // Namespace definition
  this.registry = this.registry || {};

  // Registry url
  const registryBaseUrl = "https://registry.npmjs.org";
  // npmjs site url
  const npmjsBaseUrl = "https://www.npmjs.com/package";

  /**
   * Fetches the package information from https://registry.npmjs.org.
   * @param {string} packageName The name of the package.
   * @returns {object} The package with the fetched information.
   */
  this.registry.getPackageInformation = async function (packageName) {
    // Response object definition
    const regPackage = {
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

        regPackage.name = versionObj.name ? versionObj.name : packageName;
        // Description with HTML tags not allowed
        if (
          versionObj.description &&
          !npmFaves.helpers.hasTags(versionObj.description)
        ) {
          regPackage.description = versionObj.description;
        }

        regPackage.version = versionObj.version ? versionObj.version : null;
        regPackage.date = json.time[latest] ? json.time[latest] : null;
        regPackage.publisher = versionObj._npmUser
          ? versionObj._npmUser.name
          : null;
        regPackage.homepageLink = versionObj.homepage
          ? decodeURIComponent(versionObj.homepage)
          : null;

        if (versionObj.repository && versionObj.repository.url) {
          // The url has the protocol in the beginning like "git+{url}"
          let url = versionObj.repository.url;
          if (npmFaves.helpers.isValidUrl(url.slice(url.indexOf("http")))) {
            url = url.slice(url.indexOf("http"));
          }
          regPackage.repositoryLink = url;
        }
        regPackage.license = versionObj.license ? versionObj.license : null;
        regPackage.maintainers = versionObj.maintainers
          ? versionObj.maintainers
              .map((maintainer) => maintainer.name)
              .join(", ")
          : null;
        regPackage.fileCount = versionObj.dist
          ? versionObj.dist.fileCount
          : null;
        regPackage.unpackedSize = versionObj.dist
          ? versionObj.dist.unpackedSize
          : null;
      }
    } catch (error) {
      console.log(error);
    }
    return regPackage;
  };

  /**
   * Fetches the package latest version from https://registry.npmjs.org.
   * @param {string} packageName The package name.
   * @returns {string} The package version.
   */
  this.registry.getPackageVersion = async function (packageName) {
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
}.apply(npmFaves));
