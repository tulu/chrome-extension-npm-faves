/**
 * Script that adds functionality to the readme page.
 *
 * ¯\_(ツ)_/¯
 *
 * Responsibilities:
 *  - Send page view to Google Analytics
 */

(async () => {
  await sendView();
})();

/**
 * Sends the pageview event
 */
async function sendView() {
  await npmFaves.analytics.sendView(
    npmFaves.helpers.excludeExtensionFromUrl(window.location.href)
  );
}
