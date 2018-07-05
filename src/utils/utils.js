// utils.js
"use strict";

const fs = require('fs'), 
  path = require('path'),
  assert = require('assert');
const sanitize = require("sanitize-filename");

class Utils {

  static getBundleName(filePath) {
    assert(!!filePath);
    return {
      dirname: path.dirname(filePath),
      //filename: path.basename(filePath),
      name: path.basename(filePath, path.extname(filePath)).split('_')[0],
    };
  }

  static isComment(label) {
    return label.startsWith('#') || label.startsWith(';') || label.startsWith('/');
  }

  static copyBundleAs(newName, bundle) {
    assert(newName);

    let savePath;

    if (!newName.endsWith('.properties')) {
      newName = newName + `_${bundle.locale}.properties`;
    } else {
      newName = newName.replace('.properties', `_${bundle.locale}.properties`)
    }
    savePath = path.join(path.dirname(this._filepath), newName);

    console.debug(`Saving bundle to ${savePath} ...`);
  }

}

module.exports = Utils;