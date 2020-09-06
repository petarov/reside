// resloader tests

const { ResLoader } = require('../src/resloader');
const { Utils } = require('../src/utils');

const path = require('path');
const fs = require('fs');
const assert = require('assert');
const chai = require('chai'),
  expect = require('chai').expect,
  chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const x4n = require('excel4node');

describe('resloader', () => {

  describe('#_resolveFiles()', () => {
    it('should resolve TestBundle files by given locales', () => {
      return new ResLoader()
        .path(`${__dirname}/data`)
        .name('TestBundle')
        .locales(['de', 'en'])
        ._resolveFiles().then((files) => {
          assert.equal(files.length, 2);
          assert.equal(files[0].file, 'TestBundle_de.properties');
          assert.equal(files[0].locale, 'de');
          assert.equal(files[1].file, 'TestBundle_en.properties');
          assert.equal(files[1].locale, 'en');
        });
    });

    it('should find all TestBundle files by path', () => {
      return new ResLoader()
        .path(`${__dirname}/data`)
        .name('TestBundle')
        ._resolveFiles().then((files) => {
          assert.equal(files.length, 2);
          assert.equal(files[0].file, 'TestBundle_de.properties');
          assert.equal(files[0].locale, 'de');
          assert.equal(files[1].file, 'TestBundle_en.properties');
          assert.equal(files[1].locale, 'en');
        });
    });

    it('should find only EN TestBundle file', () => {
      return new ResLoader()
        .path(`${__dirname}/data`)
        .name('TestBundle')
        .locales(['en'])
        ._resolveFiles().then((fileNames) => {
          assert.equal(fileNames.length, 1);
          assert.equal(fileNames[0].file, 'TestBundle_en.properties');
          assert.equal(fileNames[0].locale, 'en');
        });
    });
  });

  describe('#load()', () => {
    it('should reject non-existing path', () => {
      expect(new ResLoader()
        .path(`${__dirname}/FOLDER_INVALID`)
        .name('TestBundle')
        .load()).to.be.rejected;
    });

    it('should load TestBundle files', () => {
      return new ResLoader()
        .path(`${__dirname}/data`)
        .name('TestBundle')
        .load().then((result) => {
          const {index, bundles} = result;
          assert.notEqual(index, null);
          assert.notEqual(index, {});
          assert.equal(bundles.size, 2);
          assert.equal(bundles.get('TestBundle_de.properties').locale, 'de');
          assert.equal(bundles.get('TestBundle_de.properties').size, 20);
          assert.equal(bundles.get('TestBundle_en.properties').locale, 'en');
          assert.equal(bundles.get('TestBundle_en.properties').size, 19);
          // test DE locale texts
          const nameDE = 'TestBundle_de.properties';
          assert.equal(bundles.get(nameDE).get('ButtonConfirm'), 'Bestätigen');
          assert.equal(bundles.get(nameDE).get('Reset'), 'Zurücksetzen');
          assert.equal(bundles.get(nameDE).get('SelectedObject'), 'Gewähltes Objekt');
        });
    });

    it('should load unescaped texts - EscapeBundle', () => {
      return new ResLoader()
        .path(`${__dirname}/data`)
        .name('EscapeBundle')
        .load().then((result) => {
          const name = 'EscapeBundle_de.properties';
          const {index, bundles} = result;
          assert.notEqual(index, null);
          assert.notEqual(index, {});
          assert.equal(bundles.size, 1);
          assert.equal(bundles.get(name).get('Message_Greeting'), 'Grüße "user1"!');
          assert.equal(bundles.get(name).get('Message_Categories'), 'Category Buildings\\House\\Tiny');
          assert.equal(bundles.get(name).get('Message_Categories2'), 'Reisen\\Hotels');
        });
    });

    it('should load duplicate translations - TestDuplicates', () => {
      return new ResLoader()
        .path(`${__dirname}/data`)
        .name('TestDuplicates')
        .load().then((result) => {
          const { index, bundles, duplicates } = result;
          assert.notEqual(index, null);
          assert.notEqual(index, {});
          assert.notEqual(duplicates, null);
          assert.notEqual(duplicates, {});
          assert.equal(bundles.size, 2);
          assert.ok('ButtonClear_DUP1' in duplicates);
          assert.ok('DialogName_DUP1' in duplicates);
          assert.ok('DialogName_DUP2' in duplicates);
        });
    });
  });

  describe('#rename()', () => {
    it('should rename loaded TestBundle files', () => {
      return new ResLoader()
        .path(`${__dirname}/data`)
        .name('TestBundle')
        .load().then((result) => {
          const {index, bundles} = result;
          const bundleEN = bundles.get('TestBundle_en.properties');

          let { newName, saveFilePath } = bundleEN.rename('ZeroKeysGiven');
          assert.equal(newName, 'ZeroKeysGiven');
          assert.equal(bundleEN.filename, 'ZeroKeysGiven_en.properties');
          assert.equal(saveFilePath, `${__dirname}/data/ZeroKeysGiven_en.properties`);
          assert.equal(bundleEN.filepath, `${__dirname}/data/ZeroKeysGiven_en.properties`);

          const bundleDE = bundles.get('TestBundle_de.properties');
          const renres = bundleDE.rename('?*\\ZeroKeys\tGiven256()(!');
          assert.equal(renres.newName, 'ZeroKeysGiven256()(!');
          assert.equal(bundleDE.filename, 'ZeroKeysGiven256()(!_de.properties');
          assert.equal(renres.saveFilePath, `${__dirname}/data/ZeroKeysGiven256()(!_de.properties`);
          assert.equal(bundleDE.filepath, `${__dirname}/data/ZeroKeysGiven256()(!_de.properties`);
        });
    });
  });

  describe('#export()', () => {
    it('should export TestBundle files to JSON', () => {
      return new ResLoader()
        .path(`${__dirname}/data`)
        .name('TestBundle')
        .load().then((result) => {
          const { index, bundles } = result;
          return Utils.exportBundlesToJson(bundles, '_test_export').then(filePath => {
            expect(path.basename(filePath)).to.be.equal('_test_export.json');
            const json = require(filePath);
            expect('en' in json).to.be.ok;
            expect('de' in json).to.be.ok;
            expect(json.de.INTERNAL_ERROR).to.equal('Interner Fehler');
            expect(json.en.OUT_OF_SYNC).to.equal('Out of sync');
          });
        });
    });

    it('should export TestBundle files to XLSX', () => {
      return new ResLoader()
        .path(`${__dirname}/data`)
        .name('TestBundle')
        .load().then((result) => {
          const { index, bundles } = result;
          return Utils.exportBundlesToXLSX(bundles, '_test_export').then(filePath => {
            expect(path.basename(filePath)).to.be.equal('_test_export.xlsx');
            const stats = fs.statSync(filePath);
            const fileSizeInBytes = stats["size"];
            expect(fileSizeInBytes).to.greaterThan(0);
          });
        });
    });
  });

});