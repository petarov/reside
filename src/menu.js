/**
 * menu.js
 * Create all app menus.
 */
const {
  Menu,
  shell,
  BrowserWindow
} = require('electron');
const os = require('os');
const Defs = require('./defs');

function send(what) {
  const window = BrowserWindow.getAllWindows()[0];
  if (process.platform === 'darwin') {
    window.restore();
  }
  window.webContents.send(what);
}

function createMainMenu(app, opts) {
  const template = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.reload()
          }
        },
        { role: 'forcereload' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      role: 'help',
      submenu: [
        {
          label: '&GitHub',
          click() { shell.openExternal('https://github.com/petarov/reside') }
        },
        {
          label: '&Report Issue',
          click() { 
            const body = `
<!-- Please describe the issue you have and the steps required to reproduce it. -->
<!-- The following information is required, please do not remove it. -->

> ${app.getName()} ${app.getVersion()}
> Electron ${process.versions.electron}
> ${process.platform} ${process.arch} ${os.release()}`;
            shell.openExternal(`https://github.com/petarov/reside/issues/new?body=${encodeURIComponent(body)}`);
          }
        },
        { type: 'separator' },
        {
          label: `View &License`,
          click() {
            shell.openExternal('https://github.com/petarov/reside/blob/master/LICENSE');
          }
        },
        { type: 'separator' },
        {
          label: `Visit midpoints GmbH`,
          click() {
            shell.openExternal('https://midpoints.de');
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click(item, focusedWindow) {
            if (focusedWindow) focusedWindow.webContents.toggleDevTools()
          }
        },
      ]
    }
  ];

  if (!opts.DEBUG_ENABLED) {
    template[1].submenu[0].accelerator = undefined;
    template[1].submenu.splice(1, 1);
  }

  if (process.platform === 'darwin') {
    template.unshift({
      label: Defs.APP_NAME,
      submenu: [
        {
          label: `Settings`,
          click() { send('_settings'); }
        },
        {
          label: `About ${Defs.APP_NAME}`,
          click() { send('_about'); }
        },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        {
          label: `Quit`,
          click() { send('_askquit'); }
        },
      ]
    });

    // Edit menu
    template[1].submenu.push(
      { type: 'separator' },
      {
        label: 'Speech',
        submenu: [
          { role: 'startspeaking' },
          { role: 'stopspeaking' }
        ]
      }
    );

    // Window menu
    template[3].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  } else {
    /* Windows, Linux */
    template.unshift({
      label: 'File',
      submenu: [
        {
          label: `Settings`,
          click() { send('_settings'); }
        },
        {
          label: `About ${app.getName()}`,
          click() { send('_about'); }
        },
        { type: 'separator' },
        {
          label: `Quit`,
          click() { send('_askquit'); }
        }
      ]
    });
  }

  return Menu.buildFromTemplate(template);
}

module.exports = {
  createMainMenu
};