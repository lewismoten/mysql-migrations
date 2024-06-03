var colors = require('colors');
var config = require('./config');

var NONE = 'NONE';
var CRITICAL = 'CRITICAL';
var ERROR = 'ERROR';
var WARN = 'WARN';
var LOG = 'LOG';
var INFO = 'INFO';
var DEBUG = 'DEBUG';
var ALL = 'ALL';

var levels = [NONE, CRITICAL, ERROR, WARN, INFO, LOG, DEBUG, ALL];

function canLog(level) {
  var threshold = config.logLevel;
  if (threshold === undefined) threshold = LOG;
  var thresholdIndex = levels.indexOf(threshold);
  var levelIndex = levels.indexOf(level);
  return levelIndex <= thresholdIndex;
}

function log(method, level, color, message) {
  if (canLog(level)) {
    console[method](color(message));
  }
}

function checkLevel(level) {
  if (!levels.includes(level)) {
    throw new Error(`Invalid log level '${level}'. Acceptable values are ${levels.join(', ')}`);
  }
}

function checkLogger(customLogger) {
  var keys = ['critical', 'error', 'warn', 'info', 'log', 'debug'];
  keys.forEach(function (key) {
    if (typeof customLogger[key] !== 'function') {
      throw new Error(`Custom Logger '${key}' is not a function. Expected functions: ${keys.join(', ')}`);
    }
  });
}

var logger = {
  checkLevel,
  checkLogger,
  critical: log.bind(null, 'error', CRITICAL, colors.red),
  error: log.bind(null, 'error', ERROR, colors.red),
  warn: log.bind(null, 'warn', WARN, colors.yellow),
  info: log.bind(null, 'info', INFO, colors.blue),
  log: log.bind(null, 'log', LOG, colors.white),
  debug: log.bind(null, 'debug', DEBUG, colors.grey)
}

module.exports = logger;