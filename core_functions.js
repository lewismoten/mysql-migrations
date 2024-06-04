var fs = require("fs");

var fileFunctions = require('./file');
var queryFunctions = require('./query');
var exec = require('child_process').exec;
var config = require('./config');
var table = config['table'];
var migrationTable = require('./migrationTable');
const { execSync } = require("child_process");

const BEGINNING_OF_TIME = 0;
const NO_LIMIT = -1;
const ASCENDING = true;
const DESCENDING = false;

function add_migration(argv, path, cb) {
  const suffix = argv[4];
  const up = argv[5] ?? '';

  fileFunctions.validate_file_name(suffix);
  fileFunctions.readFolder(path, function (files) {
    const ms = Date.now();
    var file_name = `${ms}_${suffix}`;
    var file_path = `${path}/${file_name}.js`;
    var content;

    if (config.template) {
      content = fs.readFileSync(config.template, { encoding: 'utf-8' });
      content = content.replace(/\$\{\{ args\.up \}\}/i, up);
    } else {
      var sql_json = {
        up,
        down: ''
      };
      content = `module.exports = ${JSON.stringify(sql_json, null, 4)};`;
    }

    fs.writeFile(file_path, content, 'utf-8', function (err) {
      if (err) throw err;
      config.logger.info(`Added ${file_name}`);
      cb();
    });
  });
}


function createMigrationTable(conn, cb) {
  queryFunctions.run_query(conn, migrationTable.create(), cb);
}
function up_migrations(conn, max_count, path, cb) {
  queryFunctions.run_query(conn, migrationTable.selectLatest(), function (results) {
    var max_timestamp = 0;
    if (results.length) {
      max_timestamp = results[0].timestamp;
    }

    fileFunctions.readMigrations(path, max_timestamp, max_count, ASCENDING, function (file_paths) {
      queryFunctions.execute_query(conn, path, file_paths, 'up', cb);
    });
  });
}

function up_migrations_all(conn, max_count, path, cb) {
  queryFunctions.run_query(conn, migrationTable.selectAll(), function (results) {
    var timestamps = results.map(r => parseInt(r.timestamp, 10));

    fileFunctions.readMigrations(path, BEGINNING_OF_TIME, NO_LIMIT, ASCENDING, function (file_paths) {
      file_paths = file_paths
        .filter(({ timestamp }) => timestamps.includes(timestamp))
        .slice(0, max_count);
      queryFunctions.execute_query(conn, path, file_paths, 'up', cb);
    });
  });
}

function down_migrations(conn, max_count, path, cb) {
  queryFunctions.run_query(conn, migrationTable.selectLatest(max_count), function (results) {
    if (results.length) {
      var temp_timestamps = results.map(e => parseInt(e.timestamp, 10));
      var earliestTimestamp = temp_timestamps[temp_timestamps.length - 1];
      fileFunctions.readMigrations(path, earliestTimestamp - 1, NO_LIMIT, DESCENDING, function (file_paths) {
        file_paths = file_paths.filter(fp => temp_timestamps.includes(fp.timestamp));
        temp_timestamps
          .filter(timestamp => !file_paths.some(fp => fp.timestamp === timestamp))
          .forEach(timestamp => {
            config.logger.warn(`Unable to find migration for ${timestamp}`);
          });
        queryFunctions.execute_query(conn, path, file_paths, 'down', cb);
      });
    } else {
      config.logger.info("No more DOWN migrations to run");
      cb();
    }
  });
}

function run_migration_directly(file, type, conn, path, cb) {
  var current_file_path = path + "/" + file;
  var file_paths;
  if (fs.existsSync(current_file_path)) {

    const timestamp = fileFunctions.parseTimestamp(file);
    if (timestamp === -1) {
      cb();
      return;
    }

    file_paths = [
      {
        timestamp,
        file_path: file
      }
    ];
    queryFunctions.execute_query(conn, path, file_paths, type, cb);
  } else if (/^\d+$/.test(file)) {
    timestamp = parseInt(file, 10);
    fileFunctions.readMigrations(path, timestamp - 1, 1, ASCENDING, (file_paths) => {
      file_paths = file_paths.filter(fs => fs.timestamp === timestamp);
      if (file_paths.length === 0) {
        config.logger.error(`Unable to find file for ${file}`);
        cb();
      } else {
        queryFunctions.execute_query(conn, path, file_paths, type, cb);
      }
    });
  } else {
    config.logger.error(`File does not exist, and is not a timestamp. '${file}`);
    cb();
    return;
  }
}

function connectionArgs(connectionConfig) {
  let cmd = '';
  const { host, port, user, password, database } = connectionConfig;
  if (host) cmd += ` -h ${host}`;
  if (port) cmd += ` --port=${port}`;
  if (user) cmd += ` --user=${user}`;
  if (password) cmd += ` --password=${password}`;
  cmd += ` ${database}`;
  return cmd;
}
function dump(conn, path, file, cb, flags) {
  var filePath = `${path}/${file}`;
  var cmd = `mysqldump ${flags} --skip-dump-date`;
  cmd += connectionArgs(conn.config.connectionConfig);
  fs.unlink(filePath, function () {
    exec(cmd, function (error, stdout, stderr) {
      if (error) {
        config.logger.error(error);
        cb();
      }
      if (stderr) {
        config.logger.error(stderr);
      }
      fs.writeFile(filePath, stdout, function (err) {
        if (err) {
          config.logger.error(`Could not save ${file}: ${err}`);
        } else {
          config.logger.info(`Updated ${file}`);
        }
        cb();
      });
    });
  });
}
function update_data(conn, path, cb) {
  const db = conn.config.connectionConfig.database;
  const ignoredTable = `${db}.${table}`;
  dump(conn, path, 'data.sql', cb, `--no-create-info --ignore-table=${ignoredTable}`);
}
function update_schema(conn, path, cb) {
  dump(conn, path, 'schema.sql', cb, '--no-data --routines --events');
}

function bulkImport(conn, path, file, cb) {
  var filePath = `${path}/${file}`;
  if (!fs.existsSync(filePath)) {
    config.logger.error("Missing: " + filePath);
    cb();
  }
  var cmd = "mysql ";
  cmd += connectionArgs(conn.config.connectionConfig);
  cmd += ` < ${filePath}`;
  exec(cmd, function (error, stdout, stderr) {
    if (stdout) config.logger.debug(stdout);
    if (stderr) config.logger.error(stderr);
    if (error) {
      config.logger.error(`Could not load from ${file}: ${error}`);
      throw error;
    } else {
      config.logger.info(`Imported ${file}`)
      cb();
    }
  });
}
function createFromSchema(conn, path, cb) {
  bulkImport(conn, path, 'schema.sql', function () {
    fileFunctions.readMigrations(path, BEGINNING_OF_TIME, NO_LIMIT, ASCENDING, function (file_paths) {
      queryFunctions.execute_query(conn, path, file_paths, 'up', cb, false);
    });
  });
}
function createFromData(conn, path, cb) {
  bulkImport(conn, path, 'data.sql', cb);
}
module.exports = {
  add_migration: add_migration,
  up_migrations: up_migrations,
  up_migrations_all: up_migrations_all,
  down_migrations: down_migrations,
  run_migration_directly: run_migration_directly,
  update_schema: update_schema,
  update_data,
  createFromSchema: createFromSchema,
  createFromData,
  createMigrationTable
};
