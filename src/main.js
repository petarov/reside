/**
 * main.js
 */
"use strict";

const {
  app,
  Menu,
  BrowserWindow,
  ipcMain
} = require('electron');
const path = require('path');
const Defs = require('./defs');

// *** DEBUG ***
const DEBUG_ENABLED = process.argv.indexOf('withdebug') > -1,
  SPLASH_ENABLED = !(process.argv.indexOf('nosplash') > -1);

if (DEBUG_ENABLED) {
  require('electron-reload')(__dirname);
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createSplashWindow() {
  let splashWindow = new BrowserWindow({
    width: Defs.SPLASH_WINDOW_WIDTH,
    height: Defs.SPLASH_WINDOW_HEIGHT,
    frame: false,
    show: false
  });

  splashWindow.loadURL(`file://${__dirname}/splash.html`);

  splashWindow.once('show', () => {
    setTimeout(() => {
      splashWindow.close();
    }, Defs.SPLASH_TIMEOUT);
  });

  splashWindow.once('closed', () => {
    splashWindow = null;
    createAppWindow();
  });

  splashWindow.once('ready-to-show', () => {
    splashWindow.show()
  })
}

function createAppWindow() {
  mainWindow = new BrowserWindow({
    width: Defs.APP_WINDOW_WIDTH,
    height: Defs.APP_WINDOW_HEIGHT,
    icon: path.join(__dirname, 'assets/icons/png/cat-vampire-icon-64x64.png')
  });

  mainWindow.loadURL(`file://${__dirname}/index.html`);

  if (DEBUG_ENABLED) {
    mainWindow.webContents.openDevTools()
  }

  // Emitted when the window is closed.
  mainWindow.once('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  })

  createMenu();
}

function createMenu() {
  const mainMenu = require('./menu.js');
  Menu.setApplicationMenu(mainMenu.createMainMenu());
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.once('ready', SPLASH_ENABLED ? createSplashWindow : createAppWindow);

// Quit when all windows are closed.
app.once('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.once('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createAppWindow();
  }
});

ipcMain.once('_quit', (event, arg) => {
  console.log('quit signal received');
  app.quit();
})
