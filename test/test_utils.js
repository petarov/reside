// utils tests

const { Utils } = require('../src/utils');

const assert = require('assert');
const chai = require('chai'),
  expect = require('chai').expect,
  chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('utils', () => {

  describe('#getBundleName()', () => {
    it('resolve bundle file components #1', () => {
      const {dirname, name, locale} = Utils.getBundleName(
        `${__dirname}/data/TestBundle_en.properties`);
        assert.equal(dirname, `${__dirname}/data`);
        assert.equal(name, 'TestBundle');
        assert.equal(locale, 'en');
    });

    it('resolve bundle file components #2', () => {
      const {dirname, name, locale} = Utils.getBundleName(
        `${__dirname}/data/TestBundle_en-US.properties`);
        assert.equal(dirname, `${__dirname}/data`);
        assert.equal(name, 'TestBundle');
        assert.equal(locale, 'en-US');
    });

    it('resolve bundle file components #3', () => {
      const {dirname, name, locale} = Utils.getBundleName(
        `${__dirname}/data/TestBundle_en_US.properties`);
        assert.equal(dirname, `${__dirname}/data`);
        assert.equal(name, 'TestBundle');
        assert.equal(locale, 'en_US');
    });
  });

  describe('#isComment()', () => {
    it('is label a comment', () => {
      assert.ok(Utils.isComment(''));
      assert.ok(Utils.isComment('#Comment!'));
      assert.ok(Utils.isComment('##Comment!'));
      assert.ok(Utils.isComment(';!'));
      assert.ok(Utils.isComment(';;;;;Comment'));
      assert.ok(Utils.isComment('//Comment!'));
      assert.ok(Utils.isComment('/Comment!'));
    });
  });

});