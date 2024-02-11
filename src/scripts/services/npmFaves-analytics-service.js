/**
 * Functions to track usage with Google Analytics.
 *
 * * Responsibilities:
 *  - Send page views
 *  - Send events
 *    - Add fave
 *    - Remove fave
 *    - Snippet copied
 *    - Notes added
 *    - Add collection
 *    - Remove collection
 *    - Edit collection
 *    - Add package to collection
 *    - Remove package from collection
 *    - Save package json
 *
 * Events structure:
 * Category               Action                  Label
 * "fave_manage"          "add"                   package name
 * "fave_manage"          "remove"                package name
 * "fave_manage"          "copy_to_clipboard"     package name
 * "fave_manage"          "notes_added"           package name
 * "collection_manage"    "add"                   collection name
 * "collection_manage"    "remove"                collection name
 * "collection_manage"    "edit"                  collection name
 * "collection_manage"    "add_package"           package name
 * "collection_manage"    "remove_package"        package name
 * "package_json_manage"  "save_package_json"
 * "package_json_manage"  "download_package_json" collection name
 */

/**
 * Global namespace definition.
 */
var npmFaves = npmFaves || {};

(function () {
  // Endpoints
  const GA_ENDPOINT = "https://www.google-analytics.com/mp/collect";
  const GA_DEBUG_ENDPOINT = "https://www.google-analytics.com/debug/mp/collect";
  // Account and constants definitions
  const MEASUREMENT_ID = "G-8C0K4HBHYW";
  const API_SECRET = "ix3gkJWIQEyBEYPRStQmXw";
  const DEFAULT_ENGAGEMENT_TIME_MSEC = 100;
  const SESSION_EXPIRATION_IN_MIN = 30;
  const debug = false;

  chrome.storage.session.setAccessLevel({
    accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS",
  });

  // Returns the client id, or creates a new one if one doesn't exist.
  // Stores client id in local storage to keep the same client id as long as
  // the extension is installed.
  const getOrCreateClientId = async () => {
    let { clientId } = await chrome.storage.local.get("clientId");
    if (!clientId) {
      // Generate a unique client ID, the actual value is not relevant
      clientId = self.crypto.randomUUID();
      await chrome.storage.local.set({ clientId });
    }
    return clientId;
  };

  // Returns the current session id, or creates a new one if one doesn't exist or
  // the previous one has expired.
  const getOrCreateSessionId = async () => {
    // Use storage.session because it is only in memory
    let { sessionData } = await chrome.storage.session.get("sessionData");
    const currentTimeInMs = Date.now();
    // Check if session exists and is still valid
    if (sessionData && sessionData.timestamp) {
      // Calculate how long ago the session was last updated
      const durationInMin = (currentTimeInMs - sessionData.timestamp) / 60000;
      // Check if last update lays past the session expiration threshold
      if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
        // Clear old session id to start a new session
        sessionData = null;
      } else {
        // Update timestamp to keep session alive
        sessionData.timestamp = currentTimeInMs;
        await chrome.storage.session.set({ sessionData });
      }
    }
    if (!sessionData) {
      // Create and store a new session
      sessionData = {
        session_id: currentTimeInMs.toString(),
        timestamp: currentTimeInMs.toString(),
      };
      await chrome.storage.session.set({ sessionData });
    }
    return sessionData.session_id;
  };

  // Fires an event with optional params. Event names must only include letters and underscores.
  const sendEvent = async (name, params = {}) => {
    if (!params.session_id) {
      params.session_id = await getOrCreateSessionId();
    }
    if (!params.engagement_time_msec) {
      params.engagement_time_msec = DEFAULT_ENGAGEMENT_TIME_MSEC;
    }

    try {
      const response = await fetch(
        `${
          debug ? GA_DEBUG_ENDPOINT : GA_ENDPOINT
        }?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
        {
          method: "POST",
          body: JSON.stringify({
            client_id: await getOrCreateClientId(),
            events: [
              {
                name,
                params,
              },
            ],
          }),
        }
      );
      // if (!debug) {
      //   return;
      // }
      await response.text();
    } catch (e) {
      console.error("Google Analytics request failed with an exception", e);
    }
  };

  // Namespace definition
  this.analytics = this.analytics || {};

  // Fire a page view event.
  this.analytics.sendView = async (page) => {
    return await sendEvent("page_view", {
      page_title: page,
    });
  };

  /**
   * Sends an event when a package is added.
   * @param {string} packageName The name of the package.
   */
  this.analytics.sendFaveAdded = async (packageName) => {
    return await sendEvent("fave_manage", {
      action: "add",
      label: packageName,
    });
  };

  /**
   * Sends an event when a package is removed.
   * @param {string} packageName The name of the package.
   */
  this.analytics.sendFaveRemoved = async (packageName) => {
    return await sendEvent("fave_manage", {
      action: "remove",
      label: packageName,
    });
  };

  /**
   * Sends an event when a package installation snippet is copied to
   * the clipboard.
   * @param {string} packageName The name of the package.
   */
  this.analytics.sendFaveSnippetCopied = async (packageName) => {
    return await sendEvent("fave_manage", {
      action: "copy_to_clipboard",
      label: packageName,
    });
  };

  /**
   * Sends an event when personal notes area added to a package
   * @param {string} packageName The name of the package.
   */
  this.analytics.sendFaveNotesSaved = async (packageName) => {
    return await sendEvent("fave_manage", {
      action: "notes_added",
      label: packageName,
    });
  };

  /**
   * Sends an event when a collection is added.
   * @param {string} collectionName The name of the collection.
   */
  this.analytics.sendCollectionAdded = async (collectionName) => {
    return await sendEvent("collection_manage", {
      action: "add",
      label: collectionName,
    });
  };

  /**
   * Sends an event when a collection is removed.
   * @param {string} collectionName The name of the collection.
   */
  this.analytics.sendCollectionRemoved = async (collectionName) => {
    return await sendEvent("collection_manage", {
      action: "remove",
      label: collectionName,
    });
  };

  /**
   * Sends an event when a collection is edited.
   * @param {string} collectionName The name of the collection.
   */
  this.analytics.sendCollectionEdited = async (collectionName) => {
    return await sendEvent("collection_manage", {
      action: "edit",
      label: collectionName,
    });
  };

  /**
   * Sends an event when a package is added to a collection.
   * @param {string} packageName The name of the package.
   */
  this.analytics.sendPackageAddedToCollection = async (packageName) => {
    return await sendEvent("collection_manage", {
      action: "add_package",
      label: packageName,
    });
  };

  /**
   * Sends an event when a package is removed from a collection.
   * @param {string} packageName The name of the package.
   */
  this.analytics.sendPackageRemovedFromCollection = async (packageName) => {
    return await sendEvent("collection_manage", {
      action: "remove_package",
      label: packageName,
    });
  };

  /**
   * Sends an event when a package.json defaults is saved.
   */
  this.analytics.sendPackageJsonSaved = async () => {
    return await sendEvent("package_json_manage", {
      action: "save_package_json",
    });
  };

  /**
   * Sends an event when a package.json is downloaded for a collection.
   */
  this.analytics.sendPackageJsonDownloaded = async (collectionName) => {
    return await sendEvent("package_json_manage", {
      action: "download_package_json",
      label: collectionName,
    });
  };
}).apply(npmFaves);
