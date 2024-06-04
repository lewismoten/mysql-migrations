var fs = require("fs");
var config = require('./config');

function validate_file_name(file_name) {
  var patt = /^[0-9a-zA-Z-_]+$/;
  if (!patt.test(file_name)) {
    config.logger.error(`Invalid file name '${file_name}'`);
    throw new Error("File name can contain letters, numbers, hyphen or underscore");
  }
}

function readFolder(path, cb) {
  fs.readdir(path, function (err, files) {
    if (err) throw err;
    files = files
      .filter(file => config.script_pattern.test(file))
      .filter(file => file !== 'schema.sql' && file !== 'data.sql');
    cb(files);
  });
}

function parseTimestamp(file) {
  const match = /^(\d+)\_/.exec(file);
  if (match && match.length > 1) {
    if (match[1].length !== 13) {
      config.logger.warn(`Invalid timestamp: ${file}`);
      return -1;
    }
    const timestamp = parseInt(match[1], 10);
    return timestamp;
  }
  return -1;
}
function readMigrations(path, after_timestamp, max_count, ascending, cb) {
  var file_paths = [];
  var timestamps = [];
  readFolder(path, function (files) {
    files.forEach(function (file_path) {
      const timestamp = parseTimestamp(file_path);
      if (timestamp === -1) return;
      if (timestamps.includes(timestamp)) {
        config.logger.warn(`Ignoring duplicate timestamp: ${file_path}`);
      } else if (timestamp <= after_timestamp) {
        config.logger.debug(`Skipping: ${file_path}`);
        // already migrated
        return;
      } else {
        file_paths.push({ timestamp, file_path });
      }
    });
    file_paths.sort(compareTimestamps(ascending));
    if (max_count > -1) {
      file_paths = file_paths.slice(0, max_count);
    }
    cb(file_paths);
  });
}

const compareTimestamps = ascending => ({ timestamp: a }, { timestamp: b }) => ascending ? a - b : b - a;

function readFile(path, cb) {
  fs.readFile(path, function (err, data) {
    if (err) {
      config.logger.error(`Unable to read file '${path}`);
      throw err;
    }

    cb(data);
  });
}

module.exports = {
  validate_file_name: validate_file_name,
  readFolder: readFolder,
  readFile: readFile,
  readMigrations,
  parseTimestamp
};
