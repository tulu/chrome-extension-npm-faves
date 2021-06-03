/**
 * Script to load all files needed for the background.js worker service
 * for the development environment.
 *
 * Responsibilities:
 *  - Import all the needed scripts.
 */

try {
  importScripts(
    "/scripts/services/npmFaves-tracking-service.js",
    "/scripts/services/npmFaves-storage-service.js",
    "/scripts/services/npmFaves-registry-service.js",
    "/scripts/utils/npmFaves-ui-notification.js",
    "/scripts/utils/npmFaves-helpers.js",
    "/scripts/background.js" // <-- Main file.
  );
} catch (e) {
  console.error(e);
}
