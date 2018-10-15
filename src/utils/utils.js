// utils.js
"use strict";

const fs = require('fs'), 
  path = require('path'),
  assert = require('assert');

class Utils {

  static getBundleName(filePath) {
    assert(!!filePath);
    
    let name, locale;

    const stripped = path.basename(filePath, path.extname(filePath));
    const pos = stripped.indexOf('_');
    if (pos > -1) {
      name = stripped.substring(0, pos);
      locale = stripped.substring(pos + 1);
    }
    //const parts = path.basename(filePath, path.extname(filePath)).split('_', 2);

    return {
      dirname: path.dirname(filePath),
      filename: path.basename(filePath),
      name: name,
      locale: locale
    };
  }

  static getBundleFilePath(dirpath, name, locale) {
    return path.join(dirpath, `${name}_${locale}.properties`);
  }

  static exportBundlesToJson(bundles, bundleName) {
    return new Promise((resolve, reject) => {
      const { dirname, name } = Utils.getBundleName(
        bundles.values().next().value.filepath);

      let exportPath;
      if (bundleName.endsWith('.json')) {
        exportPath = path.join(dirname, `${bundleName}`);
      } else {
        exportPath = path.join(dirname, `${bundleName}.json`);
      }

      const wrapper = {};
      for (const bundle of bundles.values()) {
        bundle.exportTo(wrapper);
      }

      const stream = fs.createWriteStream(exportPath);
      stream.once('open', function (fd) {
        stream.write(JSON.stringify(wrapper, null, 2));
        stream.end();
      });
      stream.once('finish', () => resolve(exportPath));
      stream.once('error', (err) => reject(err));
    });
  }

  static isComment(label) {
    return !label || label.startsWith('#') || label.startsWith(';') || label.startsWith('/');
  }

  static doAsync(fn) {
    setTimeout(fn, 150);
  }

}

module.exports = Utils;