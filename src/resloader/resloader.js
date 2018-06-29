// resloader.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const ResBundle = require('./resbundle');

class ResLoader {

  constructor() {
    this._path = '';
    this._name = '';
    this._locales = [];
  }

  path(value) {
    this._path = value;
    return this;
  }

  name(value) {
    this._name = value;
    return this;
  }

  locales(values) {
    this._locales = values;
    return this;
  }

  load() {
    return new Promise((resolve, reject) => {
      if (!this._path) {
        reject('Directory path not specified!');
      } else if (!this._name) {
        reject('Name not specified!');
      }

      fs.stat(this._path, (err, st) => {
        if (err) {
          reject(err);
        } else if (!st.isDirectory()) {
          reject('Path specified is not a directory!');
        } else {
          resolve(this._resolveFiles().then((files) => this._loadFiles(files)));
        }
      });
    });
  }

  _resolveFiles() {
    return new Promise((resolve, reject) => {
      if (this._locales.length > 0) {
        resolve(
          this._locales.map((locale) => {
            return {
              file: this._name + '_' + locale + '.properties',
              locale
            };
          })
        );
      } else {
        fs.readdir(this._path, (err, files) => {
          resolve(
            files.filter(
              file => file.startsWith(this._name) && file.endsWith('.properties'))
            .map((file) => {
              let locale = path.basename(file, path.extname(file)).split('_')[1];
              return {
                file,
                locale
              };
            })
          );
        });
      }
    });
  }

  _loadFiles(files) {
    return new Promise((resolve, reject) => {
      let bundles = new Map();
      let oneFailed = false;

      const promised = files.map((entry) => new ResBundle(
        path.join(this._path, entry.file), entry.file, entry.locale).reload());

      Promise.all(promised).then((bundles) => {
        const mapped = new Map();
        for (const bundle of bundles) {
          mapped.set(bundle.name, bundle);
        }
        resolve(mapped);
      }).catch((e) => {
        console.error(`Error loading bundle file!`, e);
        reject(e);
      })
    });
  }

}

module.exports = ResLoader;