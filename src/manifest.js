let baseManifest = {
  name: "npm faves",
  description: "Manage your favorite node packages",
  version: "1.5.2",
  manifest_version: 3,
  background: {
    service_worker: "./service-worker.js",
  },
  permissions: ["storage", "tabs", "clipboardWrite"],
  action: {
    default_popup: "./views/popup-main.html",
    default_title: "npm faves",
    default_icon: {
      16: "/images/npm-faves-logo-16.png",
      32: "/images/npm-faves-logo-32.png",
      48: "/images/npm-faves-logo-48.png",
      128: "/images/npm-faves-logo-128.png",
    },
  },
  icons: {
    16: "/images/npm-faves-logo-16.png",
    32: "/images/npm-faves-logo-32.png",
    48: "/images/npm-faves-logo-48.png",
    128: "/images/npm-faves-logo-128.png",
  },
  content_scripts: [],
  options_page: "./views/options.html",
  host_permissions: ["https://registry.npmjs.org/*"],
};

const nameDev = "npm faves (development)";

const contentScriptsDev = {
  matches: ["*://www.npmjs.com/package/*"],
  all_frames: true,
  js: [
    "./scripts/lib/analytics.js",
    "./scripts/services/npmFaves-storage-service.js",
    "./scripts/services/npmFaves-tracking-service.js",
    "./scripts/utils/npmFaves-ui-notification.js",
    "./scripts/utils/npmFaves-helpers.js",
    "./scripts/content-script.js",
  ],
  css: ["./styles/buttons.css", "./styles/notifications.css"],
};

const nameProd = "npm faves";

const contentScriptsProd = {
  matches: ["*://www.npmjs.com/package/*"],
  all_frames: true,
  js: [
    "./scripts/analytics.min.js",
    "./scripts/npm-faves.core.min.js",
    "./scripts/content-script.js",
  ],
  css: ["./styles/npm-faves.ui.min.css"],
};

/**
 *
 * @param {string} env Environment to generate the manifest
 */
exports.generateManifest = function (env) {
  if (env == "production") {
    baseManifest.name = nameProd;
    baseManifest.content_scripts.push(contentScriptsProd);
  }
  if (env == "development") {
    baseManifest.name = nameDev;
    baseManifest.content_scripts.push(contentScriptsDev);
  }
  return baseManifest;
};
