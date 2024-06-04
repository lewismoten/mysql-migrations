var migrations = require('../index');
var testCommons = require('./test_commons');
var poolManager = require('./poolManager');
var assert = require('assert');
var fs = require('fs');
var config = require('../config');
var logger = require('../logger');
var queryFunctions = require('../query');

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

  context('readOptions', function () {
    it('reads template option', function (done) {
      var name = __dirname + '/migrations/template_17c2387b-38af-4ef6-bf6f-bb72f68255ff.js';
      fs.writeFileSync(name, 'this is a template', { encoding: 'utf-8' });
      migrations.readOptions(
        [
          `--template ${name}`
        ]
      );
      assert.equal(name, config.template);
      done();
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

      migrations.readOptions(
        [
          '--logger',
          newLogger
        ]
      );
      assert.equal(config.logger, newLogger);
      done();
    });
    it('assigns --log-level to config.logLevel', function (done) {
      var newLevel = 'NONE';
      assert.notEqual(config.logLevel, newLevel);
      migrations.readOptions(
        [
          `--log-level ${newLevel}`
        ]
      );
      assert.equal(config.logLevel, newLevel);
      done();
    });
  });
  context('init', function () {

    it('exports data with --update-data', function (done) {
      const timestamp = Date.now();
      var pool = poolManager.newPool();
      pool.getConnection(function (err, connection) {
        if (err) throw err;
        // ensure we have at least 1 migration
        queryFunctions.updateRecords(pool, 'up', timestamp, function () {
          const testId = 'dc00798c-f149-444d-8c49-1d9469b875cf';
          // add data to export
          connection.query(`
create table if not exists Foo ( bar varchar(36) );
insert into Foo (bar) values ('${testId}');
`, function (err, res) {
            if (err) {
              throw err;
            }

            migrations.init(
              pool,
              path,
              function () {
                pool.end();
                const fileExists = fs.existsSync(`${path}/data.sql`);
                assert.ok(fileExists, 'data.sql must exist');

                const content = fs.readFileSync(`${path}/data.sql`, { encoding: 'utf-8' });

                assert.ok(content.includes('INSERT INTO `Foo`'), 'Must include insert statement');
                assert.ok(content.includes(testId), 'Must include data');

                assert.ok(!content.includes('CREATE TABLE `Foo`'), 'Must not include create table statement');

                assert.ok(!content.includes(`INSERT INTO \`${config.table}\``), 'Must not populate migrations');

                done();
              },
              [
                '--update-data',
                '--argv',
                ['', '', 'up']
              ]
            );
          })
        });
      });
    });
  });

});