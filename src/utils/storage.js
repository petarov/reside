// storage.js
"use strict";

const path = require('path'),
  fs = require('fs');

const DEFAULTS = {
  files: {
    recent: []
  },
  search: {
    content: 'labels',
    caseSensitive: 'yes',
  },
  filter: {
    labels: 'all',
  },
  settings: {
    saveEncoding: 'utf8',
    saveNewlines: 'lf'
  },
  mainWindow: {
    bounds: {}
  }
};

function loadStorage(filePath, defaults) {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch(e) {
    console.debug(`Error parsing storage ${filePath} !`, e);
    return defaults;
  }
}

class Storage {

  constructor(app, filename, defaults = DEFAULTS) {
    //const app = electron.remote.app || electron.app;
    const userDataPath = process.env['HOME'] || process.env['USERPROFILE'] || app.getPath('userData');
    this.path = path.join(userDataPath, filename);
    if (console) {
      console.log(`Using storage file ${this.path}`);
    }
    this.data = loadStorage(this.path, defaults);
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

  _section(section, key, val) {
    if (val !== undefined) {
      const obj = this.get(section) || {};
      obj[key] = val;
      return this.set(section, obj);
    } else {
      const obj = this.get(section);
      return obj && obj[key] ? obj[key] : DEFAULTS[section][key];
    }
  }

  files(key, val) {
    return this._section('files', key, val);
  }

  search(key, val) {
    return this._section('search', key, val);
  }

  filter(key, val) {
    return this._section('filter', key, val);
  }

  settings(key, val) {
    return this._section('settings', key, val);
  }

  mainWindow(key, val) {
    return this._section('mainWindow', key, val);
  }

}

module.exports = Storage;