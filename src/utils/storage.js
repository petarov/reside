// storage.js
"use strict";

const electron = require('electron'),
  path = require('path'),
  fs = require('fs');

function loadStorage(filePath, defaults) {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch(error) {
    console.error(`Error parsing storage ${filePath} !`, e);
    return defaults;
  }
}

class Storage {

  constructor(opts) {
    const userDataPath = (electron.app || electron.remote.app).getPath('userData');
    console.debug('Writing storage to ' + userDataPath);
    this.path = path.join(userDataPath, opts.configName + '.json');
    this.data = loadStorage(this.path, opts.defaults);
  }

  get(key) {
    return this.data[key];
  }

  set(key, val) {
    try {
      this.data[key] = val;
      fs.writeFileSync(this.path, JSON.stringify(this.data));
      return true;
    } catch (e) {
      console.error(`Error writing storage to ${this.path} !`, e);
    }
    return false;
  }

}

module.exports = Storage;