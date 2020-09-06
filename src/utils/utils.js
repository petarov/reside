// utils.js
"use strict";

const fs = require('fs'), 
  path = require('path'),
  assert = require('assert'),
  x4n = require('excel4node');
const Defs = require('../defs');

class Utils {

  static isComment(label) {
    return !label || label.startsWith('#') || label.startsWith(';') || label.startsWith('/');
  }

  static doAsync(fn) {
    setTimeout(fn, 150);
  }

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

  static exportBundlesToXLSX(bundles, bundleName) {
    return new Promise((resolve, reject) => {
      const { dirname, name } = Utils.getBundleName(
        bundles.values().next().value.filepath);

      let exportPath;
      if (bundleName.endsWith('.xlsx')) {
        exportPath = path.join(dirname, `${bundleName}`);
      } else {
        exportPath = path.join(dirname, `${bundleName}.xlsx`);
      }

      const wrapper = {};
      for (const bundle of bundles.values()) {
        bundle.exportTo(wrapper);
      }

      const wb = new x4n.Workbook({
        author: Defs.APP_NAME
      });

      var headerStyle = wb.createStyle({
        font: {
          bold: true,
          size: 14
        }
      });

      const sheets = {};
      let keysCount = 0;
      let mostKeys = '';

      // add all locale sheets
      for (const loc in wrapper) {
        const ws = wb.addWorksheet(`${loc.toUpperCase()}`);
        ws.column(1).setWidth(45);
        ws.column(2).setWidth(200);
        ws.cell(1, 1).string('LABEL').style(headerStyle);
        ws.cell(1, 2).string('TEXT').style(headerStyle);
        sheets[loc] = ws;

        // check which bundle has the most keys
        const count = Object.keys(wrapper[loc]).length;
        if (count > keysCount) {
          keysCount = count;
          mostKeys = loc;
        }
      }

      for (const loc in sheets) {
        // add all possible keys to the sheet
        let row = 2;
        for (const key in wrapper[mostKeys]) {
          sheets[loc].cell(row, 1).string(key);
          row += 1;
        }

        // add translation texts to the sheet
        row = 2;
        const strings = wrapper[loc];
        for (const key in strings) {
          sheets[loc].cell(row, 2).string(strings[key]);
          row += 1;
        }
      }

      wb.write(exportPath, (err, stats) => {
        if (err) {
          reject(err);
        } else {
          resolve(exportPath);
        }
      });
    });
  }

}

module.exports = Utils;