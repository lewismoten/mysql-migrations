var chai = require('chai');

var queryFunctions = require('../query');
var testCommons = require('./test_commons');
var poolManager = require('./poolManager');
var assert = require('assert');
var fs = require('fs');
var config = require('../config');

var should = chai.should();

describe('query.js', function () {
  before(function (done) {
    testCommons(done);
  });
  after(function (done) {
    testCommons(done);
  });

  context('execute_query', function () {
    it('should write file name', function (done) {
      const name = '1_should_write_file_name.js';
      fs.writeFileSync(
        __dirname + '/migrations/' + name,
        `module.exports={up: "select 1", down: "select 2"};`,
        { encoding: 'utf-8' }
      );
      config.logLevel = "INFO";

      var pool = poolManager.newPool();
      pool.getConnection(function (err, connection) {
        if (err) throw err;

        var files = [{
          timestamp: 1, file_path: name
        }];
        var oldInfo = console.info;
        var loggedFile = false;
        console.info = (arg1) => {
          if (`${arg1}`.includes(name)) {
            loggedFile = true;
          }
        };

        queryFunctions.execute_query(pool, __dirname + '/migrations', files, 'up', function () {
          pool.end();
          console.info = oldInfo.bind(console);
          assert.ok(loggedFile, 'File name was logged.');
          done();
        });
      });
    })
  });

  context('updateRecords', function () {
    var timestamp;
    var sql;
    before((done) => {
      timestamp = Date.now();
      sql = `SELECT * FROM \`${config.table}\` WHERE timestamp="${timestamp}"`;
      done();
    });
    it('should insert into table when up', function (done) {
      var pool = poolManager.newPool();
      pool.getConnection(function (err, connection) {
        if (err) throw err;
        queryFunctions.updateRecords(pool, 'up', timestamp, function () {
          connection.query(sql, function (err, res) {
            pool.end();
            if (err) {
              throw err;
            }

            assert.equal(res.length, 1);
            done();
          });
        });
      });
    });

    it('should delete from table when down', function (done) {
      var pool = poolManager.newPool();
      queryFunctions.updateRecords(pool, 'down', timestamp, function () {
        pool.getConnection(function (err, connection) {
          if (err) throw err;
          connection.query(sql, function (err, res) {
            pool.end();
            if (err) {
              throw err;
            }

            assert.equal(res.length, 0);
            done();
          });
        });
      });
    });
  });
});
