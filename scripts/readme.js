/**
 * Script that adds functionality to the readme page.
 * 
 * ¯\_(ツ)_/¯
 * 
 * Responsibilities:
 *  - Send page view to Google Analytics
 */

sendView();

/**
 * Sends the pageview event
 */
 function sendView() {
    npmFaves.tracking.a.sendView(
      npmFaves.helpers.excludeExtensionFromUrl(window.location.href)
    );
  }