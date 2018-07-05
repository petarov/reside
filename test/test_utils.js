// utils tests

const { Utils } = require('../src/utils');

const assert = require('assert');
const chai = require('chai'),
  expect = require('chai').expect,
  chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

describe('utils', () => {

  describe('#getBundleName()', () => {
    it('resolve bundle file components', () => {
      const {dirname, name} = Utils.getBundleName(
        `${__dirname}/data/TestBundle_en.properties`);
        assert.equal(dirname, `${__dirname}/data`);
        assert.equal(name, 'TestBundle');
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