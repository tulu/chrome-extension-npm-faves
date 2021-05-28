/**
 * Script to load all files needed for the background.js worker service.
 *
 * Responsibilities:
 *  - Import all the needed scripts.
 */

try {
  importScripts(
    "/scripts/utils/npmFaves-helpers.js",
    "/scripts/services/npmFaves-registry-service.js",
    "/scripts/services/npmFaves-storage-service.js",
    "/scripts/extension.js" // <-- Main file.
  );
} catch (e) {
  console.error(e);
}
