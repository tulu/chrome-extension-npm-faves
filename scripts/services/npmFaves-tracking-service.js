/**
 * Functions to track usage with Google Analytics.
 *
 * * Responsibilities:
 *  - Send page views
 *  - Send events
 *
 * Events structure:
 * Category         Action              Label
 * "fave_manage"    "add" / "remove"    package name
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
   * Functions to use the old Google Analytics
   * The script to add must be: "/scripts/lib/ga.js"
   */

  // Namespace for old Google Analytics
  this.tracking.ga = this.tracking.ga || {};

  /**
   * Sets the account Id
   */
  const initGa = function () {
    window._gaq = window._gaq || [];
    _gaq.push(["_setAccount", analyticsAccount]);
  };

  /**
   * Sends a page view to Google Analytics
   * @param {string} page Name of the page to track
   */
  this.tracking.ga.sendView = function (page) {
    initGa();
    _gaq.push(["_trackPageview", page]);
  };

  /**
   * Sends an event when a package is added
   * @param {string} packageName The name of the package
   */
  this.tracking.ga.sendFaveAdded = function (packageName) {
    initGa();
    _gaq.push(["_trackEvent", "fave_manage", "add", packageName]);
  };

  /**
   * Sends an event when a package is removed
   * @param {string} packageName The name of the package
   */
  this.tracking.ga.sendFaveRemoved = function (packageName) {
    initGa();
    _gaq.push(["_trackEvent", "fave_manage", "remove", packageName]);
  };

  /**
   * Functions to use the "new" Google Analytics
   * The script to add must be: "/scripts/lib/analytics.js"
   */

  // Namespace for "new" Google Analytics
  this.tracking.a = this.tracking.a || {};

  /**
   * Initializes the script and sets the account Id
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
   * Sends a page view to Google Analytics
   * @param {string} page Name of the page to track
   */
  this.tracking.a.sendView = function (page) {
    initA();
    ga("set", "page", page);
    ga("send", "pageview");
  };

  /**
   * Sends an event when a package is added
   * @param {string} packageName The name of the package
   */
  this.tracking.a.sendFaveAdded = function (packageName) {
    initA();
    ga("send", "event", "fave_manage", "add", packageName);
  };

  /**
   * Sends an event when a package is removed
   * @param {string} packageName The name of the package
   */
  this.tracking.a.sendFaveRemoved = function (packageName) {
    initA();
    ga("send", "event", "fave_manage", "remove", packageName);
  };
}.apply(npmFaves));
