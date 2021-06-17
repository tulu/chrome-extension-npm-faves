/**
 * Functions to track usage with Google Analytics.
 *
 * * Responsibilities:
 *  - Send page views
 *  - Send events
 *    - Add fave
 *    - Remove fave
 *    - Snippet copied
 *    - Add collection
 *    - Remove collection
 *    - Add package to collection
 *    - Remove package from collection
 *    - Edit collection
 *
 * Events structure:
 * Category               Action                Label
 * "fave_manage"          "add"                 package name
 * "fave_manage"          "remove"              package name
 * "fave_manage"          "copy_to_clipboard"   package name
 * "collection_manage"    "add"                 collection name
 * "collection_manage"    "remove"              collection name
 * "collection_manage"    "edit"                collection name
 * "collection_manage"    "add_package"         package name
 * "collection_manage"    "remove_package"      package name
 */

/**
 * Global namespace definition.
 */
var npmFaves = npmFaves || {};

(function () {
  // Namespace definition
  this.tracking = this.tracking || {};

  // Account ID (same for both versions)
  const analyticsAccount = "UA-198174258-1";

  /**
   * Functions to use the old Google Analytics.
   * The script to add must be: "/scripts/lib/ga.js".
   */

  // Namespace for old Google Analytics
  this.tracking.ga = this.tracking.ga || {};

  /**
   * Sets the account Id.
   */
  const initGa = function () {
    window._gaq = window._gaq || [];
    _gaq.push(["_setAccount", analyticsAccount]);
  };

  /**
   * Sends a page view to Google Analytics.
   * @param {string} page Name of the page to track.
   */
  this.tracking.ga.sendView = function (page) {
    initGa();
    _gaq.push(["_trackPageview", page]);
  };

  /**
   * Sends an event when a package is added.
   * @param {string} packageName The name of the package.
   */
  this.tracking.ga.sendFaveAdded = function (packageName) {
    initGa();
    _gaq.push(["_trackEvent", "fave_manage", "add", packageName]);
  };

  /**
   * Sends an event when a package is removed.
   * @param {string} packageName The name of the package.
   */
  this.tracking.ga.sendFaveRemoved = function (packageName) {
    initGa();
    _gaq.push(["_trackEvent", "fave_manage", "remove", packageName]);
  };

  /**
   * Sends an event when a package installation snippet is copied to
   * the clipboard.
   * @param {string} packageName The name of the package.
   */
  this.tracking.ga.sendFaveSnippetCopied = function (packageName) {
    initGa();
    _gaq.push(["_trackEvent", "fave_manage", "copy_to_clipboard", packageName]);
  };

  /**
   * Sends an event when a collection is added.
   * @param {string} collectionName The name of the collection.
   */
  this.tracking.ga.sendCollectionAdded = function (collectionName) {
    initGa();
    _gaq.push(["_trackEvent", "collection_manage", "add", collectionName]);
  };

  /**
   * Sends an event when a collection is removed.
   * @param {string} collectionName The name of the collection.
   */
  this.tracking.ga.sendCollectionRemoved = function (collectionName) {
    initGa();
    _gaq.push(["_trackEvent", "collection_manage", "remove", collectionName]);
  };

  /**
   * Sends an event when a collection is edited.
   * @param {string} collectionName The name of the collection.
   */
  this.tracking.ga.sendCollectionEdited = function (collectionName) {
    initGa();
    _gaq.push(["_trackEvent", "collection_manage", "edit", collectionName]);
  };

  /**
   * Sends an event when a package is added to a collection.
   * @param {string} packageName The name of the package.
   */
  this.tracking.ga.sendPackageAddedToCollection = function (packageName) {
    initGa();
    _gaq.push(["_trackEvent", "collection_manage", "add_package", packageName]);
  };

  /**
   * Sends an event when a package is removed from a collection.
   * @param {string} packageName The name of the package.
   */
  this.tracking.ga.sendPackageRemovedFromCollection = function (packageName) {
    initGa();
    _gaq.push([
      "_trackEvent",
      "collection_manage",
      "remove_package",
      packageName,
    ]);
  };

  /**
   * Functions to use the "new" Google Analytics.
   * The script to add must be: "/scripts/lib/analytics.js".
   */

  // Namespace for "new" Google Analytics
  this.tracking.a = this.tracking.a || {};

  /**
   * Initializes the script and sets the account Id.
   */
  const initA = function () {
    window["GoogleAnalyticsObject"] = "ga";
    (window["ga"] =
      window["ga"] ||
      function () {
        (window["ga"].q = window["ga"].q || []).push(arguments);
      }),
      (window["ga"].l = 1 * new Date());
    ga("create", analyticsAccount, "auto");
    ga("set", "checkProtocolTask", null);
  };

  /**
   * Sends a page view to Google Analytics.
   * @param {string} page Name of the page to track.
   */
  this.tracking.a.sendView = function (page) {
    initA();
    ga("set", "page", page);
    ga("send", "pageview");
  };

  /**
   * Sends an event when a package is added.
   * @param {string} packageName The name of the package.
   */
  this.tracking.a.sendFaveAdded = function (packageName) {
    initA();
    ga("send", "event", "fave_manage", "add", packageName);
  };

  /**
   * Sends an event when a package is removed.
   * @param {string} packageName The name of the package.
   */
  this.tracking.a.sendFaveRemoved = function (packageName) {
    initA();
    ga("send", "event", "fave_manage", "remove", packageName);
  };

  /**
   * Sends an event when a package installation snippet is copied to
   * the clipboard.
   * @param {string} packageName The name of the package.
   */
  this.tracking.a.sendFaveSnippetCopied = function (packageName) {
    initA();
    ga("send", "event", "fave_manage", "copy_to_clipboard", packageName);
  };

  /**
   * Sends an event when a collection is added.
   * @param {string} collectionName The name of the collection.
   */
  this.tracking.a.sendCollectionAdded = function (collectionName) {
    initA();
    ga("send", "event", "collection_manage", "add", collectionName);
  };

  /**
   * Sends an event when a collection is removed.
   * @param {string} collectionName The name of the collection.
   */
  this.tracking.a.sendCollectionRemoved = function (collectionName) {
    initA();
    ga("send", "event", "collection_manage", "remove", collectionName);
  };

  /**
   * Sends an event when a collection is edited.
   * @param {string} collectionName The name of the collection.
   */
  this.tracking.a.sendCollectionEdited = function (collectionName) {
    initA();
    ga("send", "event", "collection_manage", "edit", collectionName);
  };

  /**
   * Sends an event when a package is added to a collection.
   * @param {string} packageName The name of the package.
   */
  this.tracking.a.sendPackageAddedToCollection = function (packageName) {
    initA();
    ga("send", "event", "collection_manage", "add_package", packageName);
  };

  /**
   * Sends an event when a package is removed from a collection.
   * @param {string} packageName The name of the package.
   */
  this.tracking.a.sendPackageRemovedFromCollection = function (packageName) {
    initA();
    ga("send", "event", "collection_manage", "remove_package", packageName);
  };
}.apply(npmFaves));
