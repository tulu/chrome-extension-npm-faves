/**
 * General helper functions that are here because no one knows where they go 😎
 *
 * * Responsibilities:
 *  - Random helper stuff
 */

/**
 * Global namespace definition.
 */
var npmFaves = npmFaves || {};

(function () {
  // Namespace definition
  this.helpers = this.helpers || {};

  /**
   * Returns the value of a key from the query string.
   * @param {string} url The url to search.
   * @param {string} key The key to look for.
   * @returns {string} The value for that key.
   */
  this.helpers.getQueryStringValue = function (url, key) {
    key = key.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + key + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  };

  /**
   * Returns part of the url after the token without the query string.
   * @param {string} url The url to split.
   * @param {string} token The token to separate the url.
   * @returns {string} The string after the token.
   */
  this.helpers.getUrlPartAfterToken = function (url, token) {
    let splitted = url.split(token);
    if (splitted.length == 2) {
      return splitted[1].split("?")[0];
    }
    return null;
  };

  /**
   * Validates a url based on a pattern
   * @param {string} url The url to validate
   * @returns {boolean} True if the url is valid
   */
  this.helpers.isValidUrl = function (url) {
    const regex =
      /^(https?:\/\/)?([\da-z\.-]+\.[a-z\.]{2,6}|[\d\.]+)([\/:?=&#]{1}[\da-z\.-]+)*[\/\?]?$/gim;
    return url.match(regex);
  };
}.apply(npmFaves));
