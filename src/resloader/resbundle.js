// resbundle.js

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
  
      lineReader.on('line', (line) => {
        //console.log('Line: ', line);
        const parts = line.split('=', 2);
        // this.strings[parts[0].trim()] = decodeURIComponent(parts[1].trim());
        // TODO: find a proper way to do this
        try {
          this.strings[parts[0].trim()] = decodeURIComponent(JSON.parse('"' + parts[1].trim().replace(/\"/g, '\\"') + '"'));
        } catch (e) {
          this.strings[parts[0].trim()] = parts[1].trim();
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
