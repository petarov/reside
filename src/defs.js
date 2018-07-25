// defs.js
"use strict";

module.exports = {

  APP_NAME: 'ResIDE',

  SPLASH_WINDOW_WIDTH: 624,
  SPLASH_WINDOW_HEIGHT: 324,
  SPLASH_TIMEOUT: 3500,

  APP_WINDOW_WIDTH: 1440,
  APP_WINDOW_HEIGHT: 900,

  CONFIG_NAME: '.reside-store.json',
  
  SEARCH_TIMEOUT: 1100, // ms

  SUPPORTED_EXTENSIONS: [
    { name: 'Properties', extensions: ['properties'] },
    { name: 'All files', extensions: ['*'] }
  ],

  TOAST_SHORT: 1000,
  TOAST_NORMAL: 2000,
  TOAST_LONG: 3000,

};
