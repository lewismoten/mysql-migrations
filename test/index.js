var migrations = require('../index');
var testCommons = require('./test_commons');
var mysql = require('./mysql');
var assert = require('assert');
var fs = require('fs');
var config = require('../config');
var logger = require('../logger');

var path = __dirname + '/migrations';

describe('index.js', function () {
  before(function (done) {
    testCommons(done);
  });

  beforeEach(function (done) {
    config.logger = logger;
    config.logLevel = 'ALL';
    done();
  });

  context('init', function () {
    it('reads template option', function (done) {
      var name = __dirname + '/migrations/template_17c2387b-38af-4ef6-bf6f-bb72f68255ff.js';
      fs.writeFileSync(name, 'this is a template', { encoding: 'utf-8' });
      migrations.init(
        mysql,
        path,
        function () {
          assert.equal(name, config.template);
          done();
        },
        [
          `--template ${name}`
        ]
      );
    })
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

      migrations.init(
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
      migrations.init(
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