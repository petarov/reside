// resloader - test_resloader.js

const ResLoader = require('../src/resloader/resloader');
const assert = require('assert');
const chai = require('chai');
const expect = require('chai').expect;
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

describe('resloader', function () {

  describe('#_resolveFiles()', function () {
    it('should resolve TestBundle files by given locales', function () {
      const resloader = new ResLoader()
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

    it('should find all TestBundle files by path', function () {
      const resloader = new ResLoader()
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

    it('should find only EN TestBundle file', function () {
      const resloader = new ResLoader()
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

  describe('#load()', function () {
    it('should reject non-existing path', function () {
      expect(new ResLoader()
        .path(`${__dirname}/FOLDER_INVALID`)
        .name('TestBundle')
        .load()).to.be.rejected;
    });
  });

});