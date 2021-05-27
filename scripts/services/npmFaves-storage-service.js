/**
 * Chrome's Sync Storage API in Synchronous way for use in Chrome extensions.
 * Taken from:
 * https://gist.github.com/sumitpore/47439fcd86696a71bf083ede8bbd5466
 * Thank you! :)
 */

/**
 * Retrieve object from Chrome's Sync Storage
 * @param {string} key
 */
async function storageSyncGet(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get(key, function (value) {
        resolve(value[key]);
      });
    } catch (ex) {
      reject(ex);
    }
  });
}

/**
 * Save Object in Chrome's Sync Storage
 * @param {*} obj
 */
async function storageSyncSet(obj) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.set(obj, function () {
        resolve();
      });
    } catch (ex) {
      reject(ex);
    }
  });
}
