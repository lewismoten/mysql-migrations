var fs = require("fs");

var coreFunctions = require('./core_functions');
var config = require('./config');
var migrations_types = config['migrations_types'];
var logger = require('./logger');

var updateSchema = false;
var updateData = false;
var migrate_all = false;

function readOptions(options) {

  if (!(options instanceof Array)) {
    return;
  }
  if (options.indexOf("--migrate-all") > -1) {
    migrate_all = true;
  }

  if (options.indexOf("--update-schema") > -1) {
    updateSchema = true;
  }

  if (options.includes("--update-data")) {
    updateData = true;
  }

  options.filter(option => typeof option === 'string' && option.startsWith('--template ')).forEach(option => {
    config.template = option.split(' ', 2)[1];
    fs.accessSync(config.template, fs.constants.F_OK);
  });

  var loggerIndex = options.findIndex(option => option === '--logger');
  if (loggerIndex !== -1) {
    var customLogger = options[loggerIndex + 1];
    logger.checkLogger(customLogger);
    config.logger = customLogger;
  } else {
    config.logger = logger;
  }

  options
    .filter(option => typeof option === "string" && option.startsWith('--log-level '))
    .forEach(option => {
      var level = option.replace('--log-level ', '').toUpperCase();
      logger.checkLevel(level);
      config.logLevel = level;
    });

  // override argv for testing (otherwise we get a list of files being tested)
  var argvIndex = options.indexOf('--argv');
  if (argvIndex !== -1) {
    if (!Array.isArray(options[argvIndex + 1])) {
      throw new Error('expected --argv to be followed by an array')
    }
    return options[argvIndex + 1];
  }
  return process.argv;
}

function migration(conn, path, cb, options) {
  if (cb == null)
    cb = () => { };
  argv = readOptions(options);

  var updateSchemaIndex = argv.indexOf("--update-schema");
  if (updateSchemaIndex > -1) {
    updateSchema = true;
    argv.splice(updateSchemaIndex, 1);
  }

  var updateDataIndex = argv.indexOf("--update-data");
  if (updateDataIndex > -1) {
    updateData = true;
    argv.splice(updateDataIndex, 1);
  }

  var migrate_index = argv.indexOf("--migrate-all");
  if (migrate_index > -1) {
    migrate_all = true;
    argv.splice(migrate_index, 1);
  }

  coreFunctions.createMigrationTable(conn, function () {
    handle(argv, conn, path, cb);
  });
}

function handle(argv, conn, path, cb) {
  const command = argv[2]; // "add" | "up" | "down" | "refresh" | "run" | "load-from-schema" | "load-from-data"
  // "add" = <"migration" | "seed">
  // "up" = <number? = 999999>
  // "down" = <number? = 1>
  // "run" = <file> <"up" | "down">

  if (command == 'add') {
    const addType = argv[3];
    const addTypes = ['migration', 'seed'];
    if (addTypes.includes(addType)) {
      coreFunctions.add_migration(argv, path, function () {
        closePool(conn);
        cb();
      });
    } else {
      config.logger.error(`Unknown migration type '${addType}'. Expected ${addTypes.join(' or ')}`);
      closePool(conn);
      cb();
    }
  } else if (command == 'up') {
    var count = null;
    if (argv.length > 3) {
      count = parseInt(argv[3], 10);
    } else {
      count = 999999;
    }
    if (migrate_all) {
      coreFunctions.up_migrations_all(conn, count, path, function () {
        updateSchemaDataAndEnd(conn, path, cb);
      });
    } else {
      coreFunctions.up_migrations(conn, count, path, function () {
        updateSchemaDataAndEnd(conn, path, cb);
      });
    }
  } else if (command == 'down') {
    var count = null;
    if (argv.length > 3) {
      count = parseInt(argv[3], 10);
    } else count = 1;
    coreFunctions.down_migrations(conn, count, path, function () {
      updateSchemaDataAndEnd(conn, path, cb);
    });
  } else if (command == 'refresh') {
    coreFunctions.down_migrations(conn, 999999, path, function () {
      coreFunctions.up_migrations(conn, 999999, path, function () {
        updateSchemaDataAndEnd(conn, path, cb);
      });
    });
  } else if (command == 'run') {
    const file = argv[3];
    const migrationType = argv[4];
    if (migrations_types.includes(migrationType)) {
      coreFunctions.run_migration_directly(file, migrationType, conn, path, function () {
        updateSchemaDataAndEnd(conn, path, cb);
      });
    } else {
      config.logger.error(`Unknown migration type '${migrationType}'`);
      cb();
    }
  } else if (command == 'load-from-schema') {
    coreFunctions.createFromSchema(conn, path, function () {
      closePool(conn);
      cb();
    });
  } else if (command == 'load-from-data') {
    coreFunctions.createFromData(conn, path, function () {
      closePool(conn);
      cb();
    });
  } else {
    throw new Error(`Unexpected command: ["${argv.join('", "')}"]`);
  }
}

const closePool = pool => {
  try {
    pool.end();
  } catch (e) {

  }
}
function updateSchemaDataAndEnd(conn, path, cb) {
  if (updateSchema) {
    coreFunctions.update_schema(conn, path, function () {
      if (updateData) {
        coreFunctions.update_data(conn, path, function () {
          closePool(conn);
          cb();
        });
      } else {
        closePool(conn);
        cb();
      }
    });
  } else if (updateData) {
    coreFunctions.update_data(conn, path, function () {
      closePool(conn);
      cb();
    });
  } else {
    closePool(conn);
    cb();
  }
}

module.exports = {
  init: migration,
  readOptions
}
