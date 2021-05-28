/**
 * Script to load all files needed for the background.js worker service
 *
 * Responsibilities:
 *  - Import all the needed scripts
 */

try {
  importScripts(
    "/scripts/services/npmFaves-registry-service.js",
    "/scripts/services/npmFaves-storage-service.js",
    "/scripts/extension.js"
  );
} catch (e) {
  console.error(e);
}
