// storage.js
"use strict";

const electron = require('electron'),
  path = require('path'),
  fs = require('fs');

const DEFAULTS = {
  files: {
    recent: []
  },
  search: {
    caseSensitive: true,
  },
  settings: {
    saveEncoding: 'utf8',
    saveNewlines: 'lf'
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

  constructor(filename, defaults = DEFAULTS) {
    const app = electron.remote.app || electron.app;
    const userDataPath = process.env['HOME'] || process.env['USERPROFILE'] || app.getPath('userData');
    this.path = path.join(userDataPath, filename);
    console.debug(`Using storage file ${this.path}`);
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
    const obj = this.get(section);
    if (val !== undefined) {
      obj[key] = val;
      return this.set(section, obj);
    }
    return obj[key];
  }

  files(key, val) {
    return this._section('files', key, val);
  }

  search(key, val) {
    return this._section('search', key, val);
  }

  settings(key, val) {
    return this._section('settings', key, val);
  }

}

module.exports = Storage;