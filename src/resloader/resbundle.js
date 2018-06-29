// resbundle.js

const fs = require('fs');
const readline = require('readline');

class ResBundle {

  constructor(filepath, name, locale) {
    this._filepath = filepath;
    this._name = name;
    this._locale = locale;
    this._strings = {};
  }

  save(newName) {
    // TODO
  }

  reload() {
    // TODO

    readline.createInterface({
      input: fs.createReadStream('file.in')
    });

    lineReader.on('line', (line) => {
      console.log('Line from file:', line);
    });
  }

  get strings() {
    return this._strings;
  }

  get size() {
    return Object.keys(this._strings).length;
  }

  put(key, value) {
    assert(key !== null);
    assert(value !== null);
    this._strings[key] = value;
  }

  get(key) {
    assert(key !== null);
    return this._strings[key];
  }

  remove(key) {
    assert(key !== null);
    delete this._strings[key];
  }

}

module.exports = ResBundle;
