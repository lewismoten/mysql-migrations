var chai = require('chai');
var fs = require('fs');

var coreFunctions = require('../core_functions');
var testCommons = require('./test_commons');
var mysql = require('./mysql');
var assert = require('assert');

var should = chai.should();

describe('core_functions.js', function() {
  before(function (done) {
    testCommons(done);
  });

  context('update schema', function () {
    it('saves procedures', function (done) {
      var name = 'test_procedure_3c71dcc968da49c4bfded38d9da26107';
      mysql.query(`
CREATE PROCEDURE ${name}()
BEGIN
  SELECT 1;
END
      `, function (error, results) {
        if (error) throw error;
        coreFunctions.update_schema(mysql, __dirname + '/migrations', function () {
          mysql.query('DROP PROCEDURE ' + name, function (error, results) {
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
      mysql.query(`
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
        coreFunctions.update_schema(mysql, __dirname + '/migrations', function () {
          mysql.query('DROP FUNCTION IF EXISTS ' + name, function (error, results) {
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
      mysql.query(`
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
        coreFunctions.update_schema(mysql, __dirname + '/migrations', function () {
          mysql.query('DROP EVENT IF EXISTS ' + name, function (error, results) {
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
    it('should add migration', function (done) {
      var commands = ['node', 'migration', 'add', 'migration', 'create_user2'];
      var path = __dirname +  '/migrations';
      coreFunctions.add_migration(commands, path, function () {
        fs.readdirSync(path).forEach(function(file,index){
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
        mysql.getConnection(function (err, connection) {
          if (err) throw err;
          coreFunctions.down_migrations(mysql, zeroMigrations, path, done);
        });
      });
    })
  })
});
