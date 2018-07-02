// resloader tests

const ResLoader = require('../src/resloader/resloader');

const assert = require('assert');
const chai = require('chai'),
  expect = require('chai').expect,
  chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

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
  });

  describe('#load()', () => {
    it('should load TestBundle files', () => {
      return new ResLoader()
        .path(`${__dirname}/data`)
        .name('TestBundle')
        .load().then((result) => {
          const {strings, bundles} = result;
          assert.notEqual(strings, null);
          assert.notEqual(strings, {});
          assert.equal(bundles.size, 2);
          assert.equal(bundles.get('TestBundle_de.properties').locale, 'de');
          assert.equal(bundles.get('TestBundle_en.properties').locale, 'en');
        });
    });
  });

});