/**
 * Gulp process to automate dev and prod.
 * Development: Process all files, copy to dist, watch files
 * Production: Process all files, copy to dist, create zip
 *
 * Usage:
 * > gulp --env=development
 * > gulp --env=production
 */

const { src, dest, series, watch, parallel } = require("gulp");
const del = require("del");
const cache = require("gulp-cache");
const gulpif = require("gulp-if");
const cssnano = require("gulp-cssnano");
const uglify = require("gulp-uglify");
const useref = require("gulp-useref");
const imagemin = require("gulp-imagemin");
const rename = require("gulp-rename");
const manifest = require("./src/manifest");
const file = require("gulp-file");
const logger = require("gulplog");
const decomment = require("gulp-decomment");
const zip = require("gulp-zip");

/**
 * Main configuration
 */
const config = {
  environment: "development", // default environment
  name: "",
  version: 0,
};

/**
 * Sets the environment based on the command line args.
 * The default environment is "development".
 */
function setEnvironment() {
  let envArg = process.argv.filter((v) => v.startsWith("--env="));
  envArg = envArg.length == 1 ? envArg[0].split("=")[1] : null;
  if (envArg == "production") {
    config.environment = envArg;
  }
}

/**
 * Returns true if the environment is production
 */
const isProduction = function () {
  return config.environment == "production";
};

/******************************************************************************
                                Tasks definition
******************************************************************************/

/**
 * Clean up the output folders.
 */
function cleanTask() {
  return del(["dist", "release"]);
}

/**
 * Creates the manifest based on the environment and copy.
 */
function manifestTask() {
  const manifestObj = manifest.generateManifest(config.environment);
  config.version = manifestObj.version;
  config.name = manifestObj.name;
  return file("manifest.json", JSON.stringify(manifestObj), { src: true }).pipe(
    dest("dist")
  );
}

/**
 * Optimize images and copy to the output folder.
 */
function imagesTask() {
  return src("src/images/*.png")
    .pipe(cache(imagemin()))
    .pipe(dest("dist/images"));
}

/**
 * Process all html file and the referencing javascript / styles and copy.
 */
function htmlTask() {
  if (isProduction()) {
    return src("src/views/*.html")
      .pipe(useref())
      .pipe(gulpif("*.js", uglify()))
      .pipe(gulpif("*.css", cssnano()))
      .pipe(dest("dist/views"));
  } else {
    return src("src/views/*.html")
      .pipe(decomment({ tolerant: true, trim: true }))
      .pipe(dest("dist/views"));
  }
}

/**
 * Process javascript and copy.
 */
function jsTask() {
  if (isProduction()) {
    // The html task already manages the embedded javascript files but
    // the content script and background script so we need to copy them
    return src(["src/scripts/content-script.js", "src/scripts/background.js"])
      .pipe(uglify())
      .pipe(dest("dist/scripts"));
  } else {
    return src("src/scripts/**/*.js")
      .pipe(decomment({ tolerant: true, trim: true }))
      .pipe(dest("dist/scripts"));
  }
}

/**
 * Renames the service-worker and copy.
 */
function serviceWorkerTask() {
  if (isProduction()) {
    return src("src/service-worker.prod.js")
      .pipe(uglify())
      .pipe(rename("service-worker.js"))
      .pipe(dest("dist"));
  } else {
    return src("src/service-worker.dev.js")
      .pipe(decomment({ tolerant: true, trim: true }))
      .pipe(rename("service-worker.js"))
      .pipe(dest("dist"));
  }
}

/**
 * Task to handle css files.
 * If development all styles are copied to dist.
 * If production nothing happens because css files are already treated in the
 * html task.
 * @param {callback} done
 */
function cssTask(done) {
  if (!isProduction()) {
    return src("src/styles/*.css")
      .pipe(decomment({ tolerant: true, trim: true }))
      .pipe(dest("dist/styles"));
  } else {
    logger.info("Task skipped: PROD env");
    done();
  }
}

/**
 * Creates the zip file for release.
 */
function releaseTask(done) {
  if (isProduction()) {
    return src("dist/**")
      .pipe(zip(`${config.name}-v.${config.version}.zip`))
      .pipe(dest("release"));
  } else {
    logger.info("Task skipped: DEV env");
    done();
  }
}

/**
 * Watches over the files for changes only for development.
 */
function watchTask(done) {
  if (!isProduction()) {
    watch("src/manifest.js", manifestTask);
    watch("src/images/*.png", imagesTask);
    watch("src/views/*.html", htmlTask);
    watch("src/scripts/**/*.js", jsTask);
    watch("src/service-worker.dev.js", serviceWorkerTask);
    watch("src/styles/*.css", cssTask);
  } else {
    logger.info("Task skipped: PROD env");
    done();
  }
}

/**
 * Main build function that executes all tasks.
 */
const build = function (done) {
  setEnvironment();
  series(
    cleanTask,
    parallel(
      manifestTask,
      imagesTask,
      htmlTask,
      jsTask,
      serviceWorkerTask,
      cssTask
    ),
    releaseTask,
    watchTask
  )();
  done();
};

exports.default = build;
