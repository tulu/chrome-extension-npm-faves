# Changelog

Changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [v?.?.?] - Unreleased

### Added
- Popup toolbar button new interactions depending on the active tab
- Collection management in pop up
- Warning before removing fave

### Bugs
- Fixed footer overlap with the faves list in the options page
- Fixed package load in view when unpacked size or file count is null
- Fixed bug introduced in chrome 91: “Tabs cannot be edited right now (user may be dragging a tab)” when detecting active tab change

## [v1.0.1] - 2021-06-06

### Removed
- Removed the `activeTab` permission from the manifest as it wasn't needed. The extension was rejected from the Chrome Web Store because of this. ([*read more*](https://developer.chrome.com/docs/webstore/program_policies/#permissions))

## [v1.0.0] - 2021-06-04

### Added
- Add / Remove packages to faves directly from [https://www.npmjs.com](https://www.npmjs.com)
- Search packages in the pop up (opens new tab with [https://www.npmjs.com](https://www.npmjs.com))
- View faved packages list in the pop up
- View package information in the pop up
- Sync package information with [https://registry.npmjs.org](https://registry.npmjs.org)
- Remove package from faves from the package information view in the pop up
- Copy to clipboard install snippet from the package information view in the pop up
- View all faved packages with more detailed information (like when it was added to faves) in the options page
- Tracking of page views and events with Google Analytics

[v1.0.0]: https://github.com/tulu/chrome-extension-npm-faves/releases/tag/v1.0.0
[v1.0.1]: https://github.com/tulu/chrome-extension-npm-faves/releases/tag/v1.0.1