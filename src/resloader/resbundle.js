// resbundle.js
"use strict";

const fs = require('fs'),
  path = require('path'),
  readline = require('readline'),
  assert = require('assert');
const jsesc = require('jsesc'),
  sanitize = require("sanitize-filename");
const { Utils } = require('../utils');

const NewlineMode = {
  LF: { ascii: '\n', utf8: '\\n' },
  CRLF: { ascii: '\r\n', utf8: '\\r\\n' },
  BR: { ascii: '<br>', utf8: '<br>' }
};

const MAX_DUPLICATES = 100;
const DUPLICATE_SUFFIX = '_DUP';

class ResBundle {

  constructor(filepath, filename, locale) {
    this._filepath = filepath;
    this._filename = filename;
    this._locale = locale;
    this._strings = {};
  }

  exportTo(wrapper) {
    console.info(`Exporting contents of bundle ${this._filepath} ...`);
    const table = {};
    for (const k in this._strings) {
      table[k] = this._strings[k];
    }
    wrapper[this._locale] = table;
  }

  save(opts = { newlineMode: NewlineMode.LF, encoding: 'utf8' }) {
    console.info(`Saving bundle to ${this._filepath} ...`);

    let utf8 = false;
    if ('utf8' === opts.encoding) {
      utf8 = true;
    } else {
      opts.encoding ='latin1';
    }

    const stream = fs.createWriteStream(this._filepath, { encoding: opts.encoding });
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

  rename(newName, newPath) {
    assert(!!newName);

    newName = sanitize(newName);

    let filename;
    if (!newName.endsWith('.properties')) {
      filename = newName + `_${this._locale}.properties`;
    } else {
      filename = newName.replace('.properties', `_${this._locale}.properties`)
    }

    let saveFilePath;

    if (newPath) {
      saveFilePath = path.join(newPath, filename);
    } else {
      saveFilePath = path.join(path.dirname(this._filepath), filename);
    }

    this._filename = filename;
    this._filepath = saveFilePath;

    return { newName, saveFilePath };
  }

  _addItem(key, value, index, duplicates) {
    if (!(key in this.strings)) {
      this.strings[key] = value;
      if (index) {
        index[key] = null;
      }
    } else {
      let counter = 1;
      let idx;
      while (counter < MAX_DUPLICATES) {
        idx = `${key}${DUPLICATE_SUFFIX}${counter}`;
        if (!(idx in this.strings)) {
          this.strings[idx] = value;
          if (index) {
            index[idx] = null;
          }
          if (duplicates) {
            duplicates[key] = null;
            duplicates[idx] = null;
            // if (!(key in duplicates)) {
            //   duplicates[key] = [];
            // }
            // duplicates[key].push(idx);
          }
          console.warn(`Found duplicate for ${key}. Added as ${idx}`);
          break;
        }
        counter++;
      }
    }
  }


  reload(index, duplicates) {
    return new Promise((resolve, reject) => {
      console.info(`Loading ${this._filepath} ...`);

      const lineReader = readline.createInterface({
        input: fs.createReadStream(this._filepath)
      });

      // true, if at least one ucs2/ucs2 encoded as ascii character is found
      let ucs2 = false;

      lineReader.on('line', (line) => {
        //console.log('Line: ', line);

        // Comments starting with # // ;
        if (Utils.isComment(line)) {
          console.log(`Skipped comment line= ${line}`);
          return;
        }

        const parts = Utils.split2(line, '=');
        const left = parts[0].trim();
        let right = parts[1].trim();

        try {
          if (ucs2 || right.indexOf('\\u') > -1) {
            // spare us further scanning when at least ony ucs2 char is found
            ucs2 = true;
            /**
             * Holy mother of ugly dragons! WTH is this?
             * Strings with ascii ucs2 char representation and non-escaped punctuation, e.g.,
             * 'Gr\\u00fc\\u00dfe "user1" House\\Test\\Boiler!', deserve special treatment.
             *
             * I could find no other way than JSON.parse() to convert double-slash (\\u00fc) 
             * chars to unicode! Nothing. However, even though it does in fact convert unicode
             * it fails to handle double slashes and quotes so regex pre-processing is required.
             *
             * You got a better idea? Open a PR, please.
             */
            right = right.replace(/\\/g, '\\\\').replace(/\\\\u/g, '\\u').replace(/\"/g, '\\"');
            right = JSON.parse(`"${right}"`);
          }

          // convert all known new line markers
          right = right.replace(/(\\n)|(<br>)|(\\r\\n)/g, '\n');

          this._addItem(left, right, index, duplicates);
        } catch (err) {
          console.warn(`Failed parsing line= ${line}`, err.message);
          this._addItem(left, right, index, duplicates);
        }
      });

      lineReader.on('close', () => {
        resolve(this);
      });
    });
  }

  get filepath() {
    return this._filepath;
  }

  get filename() {
    return this._filename;
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
