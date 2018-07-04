// resbundle.js
"use strict";

const fs = require('fs'),
  path = require('path'),
  readline = require('readline'),
  assert = require('assert');
const jsesc = require('jsesc');

const NewlineMode = {
  LF: { ascii: '\n', utf8: '\\n' },
  CRLF: { ascii: '\r\n', utf8: '\\r\\n' },
  BR: { ascii: '<br>', utf8: '<br>' }
};

class ResBundle {

  constructor(filepath, name, locale) {
    this._filepath = filepath;
    this._name = name;
    this._locale = locale;
    this._strings = {};
  }

  save(opts = { name: '', newlineMode: NewlineMode.LF, encoding: 'utf8' }) {
    let savePath;
    if (opts.name) {
      if (!opts.name.endsWith('.properties')) {
        savePath = opts.name + `_${this._locale}.properties`;
      }
    } else {
      savePath = this._filepath;
    }
    console.debug(`Saving to ${savePath} ...`);

    let utf8 = false;
    if ('utf8' === opts.encoding) {
      utf8 = true;
    } else {
      opts.encoding ='latin1';
    }

    const stream = fs.createWriteStream(savePath, { encoding: opts.encoding });
    stream.once('open', function (fd) {
      for (const k in this._strings) {
        let line;
        if (utf8) {
          line = this._strings[k].replace(/\n/g, opts.newlineMode.utf8);
        } else {
          line = this._strings[k].replace(/\n/g, opts.newlineMode.ascii);
          line = jsesc(line, { 'json': true, 'wrap': false });
        }
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
            right = JSON.parse(`"${right.replace(/\"/g, '\\"')}"`);
          }

          // convert all known new line markers
          right = right.replace(/(\\n)|(<br>)|(\\r\\n)/g, '\n');

          this.strings[left] = right;
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
