var chai = require('chai');

var testCommons = require('./test_commons');
var assert = require('assert');
var logger = require('../logger');
var config = require('../config');
var index = require('../index');
var mysql = require('./mysql');

var should = chai.should();
var path = __dirname + '/migrations/';

describe('index.js', function () {

  beforeEach(function (done) {
    config.logger = logger;
    config.logLevel = 'ALL';
    done();
  });

  describe('.init', function () {
    it('assigns --logger to config.logger', function (done) {
      function noop() { };

      var newLogger = {
        critical: noop,
        error: noop,
        warn: noop,
        info: noop,
        log: noop,
        debug: noop
      };
      assert.notEqual(config.logger, newLogger);

      index.init(
        mysql,
        path,
        function () {
          assert.equal(config.logger, newLogger);
          done();
        },
        [
          '--logger',
          newLogger
        ]
      );
    });
    it('assigns --log-level to config.logLevel', function (done) {
      var newLevel = 'NONE';
      assert.notEqual(config.logLevel, newLevel);

      index.init(
        mysql,
        path,
        function () {
          assert.equal(config.logLevel, newLevel);
          done();
        },
        [
          `--log-level ${newLevel}`
        ]
      );
    });
  });
});
