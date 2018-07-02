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

  reload(strings) {
    strings = strings || {};
    return new Promise((resolve, reject) => {
      console.log(`Loading ${this._filepath} ...`);

      const lineReader = readline.createInterface({
        input: fs.createReadStream(this._filepath)
      });
  
      lineReader.on('line', (line) => {
        //console.log('Line: ', line);
        const parts = line.split('=', 2);
        // this.strings[parts[0].trim()] = decodeURIComponent(parts[1].trim());
        // TODO: find a proper way to do this
        try {
          this.strings[parts[0].trim()] = decodeURIComponent(JSON.parse('"' + parts[1].replace(/\"/g, '\\"') + '"'));
        } catch (e) {
          this.strings[parts[0].trim()] = parts[1];
        }

        strings[parts[0].trim()] = null;
      });

      lineReader.on('close', () => {
        resolve(this);
      });
    });
  }

  get name() {
    return this._name;
  }

  get locale() {
    return this._locale;
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
