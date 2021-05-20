/**
 * Chrome's Sync Storage API in Synchronous way for use in Chrome extensions.
 * Taken from:
 * https://gist.github.com/sumitpore/47439fcd86696a71bf083ede8bbd5466
 * Thank you! :)
 * @todo There is an error when reloading the extension or reinstalling and 
 * the content script are already injected. It's a disconnection and throws an 
 * "Extension context invalidated error". The only way to solve this is by 
 * injecting the scripts into the tabs programatically.
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
