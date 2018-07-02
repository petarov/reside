// utils.js

const fs = require('fs'), 
  path = require('path'),
  assert = require('assert');

const $$ = Dom7;

class Utils {

  static getBundleName(filePath) {
    assert(!!filePath);
    return {
      dirname: path.dirname(filePath),
      //filename: path.basename(filePath),
      name: path.basename(filePath, path.extname(filePath)).split('_')[0],
    };
  }

  static cssVisible(id, visible) {
    $$(id).css('visibility', visible ? 'visible' : 'hidden');
  }

}

module.exports = Utils;