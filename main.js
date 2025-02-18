const { app } = require('electron')
const chokidar = require('chokidar')
const fs = require('fs')
const { spawn } = require('child_process')

const ignoredPaths = /node_modules|[/\\]\./

/**
 * Creates a callback for hard resets.
 *
 * @param {string} eXecutable path to electron executable
 * @param {string} hardResetMethod method to restart electron
 * @param {string[]} eArgv arguments passed to electron
 * @param {string[]} aArgv arguments passed to the application
 * @returns {function} handler to pass to chokidar
 */
const createHardresetHandler = (eXecutable, hardResetMethod, eArgv, aArgv) => {
  const appPath = app.getAppPath()
  return () => {
    // Detaching child is useful when in Windows to let child
    // live after the parent is killed
    const args = (eArgv || [])
      .concat([appPath])
      .concat(aArgv || [])
    const child = spawn(eXecutable, args, {
      detached: true,
      stdio: 'inherit'
    })
    child.unref()
    // Kamikaze!

    // In cases where an app overrides the default closing or quiting actions
    // firing an `app.quit()` may not actually quit the app. In these cases
    // you can use `app.exit()` to gracefully close the app.
    if (hardResetMethod === 'exit') {
      app.exit()
    } else {
      app.quit()
    }
  }
}

/**
 * @typedef {import('./types/main').ElectronReloadOptions} ElectronReloadOptions
 */

/**
 * Refreshes the Electron browser window when the watched glob or file path changes.
 *
 * @param {string | readonly string[]} glob a file, directory or glob pattern to watch
 * @param {ElectronReloadOptions} options options for electron-reload or chokidar.watch
 * @returns void
 */
function electronReload (glob, options = {}) {
  // Main file poses a special case, as its changes are
  // only effective when the process is restarted (hard reset)
  // We assume that electron-reload is required by the main
  // file of the electron application
  // NOTE: `module.parent` is deprecated, but for backward compatibility
  // NOTE: `process.mainModule` is deprecated, but for webpack compatibility
  const mainFile = (require.main || module.parent).filename || (process.mainModule || {}).filename

  const browserWindows = []
  const softResetDefaultIgnored = [ignoredPaths]
  if (mainFile) softResetDefaultIgnored.push(mainFile)
  const watcher = chokidar.watch(glob, Object.assign({ ignored: softResetDefaultIgnored }, options))

  // Callback function to be executed:
  // I) soft reset: reload browser windows
  const softResetHandler = () => browserWindows.forEach(bw => bw.webContents.reloadIgnoringCache())
  // II) hard reset: restart the whole electron process
  const eXecutable = options.electron
  const hardResetHandler = createHardresetHandler(
    eXecutable,
    options.hardResetMethod,
    options.electronArgv,
    options.appArgv)

  // Add each created BrowserWindow to list of maintained items
  app.on('browser-window-created', (e, bw) => {
    browserWindows.push(bw)

    // Remove closed windows from list of maintained items
    bw.on('closed', function () {
      const i = browserWindows.indexOf(bw) // Must use current index
      browserWindows.splice(i, 1)
    })
  })

  // Enable default soft reset
  watcher.on('change', softResetHandler)

  // Preparing hard reset if electron executable is given in options
  // A hard reset is only done when the main file has changed
  if (eXecutable) {
    if (!fs.existsSync(eXecutable)) {
      throw new Error('Provided electron executable cannot be found or is not exeecutable!')
    }
    if (!mainFile) {
      throw new Error('Cannot detect main module filename!')
    }

    const hardWatcher = chokidar.watch(mainFile, Object.assign({ ignored: [ignoredPaths] }, options))

    if (options.forceHardReset === true) {
      // Watch every file for hard reset and not only the main file
      hardWatcher.add(glob)
      // Stop our default soft reset
      watcher.close()
    }

    hardWatcher.once('change', hardResetHandler)
  }
}

module.exports = electronReload
