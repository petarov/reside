// renderer.js
// This file is required by the index.html file and will
// be executed in the renderer process for that window.

const { ipcRenderer } = require('electron');
const ResideApp = require('./app');

const app = new ResideApp();
app.init();

let boundsTimer;

ipcRenderer.on('_resize', (event, arg) => {
  if (arg && !boundsTimer) {
    boundsTimer = setTimeout(() => {
      app.updateBounds(arg);
      boundsTimer = null;
    }, 2000);
  }
});