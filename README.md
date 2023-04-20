# electron reload
This is (*hopefully*) the simplest way to load contents of all active [`BrowserWindow`s](https://github.com/electron/electron/blob/main/docs/api/browser-window.md) within electron when the source files are changed.

[![Linting](https://github.com/Milly/electron-reload/actions/workflows/node.js.yml/badge.svg)](https://github.com/Milly/electron-reload/actions/workflows/node.js.yml)
[![npm](https://img.shields.io/npm/v/@millyc/electron-reload.svg)](https://www.npmjs.com/package/@millyc/electron-reload)
[![Known Vulnerabilities](https://snyk.io/test/github/Milly/electron-reload/badge.svg)](https://snyk.io/test/github/Milly/electron-reload)
![license](https://img.shields.io/npm/l/@millyc/electron-reload.svg)

# Installation
```
npm install electron-reload
```

# Usage
Just initialize this module with desired glob or file path to watch and let it refresh electron browser windows as targets are changed:

```js
'use strict';

const {app, BrowserWindow} = require('electron');

const electronReload = require('@millyc/electron-reload');

// Standard stuff
app.on('ready', () => {
  let mainWindow = new BrowserWindow({width: 800, height: 600});

  mainWindow.loadUrl(`file://${__dirname}/index.html`);
  // the rest...
});
```

Note that the above code only refreshes `WebContent`s of all `BrowserWindow`s. So if you want to have a hard reset (starting a new electron process) you can just pass the path to the electron executable in the `options` object:

```js
const path = require('path');

require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
});
```

If your app overrides some of the default `quit` or `close` actions (e.g. closing the last app window hides the window instead of quitting the app) then the default `electron-reload` hard restart could leave you with multiple instances of your app running. In these cases you can change the default hard restart action from `app.quit()` to `app.exit()` by specifying the hard reset method in the electron-reload options:

```js
const path = require('path');

require('@millyc/electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
  hardResetMethod: 'exit',
});
```

# API
`electronReload(paths, options)`
* `paths`: a file, directory or glob pattern to watch
* `options` (optional) containing:
  - [`chokidar`](https://github.com/paulmillr/chokidar) options
  - `electron` property pointing to electron executables.
  - `electronArgv` string array with command line options passed to the Electron executable. Only used when hard resetting.
  - `appArgv`: string array with command line options passed to the Electron app. Only used when hard resetting.
  - `forceHardReset`: enables hard reset for **every** file change and not only the main file

  `options` will default to `{ignored: /node_modules|[\/\\]\./, argv: []}`.


# Why this module?
Simply put, I was tired and confused by all other available modules which are so complicated\* for such an uncomplicated task!

\* *e.g. start a local HTTP server, publish change events through a WebSocket, etc.!*

# Changelog
 - **3.0.0**:
   - Initial release of `@millyc/electron-reload` package.
   - Forked from [electron-reload v2.0.0-alpha.1](https://github.com/yan-foto/electron-reload/tree/v2.0.0-alpha.1).
   - Update dependencies.
   - Fix yan-foto/electron-reload#110: Changed `electronArgv` and `appArgv` types to array.
   - Fix yan-foto/electron-reload#114: Allow readonly string array in `glob`.
   - Fix #4: Add JSDoc to `electronReload()`.
