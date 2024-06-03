var chai = require('chai');

var testCommons = require('./test_commons');
var assert = require('assert');
var logger = require('../logger');
var config = require('../config');

var should = chai.should();

var originalLog = console.log;
var originalError = console.error;
var originalInfo = console.info;
var originalDebug = console.debug;
var originalWarn = console.warn;
var logs = {
  log: [],
  error: [],
  info: [],
  debug: [],
  warn: []
};

describe('logger.js', function () {
  before(function (done) {
    // mock console log methods
    console.log = function (message) { logs.log.push(message); };
    console.error = function (message) { logs.error.push(message); }
    console.info = function (message) { logs.info.push(message); }
    console.debug = function (message) { logs.debug.push(message); }
    console.warn = function (message) { logs.warn.push(message); }
    done();
  });
  beforeEach(function (done) {
    config.logger = logger;
    config.logLevel = 'all';
    logs = {
      log: [],
      error: [],
      info: [],
      debug: [],
      warn: []
    };
    done();
  });
  after(function (done) {
    console.log = originalLog.bind(console);
    console.error = originalError.bind(console);
    console.info = originalInfo.bind(console);
    console.debug = originalDebug.bind(console);
    console.warn = originalWarn.bind(console);
    done();
  })

  context('threshold=ALL', function () {
    beforeEach(function () {
      config.logLevel = 'ALL';
    });
    it('sends critical to console.error', function () {
      var message = 'this is a critical message';
      logger.critical(message);
      assert.ok(logs.error[0].includes(message));
    });
    it('sends error to console.error', function () {
      var message = 'this is an error message';
      logger.error(message);
      assert.ok(logs.error[0].includes(message));
    });
    it('sends warn to console.warn', function () {
      var message = 'this is a warn message';
      logger.warn(message);
      assert.ok(logs.warn[0].includes(message));
    });
    it('sends info to console.info', function () {
      var message = 'this is an info message';
      logger.info(message);
      assert.ok(logs.info[0].includes(message));
    });
    it('sends log to console.log', function () {
      var message = 'this is a log message';
      logger.log(message);
      assert.ok(logs.log[0].includes(message));
    });
    it('sends debug to console.debug', function () {
      var message = 'this is a debug message';
      logger.debug(message);
      assert.ok(logs.debug[0].includes(message));
    });
  });

  context('threshold=DEBUG', function () {
    beforeEach(function () {
      config.logLevel = 'DEBUG';
    });
    it('sends critical to console.error', function () {
      var message = 'this is a critical message';
      logger.critical(message);
      assert.ok(logs.error[0].includes(message));
    });
    it('sends error to console.error', function () {
      var message = 'this is an error message';
      logger.error(message);
      assert.ok(logs.error[0].includes(message));
    });
    it('sends warn to console.warn', function () {
      var message = 'this is a warn message';
      logger.warn(message);
      assert.ok(logs.warn[0].includes(message));
    });
    it('sends info to console.info', function () {
      var message = 'this is an info message';
      logger.info(message);
      assert.ok(logs.info[0].includes(message));
    });
    it('sends log to console.log', function () {
      var message = 'this is a log message';
      logger.log(message);
      assert.ok(logs.log[0].includes(message));
    });
    it('sends debug to console.debug', function () {
      var message = 'this is a debug message';
      logger.debug(message);
      assert.ok(logs.debug[0].includes(message));
    });
  });

  context('threshold=LOG', function () {
    beforeEach(function () {
      config.logLevel = 'LOG';
    });
    it('sends critical to console.error', function () {
      var message = 'this is a critical message';
      logger.critical(message);
      assert.ok(logs.error[0].includes(message));
    });
    it('sends error to console.error', function () {
      var message = 'this is an error message';
      logger.error(message);
      assert.ok(logs.error[0].includes(message));
    });
    it('sends warn to console.warn', function () {
      var message = 'this is a warn message';
      logger.warn(message);
      assert.ok(logs.warn[0].includes(message));
    });
    it('sends info to console.info', function () {
      var message = 'this is an info message';
      logger.info(message);
      assert.ok(logs.info[0].includes(message));
    });
    it('sends log to console.log', function () {
      var message = 'this is a log message';
      logger.log(message);
      assert.ok(logs.log[0].includes(message));
    });
    it('ignores debug', function () {
      var message = 'this is a debug message';
      logger.debug(message);
      assert.equal(logs.debug.length, 0);
    });
  });

  context('threshold=INFO', function () {
    beforeEach(function () {
      config.logLevel = 'INFO';
    });
    it('sends critical to console.error', function () {
      var message = 'this is a critical message';
      logger.critical(message);
      assert.ok(logs.error[0].includes(message));
    });
    it('sends error to console.error', function () {
      var message = 'this is an error message';
      logger.error(message);
      assert.ok(logs.error[0].includes(message));
    });
    it('sends warn to console.warn', function () {
      var message = 'this is a warn message';
      logger.warn(message);
      assert.ok(logs.warn[0].includes(message));
    });
    it('sends info to console.info', function () {
      var message = 'this is an info message';
      logger.info(message);
      assert.ok(logs.info[0].includes(message));
    });
    it('ignores log', function () {
      var message = 'this is a log message';
      logger.log(message);
      assert.equal(logs.log.length, 0);
    });
    it('ignores debug', function () {
      var message = 'this is a debug message';
      logger.debug(message);
      assert.equal(logs.debug.length, 0);
    });
  });

  context('threshold=WARN', function () {
    beforeEach(function () {
      config.logLevel = 'WARN';
    });
    it('sends critical to console.error', function () {
      var message = 'this is a critical message';
      logger.critical(message);
      assert.ok(logs.error[0].includes(message));
    });
    it('sends error to console.error', function () {
      var message = 'this is an error message';
      logger.error(message);
      assert.ok(logs.error[0].includes(message));
    });
    it('sends warn to console.warn', function () {
      var message = 'this is a warn message';
      logger.warn(message);
      assert.ok(logs.warn[0].includes(message));
    });
    it('ignores info', function () {
      var message = 'this is an info message';
      logger.info(message);
      assert.equal(logs.info.length, 0);
    });
    it('ignores log', function () {
      var message = 'this is a log message';
      logger.log(message);
      assert.equal(logs.log.length, 0);
    });
    it('ignores debug', function () {
      var message = 'this is a debug message';
      logger.debug(message);
      assert.equal(logs.debug.length, 0);
    });
  });

  context('threshold=ERROR', function () {
    beforeEach(function () {
      config.logLevel = 'ERROR';
    });
    it('sends critical to console.error', function () {
      var message = 'this is a critical message';
      logger.critical(message);
      assert.ok(logs.error[0].includes(message));
    });
    it('sends error to console.error', function () {
      var message = 'this is an error message';
      logger.error(message);
      assert.ok(logs.error[0].includes(message));
    });
    it('ignores warn', function () {
      var message = 'this is a warn message';
      logger.warn(message);
      assert.equal(logs.warn.length, 0);
    });
    it('ignores info', function () {
      var message = 'this is an info message';
      logger.info(message);
      assert.equal(logs.info.length, 0);
    });
    it('ignores log', function () {
      var message = 'this is a log message';
      logger.log(message);
      assert.equal(logs.log.length, 0);
    });
    it('ignores debug', function () {
      var message = 'this is a debug message';
      logger.debug(message);
      assert.equal(logs.debug.length, 0);
    });
  });

  context('threshold=CRITICAL', function () {
    beforeEach(function () {
      config.logLevel = 'CRITICAL';
    });
    it('sends critical to console.error', function () {
      var message = 'this is a critical message';
      logger.critical(message);
      assert.ok(logs.error[0].includes(message));
    });
    it('ignores error', function () {
      var message = 'this is an error message';
      logger.error(message);
      assert.equal(logs.error.length, 0);
    });
    it('ignores warn', function () {
      var message = 'this is a warn message';
      logger.warn(message);
      assert.equal(logs.warn.length, 0);
    });
    it('ignores info', function () {
      var message = 'this is an info message';
      logger.info(message);
      assert.equal(logs.info.length, 0);
    });
    it('ignores log', function () {
      var message = 'this is a log message';
      logger.log(message);
      assert.equal(logs.log.length, 0);
    });
    it('ignores debug', function () {
      var message = 'this is a debug message';
      logger.debug(message);
      assert.equal(logs.debug.length, 0);
    });
  });

  context('threshold=NONE', function () {
    beforeEach(function () {
      config.logLevel = 'NONE';
    });
    it('ignores critical', function () {
      var message = 'this is a critical message';
      logger.critical(message);
      assert.equal(logs.error.length, 0);
    });
    it('ignores error', function () {
      var message = 'this is an error message';
      logger.error(message);
      assert.equal(logs.error.length, 0);
    });
    it('ignores warn', function () {
      var message = 'this is a warn message';
      logger.warn(message);
      assert.equal(logs.warn.length, 0);
    });
    it('ignores info', function () {
      var message = 'this is an info message';
      logger.info(message);
      assert.equal(logs.info.length, 0);
    });
    it('ignores log', function () {
      var message = 'this is a log message';
      logger.log(message);
      assert.equal(logs.log.length, 0);
    });
    it('ignores debug', function () {
      var message = 'this is a debug message';
      logger.debug(message);
      assert.equal(logs.debug.length, 0);
    });
  });
});
