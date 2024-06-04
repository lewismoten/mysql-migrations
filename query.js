var config = require('./config');
var migrationTable = require('./migrationTable');

function run_query(conn, query, cb, run) {
  if (run == null) {
    run = true;
  }
  if (run) {
    conn.getConnection(function (err, connection) {
      if (err) {
        config.logger.error(`${err}`);
        throw err;
      }
      config.logger.debug(query);
      connection.query(query, function (error, results, fields) {
        connection.release();
        if (error) {
          config.logger.error(`${error}`);
          throw error;
        }
        cb(results);
      });
    });
  } else {
    cb({});
  }
}

function execute_query(conn, path, final_file_paths, type, cb, run = true) {
  if (run == null) {
    run = true;
  }

  if (final_file_paths.length) {
    var file_name = final_file_paths.shift()['file_path'];
    var current_file_path = path + "/" + file_name;
    const TYPE_NAME = type.toUpperCase();
    const execution = run ? 'Run Query' : 'Timestamp Only';

    var queries = require(current_file_path);
    config.logger.info(`${execution} ${TYPE_NAME}: ${file_name}`);

    var timestamp_val = file_name.split("_", 1)[0];
    if (typeof (queries[type]) == 'string') {
      run_query(conn, queries[type], function (res) {
        updateRecords(conn, type, timestamp_val, function () {
          execute_query(conn, path, final_file_paths, type, cb, run);
        });
      }, run);
    } else if (typeof (queries[type]) == 'function') {
      config.logger.debug(`Function: ${queries[type].toString()}`);
      if (run) {
        queries[type](conn, function () {
          updateRecords(conn, type, timestamp_val, function () {
            execute_query(conn, path, final_file_paths, type, cb, run);
          });
        });
      } else {
        updateRecords(conn, type, timestamp_val, function () {
          execute_query(conn, path, final_file_paths, type, cb, run);
        });
      }
    }

  } else {
    config.logger.info(`No more ${TYPE_NAME} migrations to run`);
    cb();
  }
}

function updateRecords(conn, type, timestamp_val, cb) {
  var query = '';
  if (type == 'up') {
    query = migrationTable.insertOne(timestamp_val);
  } else if (type == 'down') {
    query = migrationTable.deleteOne(timestamp_val);
  }

  run_query(conn, query, function (res) {
    cb();
  });
}

module.exports = {
  run_query: run_query,
  execute_query: execute_query,
  updateRecords: updateRecords
};
