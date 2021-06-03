/**
 * Script to load all files needed for the background.js worker service.
 * for the production environment.
 * 
 * Responsibilities:
 *  - Import all the needed scripts.
 */

 try {
    importScripts(
      "/scripts/npm-faves.core.min.js",
      "/scripts/background.js" // <-- Main file.
    );
  } catch (e) {
    console.error(e);
  }
  