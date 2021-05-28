/**
 * Functions to manage the persistence of the information.
 *
 * * Responsibilities:
 *  - Get all packages.
 *  - Add package to faves.
 *  - Remove package from faves.
 *  - Get package information.
 *  - Update package information from registry: Dependency on registry-service.
 */

/**
 * Global namespace definition.
 */
var npmFaves = npmFaves || {};

(function () {
  // Namespace definition
  this.storage = this.storage || {};

  /**
   * Chrome's Sync Storage API in Synchronous way for use in Chrome extensions.
   * Taken from:
   * https://gist.github.com/sumitpore/47439fcd86696a71bf083ede8bbd5466
   * Thank you! :)
   */

  //#region Promise Wrapper

  /**
   * Promise wrapper for chrome.storage.sync.get.
   * @param {string} key The key to look up.
   * @returns {object} The value corresponding to the key.
   */
  const asyncGetFromSyncStorage = async function (key) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.get(key, function (value) {
          resolve(value[key]);
        });
      } catch (ex) {
        reject(ex);
      }
    });
  };

  /**
   * Promise wrapper for chrome.storage.sync.set.
   * @param {object} obj Object to store {key:value}.
   */
  const asyncSetToSyncStorage = async function (obj) {
    return new Promise((resolve, reject) => {
      try {
        chrome.storage.sync.set(obj, function () {
          resolve();
        });
      } catch (ex) {
        reject(ex);
      }
    });
  };

  //#endregion

  /**
   * Updates the package information from the registry if there is a new
   * version.
   * @param {object} fave The package.
   * @returns {object} The package with current or updated information.
   */
  const syncFave = async function (fave) {
    try {
      if (fave) {
        // Checks if there's a new version
        const newVersion = await npmFaves.registry.getPackageVersion(fave.name);
        // It there is then its updated
        if (newVersion && newVersion != fave.version) {
          // Gets the new information
          fave = await npmFaves.registry.getPackageInformation(fave.name);
          // Get all faves
          const faves = await npmFaves.storage.getFaves();
          // Finds the position in the list to update
          let favePosition = -1;
          favePosition = faves
            .map(function (e) {
              return e.name;
            })
            .indexOf(fave.name);
          if (favePosition > -1) {
            // Update the dates before overriding
            fave.createdAt = faves[favePosition].createdAt;
            fave.updatedAt = Date.now();

            faves[favePosition] = fave;
            // Sort packages alphabetically
            faves.sort((a, b) => (a.name > b.name ? 1 : -1));
            // Save the faves again
            await asyncSetToSyncStorage({ faves: faves });
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
    return fave;
  };

  /**
   * Returns a list with all the stored faved packages.
   * @returns {object[]} The list with the faved packages.
   */
  this.storage.getFaves = async function () {
    let faves = [];
    try {
      faves = await asyncGetFromSyncStorage("faves");
    } catch (error) {
      console.log(error);
    }
    return faves || [];
  };

  /**
   * Adds a fave package to the list and returns it.
   * Retrieves the information from the registry before storing.
   * @param {string} packageName The name of the package.
   * @returns {object} The package.
   */
  this.storage.addFave = async function (packageName) {
    let fave = null;
    try {
      // Check if already exist. Also updates the info automatically
      fave = await this.getFave(packageName);
      if (!fave) {
        // Get all the faved packages
        let faves = await this.getFaves();
        // Fetch information from the registry
        fave = await npmFaves.registry.getPackageInformation(packageName);
        // Add created date
        fave.createdAt = Date.now();
        // Add to list
        faves.push(fave);
        // Sort packages alphabetically
        faves.sort((a, b) => (a.name > b.name ? 1 : -1));
        // Save the faves again
        await asyncSetToSyncStorage({ faves: faves });
      }
    } catch (error) {
      console.log(error);
    }
    // If it was already added then it returns an updated version of the
    // package if there is a new version.
    return fave;
  };

  /**
   * Removes a fave package from the list.
   * @param {string} packageName The name of the package.
   */
  this.storage.removeFave = async function (packageName) {
    try {
      // Get all the faved packages
      let faves = await this.getFaves();
      // Remove the package based on the name
      faves = faves.filter((item) => item.name !== packageName);
      // Sort packages alphabetically
      faves.sort((a, b) => (a.name > b.name ? 1 : -1));
      // Save the faves again
      await asyncSetToSyncStorage({ faves: faves });
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Returns a faved package.
   * Syncs information if there is a new version in the registry.
   * @param {string} packageName The name of the package.
   * @param {boolean} [update = true] Indicates of package should be updated.
   * @returns {object} The package.
   */
  this.storage.getFave = async function (packageName, update = true) {
    let fave = null;
    try {
      if (packageName) {
        // Get all the faved packages
        let faves = await this.getFaves();
        // Get the package by its name
        fave = faves.filter((item) => item.name == packageName);
        if (fave.length == 1) {
          fave = fave[0];
          if (update) {
            // Check to update information from registry
            // If not updated returns the same package
            fave = await syncFave(fave);
          }
        } else {
          fave = null;
        }
      }
    } catch (error) {
      console.log(error);
    }
    return fave;
  };
}.apply(npmFaves));
