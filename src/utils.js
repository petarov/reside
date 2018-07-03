// utils.js

const fs = require('fs'), 
  path = require('path'),
  assert = require('assert');

class Utils {

  static getBundleName(filePath) {
    assert(!!filePath);
    return {
      dirname: path.dirname(filePath),
      //filename: path.basename(filePath),
      name: path.basename(filePath, path.extname(filePath)).split('_')[0],
    };
  }

}

module.exports = Utils;