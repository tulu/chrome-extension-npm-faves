/**
 * Script to load all files needed for the background.js worker service
 *
 * Responsibilities:
 *  - Import all the needed scripts
 */

try {
  importScripts("/scripts/utils.js", "/scripts/extension.js");
} catch (e) {
  console.error(e);
}
