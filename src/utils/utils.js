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
      //filename: path.basename(filePath),
      name: name,
      locale: locale
    };
  }

  static getBundleFilePath(dirpath, name, locale) {
    return path.join(dirpath, `${name}_${locale}.properties`);
  }

  static isComment(label) {
    return !label || label.startsWith('#') || label.startsWith(';') || label.startsWith('/');
  }

  static doAsync(fn) {
    setTimeout(fn, 150);
  }

}

module.exports = Utils;