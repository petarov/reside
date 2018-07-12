// utils.js
"use strict";

const fs = require('fs'), 
  path = require('path'),
  assert = require('assert');

class Utils {

  static getBundleName(filePath) {
    assert(!!filePath);
    const parts = path.basename(filePath, path.extname(filePath)).split('_', 2);
    return {
      dirname: path.dirname(filePath),
      //filename: path.basename(filePath),
      name: parts[0],
      locale: parts[1]
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