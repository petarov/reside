// resbundle.js
"use strict";

const fs = require('fs'),
  path = require('path'),
  readline = require('readline'),
  assert = require('assert');

const NewlineMode = {
  LF: '\\n',
  CRLF: '\\r\\n',
  BR: '<br>'
};

class ResBundle {

  constructor(filepath, name, locale) {
    this._filepath = filepath;
    this._name = name;
    this._locale = locale;
    this._strings = {};
  }

  save(name, nlm) {
    // TODO
    //name = name || this._name;
    const savePath = this._filepath.replace('.properties', '_01.properties.txt');
    console.debug(`Saving ${savePath} ...`);

    const stream = fs.createWriteStream(savePath);
    stream.once('open', function (fd) {
      for (const k in this._strings) {
        const line = this._strings[k].replace(/\n/g, nlm);
        stream.write(`${k}=${line}\n`);
      }
      stream.end();
    }.bind(this));
  }

  reload(strings) {
    strings = strings || {};
    return new Promise((resolve, reject) => {
      console.debug(`Loading ${this._filepath} ...`);

      const lineReader = readline.createInterface({
        input: fs.createReadStream(this._filepath)
      });

      // true, if at least one ucs2/ucs2 encoded as ascii character is found
      let ucs2 = false;
  
      lineReader.on('line', (line) => {
        //console.log('Line: ', line);
        
        // Comments starting with # // ;
        if (line.startsWith('#') || line.startsWith('/') || line.startsWith(';')) {
          console.debug(`Skipped comment line= ${line}`);
          return;
        }

        const parts = line.split('=', 2);
        const left = parts[0].trim();
        let right = parts[1].trim();

        try {
          if (ucs2 || right.indexOf('\\u') > -1) {
            ucs2 = true;
            this.strings[left] = JSON.parse(`"${right.replace(/\"/g, '\\"')}"`);
          } else {
            this.strings[left] = right;
          }
        } catch (e) {
          console.error(`Failed parsing line= ${line}`);
          // TODO: log error for given line
          this.strings[left] = right;
        }

        strings[left] = null;
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

  set(key, value) {
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

module.exports = {
  ResBundle,
  NewlineMode
}
