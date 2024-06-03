var chai = require('chai');
var fs = require('fs');

var testCommons = require('./test_commons');
var assert = require('assert');
var file = require('../file');

describe('file.js', function () {
  before(function (done) {
    testCommons(done);
  });

  context('readFolder', function () {
    it('ignores text files', function (done) {
      var name = 'fc0e8593-f0f0-45f0-8282-3c426836a486.txt';
      fs.writeFileSync(__dirname + '/migrations/' + name, "test content", { encoding: 'utf-8' });
      file.readFolder(__dirname + '/migrations', function (files) {
        assert.ok(!files.includes(name), `Not contains ${name}`);
        done();
      });
    });
    it('reads JavaScript files', function (done) {
      var name = 'fc0e8593-f0f0-45f0-8282-3c426836a486.js';
      fs.writeFileSync(__dirname + '/migrations/' + name, "test content", { encoding: 'utf-8' });
      file.readFolder(__dirname + '/migrations', function (files) {
        assert.ok(files.includes(name), `Contains ${name}`);
        done();
      });
    });
    it('ignores schema.sql', function (done) {
      var name = 'schema.sql';
      fs.writeFileSync(__dirname + '/migrations/' + name, "test content", { encoding: 'utf-8' });
      file.readFolder(__dirname + '/migrations', function (files) {
        assert.ok(!files.includes(name), `Not contains ${name}`);
        done();
      });
    });
  });
});
