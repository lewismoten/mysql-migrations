var chai = require('chai');
var fs = require('fs');

var coreFunctions = require('../core_functions');
var testCommons = require('./test_commons');
var poolManager = require('./poolManager');
var assert = require('assert');
var config = require('../config');

var should = chai.should();

describe('core_functions.js', function () {
  beforeEach(function (done) {
    testCommons(done);
  });

  context('update schema', function () {
    it('saves procedures', function (done) {
      var name = 'test_procedure_3c71dcc968da49c4bfded38d9da26107';
      var pool = poolManager.newPool();
      pool.query(`
CREATE PROCEDURE ${name}()
BEGIN
  SELECT 1;
END
      `, function (error, results) {
        if (error) throw error;
        coreFunctions.update_schema(pool, __dirname + '/migrations', function () {
          pool.query('DROP PROCEDURE ' + name, function (error, results) {
            pool.end();
            if (error) throw error;
            const schema = fs.readFileSync(__dirname + '/migrations/schema.sql', { encoding: 'utf-8' });
            assert.match(schema, new RegExp(name), 'Schema includes procedure');
            done();
          });
        });
      });
    });
    it('saves functions', (done) => {
      var name = 'test_function_1391c8019b96453da1515ecd4a15a055';
      var pool = poolManager.newPool();
      pool.query(`
CREATE FUNCTION IF NOT EXISTS ${name}(a INT, b INT)
RETURNS INT
DETERMINISTIC
BEGIN
  DECLARE result INT;
  SET result = a + b;
  RETURN result;
END
      `, function (error, results) {
        if (error) throw error;
        coreFunctions.update_schema(pool, __dirname + '/migrations', function () {
          pool.query('DROP FUNCTION IF EXISTS ' + name, function (error, results) {
            pool.end();
            if (error) throw error;
            const schema = fs.readFileSync(__dirname + '/migrations/schema.sql', { encoding: 'utf-8' });
            assert.match(schema, new RegExp(name), 'Schema includes function');
            done();
          });
        });
      });
    });
    it('saves events', (done) => {
      var name = 'test_event_128c055bb3d64cde8dd88874d8f5f346';
      var pool = poolManager.newPool();
      pool.query(`
CREATE EVENT IF NOT EXISTS ${name}
ON SCHEDULE
  EVERY 1 DAY
  STARTS CURRENT_TIMESTAMP
DO
BEGIN
  SELECT 1;
END;
      `, function (error, results) {
        if (error) throw error;
        coreFunctions.update_schema(pool, __dirname + '/migrations', function () {
          pool.query('DROP EVENT IF EXISTS ' + name, function (error, results) {
            pool.end();
            if (error) throw error;
            const schema = fs.readFileSync(__dirname + '/migrations/schema.sql', { encoding: 'utf-8' });
            assert.match(schema, new RegExp(name), 'Schema includes event');
            done();
          });
        });
      });
    });
  })

  context('add_migration', function () {
    it('uses custom template with up SQL', function (done) {
      config.template = __dirname + '/migrations/test-template.js';
      fs.writeFileSync(config.template, 'Test: ${{ args.up }}', { encoding: 'utf-8' });
      var sql = `SELECT 'MySqlHere'`;
      var commands = ['node', 'migration', 'add', 'migration', 'test_custom_template_with_up', sql];
      var path = __dirname + '/migrations';
      coreFunctions.add_migration(commands, path, function () {
        var fileName = fs.readdirSync(path)[0];
        var contents = fs.readFileSync(path + '/' + fileName, { encoding: 'utf-8' });
        assert.equal(contents, `Test: ${sql}`, "SQL tag replaced with SQL");
        done();
      });
    });
    it('uses custom template without up SQL', function (done) {
      config.template = __dirname + '/migrations/test-template.js';
      fs.writeFileSync(config.template, 'Test: ${{ args.up }}', { encoding: 'utf-8' });
      var commands = ['node', 'migration', 'add', 'migration', 'test_custom_template_no_sql'];
      var path = __dirname + '/migrations';
      coreFunctions.add_migration(commands, path, function () {
        var fileName = fs.readdirSync(path)[0];
        var contents = fs.readFileSync(path + '/' + fileName, { encoding: 'utf-8' });
        assert.equal(contents, `Test: `, "SQL tag replaced with blank");
        done();
      });
    });

    it('should add migration', function (done) {
      var commands = ['node', 'migration', 'add', 'migration', 'create_user2'];
      var path = __dirname + '/migrations';
      coreFunctions.add_migration(commands, path, function () {
        fs.readdirSync(path).forEach(function (file, index) {
          assert.ok(file.indexOf('create_user2'));
        });

        done();
      });
    });
  });

  describe('down', function () {
    context('zero migrations', function () {
      it('', function (done) {
        const zeroMigrations = 0;
        var path = __dirname + '/migrations';
        var pool = poolManager.newPool();
        pool.getConnection(function (err, connection) {
          if (err) throw err;
          coreFunctions.down_migrations(pool, zeroMigrations, path, () => {
            pool.end();
            done();
          });
        });
      });
    })
  })
});
