/**
 * Functions to manage the persistence of the information.
 *
 * * Responsibilities:
 *  - Get all packages.
 *  - Add package to faves.
 *  - Remove package from faves.
 *  - Get package information.
 *  - Update package information from registry: Dependency on registry-service.
 *  - Get all collections
 *  - Get collection by Id
 *  - Get collection by name (for uniqueness validation)
 *  - Add collection
 *  - Delete collection
 *  - Add package to collection
 *  - Remove package from collection
 *  - Get packages with full information from collection
 *  - Get collections that have a package by package name
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

  /**
   * Gets the next id for the collection based on the max current Id.
   */
  const getNextCollectionId = async function () {
    let nextId = 0;
    try {
      let collections = await npmFaves.storage.getCollections();
      if (collections.length > 0) {
        nextId = collections.reduce(
          (max, collection) => (collection.id > max ? collection.id : max),
          collections[0].id
        );
      }
    } catch (error) {
      console.log(error);
    }
    return nextId + 1;
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
        // Send add event to Google Analytics
        // Ideally would be here but if the function is called from the
        // service worker there is no window object to execute the
        // Google Analytics script
        // npmFaves.tracking.a.sendFaveAdded(packageName);
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
      faves = faves.filter((item) => item.name != packageName);
      // Sort packages alphabetically
      faves.sort((a, b) => (a.name > b.name ? 1 : -1));
      // Save the faves again
      await asyncSetToSyncStorage({ faves: faves });
      // Send remove event to Google Analytics
      // Ideally would be here but if the function is called from the
      // service worker there is no window object to execute the
      // Google Analytics script
      // npmFaves.tracking.a.sendFaveRemoved(packageName);

      // Remove fave from collections
      let collections = await this.getCollections();
      for await (collection of collections) {
        await this.removeFromCollection(collection.id, packageName);
      }
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

  /**
   * Returns a list with all the collections.
   */
  this.storage.getCollections = async function () {
    let collections = [];
    try {
      collections = await asyncGetFromSyncStorage("collections");
    } catch (error) {
      console.log(error);
    }
    return collections || [];
  };

  /**
   * Adds a collection to the list and returns it.
   * @param {object} collectionToCreate The collection to add.
   * @returns {object} The added collection.
   */
  this.storage.saveCollection = async function (collectionToCreate) {
    let collection = null;
    try {
      // Get collection if exists
      if (collectionToCreate.id) {
        collection = await this.getCollectionById(collectionToCreate.id);
      }
      // Get all the collections
      let collections = await this.getCollections();
      if (!collection) {
        // Initiate and add values
        collection = {};
        collection.id = await getNextCollectionId();
        collection.name = collectionToCreate.name;
        collection.type = collectionToCreate.type;
        collection.packages = [];
        // Add created date
        collection.createdAt = Date.now();
        // Add to list
        collections.push(collection);
      } else {
        // Add new values
        collection.name = collectionToCreate.name;
        collection.type = collectionToCreate.type;
        // Update collection in list
        let collectionPosition = -1;
        collectionPosition = collections
          .map(function (e) {
            return e.id;
          })
          .indexOf(collection.id);
        if (collectionPosition > -1) {
          // Update the dates before overriding
          collection.createdAt = collections[collectionPosition].createdAt;
          collection.updatedAt = Date.now();
          collections[collectionPosition] = collection;
        }
      }
      // Sort packages alphabetically
      collections.sort((a, b) => (a.name > b.name ? 1 : -1));
      // Save the faves again
      await asyncSetToSyncStorage({ collections: collections });
    } catch (error) {
      console.log(error);
    }
    return collection;
  };

  /**
   * Returns a collection by Id.
   * @param {integer} collectionId The Id of the collection.
   * @returns {object} The collection.
   */
  this.storage.getCollectionById = async function (collectionId) {
    let collection;
    try {
      if (collectionId) {
        // Get all the collections
        let collections = await this.getCollections();
        // Get the collection by name
        collection = collections.filter((item) => item.id == collectionId);
        if (collection.length == 1) {
          collection = collection[0];
        } else {
          collection = null;
        }
      }
    } catch (error) {
      console.log(error);
    }
    return collection;
  };

  /**
   * Returns a collection by name.
   * @param {string} collectionName The name of the collection.
   * @returns {object} The collection.
   */
  this.storage.getCollectionByName = async function (collectionName) {
    let collection;
    try {
      if (collectionName) {
        // Get all the collections
        let collections = await this.getCollections();
        // Get the collection by name
        collection = collections.filter((item) => item.name == collectionName);
        if (collection.length == 1) {
          collection = collection[0];
        } else {
          collection = null;
        }
      }
    } catch (error) {
      console.log(error);
    }
    return collection;
  };

  /**
   * Removes a collection from the list.
   * @param {integer} collectionId The id of the collection.
   */
  this.storage.deleteCollection = async function (collectionId) {
    try {
      // Get all the collections
      let collections = await this.getCollections();
      // Remove the collection based on the id
      collections = collections.filter((item) => item.id != collectionId);
      // Sort collections alphabetically
      collections.sort((a, b) => (a.name > b.name ? 1 : -1));
      // Save the faves again
      await asyncSetToSyncStorage({ collections: collections });
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Adds a package to a collection.
   * @param {integer} collectionId The id of the collection.
   * @param {string} packageName The name of the package.
   * @param {string} addType The type of dependency (dep | dev)
   */
  this.storage.addToCollection = async function (
    collectionId,
    packageName,
    addType
  ) {
    try {
      // JIC remove if exists
      await this.removeFromCollection(collectionId, packageName);
      // Clean addType JIC
      addType = ["dep", "dev"].includes(addType) ? addType : "dep";
      // Get all the collections
      let collections = await this.getCollections();
      // Find the position in the list to update
      let collectionPosition = -1;
      collectionPosition = collections
        .map(function (e) {
          return e.id;
        })
        .indexOf(collectionId);
      if (collectionPosition > -1) {
        // Add the package to the list
        collections[collectionPosition].packages.push({
          addedAt: Date.now(),
          name: packageName,
          dependencyType: addType,
        });
        // Sort packages by name
        collections[collectionPosition].packages.sort((a, b) =>
          a.name > b.name ? 1 : -1
        );
        // Save the collections
        await asyncSetToSyncStorage({ collections: collections });
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Removes a package from a collection.
   * @param {integer} collectionId The id of the collection.
   * @param {string} packageName The name of the package.
   */
  this.storage.removeFromCollection = async function (
    collectionId,
    packageName
  ) {
    try {
      // Get all the collections
      let collections = await this.getCollections();
      // Find the position in the list to update
      let collectionPosition = -1;
      collectionPosition = collections
        .map(function (e) {
          return e.id;
        })
        .indexOf(collectionId);
      if (collectionPosition > -1) {
        // Remove the package from the list
        collections[collectionPosition].packages = collections[
          collectionPosition
        ].packages.filter((item) => item.name != packageName);
        // Sort packages by name
        collections[collectionPosition].packages.sort((a, b) =>
          a.name > b.name ? 1 : -1
        );
        // Save the collections
        await asyncSetToSyncStorage({ collections: collections });
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Gets the packages with full information from the collection.
   * @param {integer} collectionId The id of the collection.
   * @returns {object[]} List of packages of the collection.
   */
  this.storage.getCollectionFaves = async function (collectionId) {
    let faves = [];
    try {
      // Get all faved packages
      const allFaves = await this.getFaves();
      // Get the collection
      const collection = await this.getCollectionById(collectionId);
      // Filter all the packages to get only what the collection has
      faves = allFaves.filter((fave) =>
        collection.packages.some((pack) => pack.name === fave.name)
      );
      // Add collection added date
      faves = faves.map((item, i) =>
        Object.assign({}, item, collection.packages[i])
      );
    } catch (error) {
      console.log(error);
    }
    return faves || [];
  };

  /**
   * Gets a list of collection names that have the package.
   * @param {string} packageName The name of the package.
   * @returns {string[]} List of collection names that have the package.
   */
  this.storage.getCollectionsByPackage = async function (packageName) {
    let collectionsWithPackage = [];
    try {
      let collections = await this.getCollections();
      collectionsWithPackage = collections
        .filter((collection) =>
          collection.packages.some((fave) => fave.name === packageName)
        )
        .map((collection) => collection.name);
    } catch (error) {
      console.log(error);
    }
    return collectionsWithPackage;
  };

  /**
   * Saves the default information for the package.json file
   * @param {string} version The default version
   * @param {string} author The default author name
   * @param {string} githubUser The default Github username
   * @param {string} license The default license to use
   * @returns {string} The package.json string
   */
  this.storage.saveDefaultPackageJson = async function (
    version = "1.0.0",
    author = "your_name",
    githubUser = "github_username",
    license = "license"
  ) {
    try {
      let packageJson = `{
  "name": "{project_name}",
  "description": "",
  "version": "${version}",
  "scripts": {
    
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/${githubUser}/{project_name}.git"
  },
  "keywords": [],
  "author": "${author}",
  "license": "${license}",
  "bugs": {
    "url": "https://github.com/${githubUser}/{project_name}/issues"
  },
  "homepage": "https://github.com/${githubUser}/{project_name}"
}`;

      await asyncSetToSyncStorage({ packJson: packageJson });
      return packageJson;
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Gets the package.json string with the default information and the
   * dependencies for the collection.
   * @param {integer} [collectionId] The id of the collection
   * @returns {string} The package.json string
   */
  this.storage.getPackageJson = async function (collectionId) {
    try {
      // Get the default template
      let packageJson = await asyncGetFromSyncStorage("packJson");

      // If not exists creates a new one
      if (!packageJson) {
        packageJson = await this.saveDefaultPackageJson();
      }
      // Add dependencies
      if (collectionId) {
        const collectionFaves = await this.getCollectionFaves(collectionId);
        packageJson = JSON.parse(packageJson);
        packageJson.dependencies = {};
        packageJson.devDependencies = {};
        collectionFaves.forEach((fave) => {
          if (fave.dependencyType == "dep") {
            packageJson.dependencies[fave.name] = fave.version;
          }
          if (fave.dependencyType == "dev") {
            packageJson.devDependencies[fave.name] = fave.version;
          }
        });
        packageJson = JSON.stringify(packageJson, null, "\t");
      }
      return packageJson;
    } catch (error) {
      console.log(error);
    }
  };
}.apply(npmFaves));
