var chai = require('chai');

var queryFunctions = require('../query');
var testCommons = require('./test_commons');
var mysql = require('./mysql');
var assert = require('assert');
var fs = require('fs');

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

      mysql.getConnection(function (err, connection) {
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

        queryFunctions.execute_query(mysql, __dirname + '/migrations', files, 'up', function () {
          console.info = oldInfo.bind(console);
          assert.ok(loggedFile, 'File name was logged.');
          done();
        });
      });
    })
  });

  context('updateRecords', function () {
    var timestamp = Date.now();
    var table = 'user1';
    it('should insert into table when up', function (done) {
      mysql.getConnection(function (err, connection) {
        connection.query('CREATE TABLE `' + table + '` (timestamp VARCHAR(255))', function (error, results) {
          if (error) {
            throw error;
          }

          queryFunctions.updateRecords(mysql, 'up', table, timestamp, function () {
            connection.query('SELECT * FROM `' + table + '` WHERE timestamp="' + timestamp + '"', function (err, res) {
              if (err) {
                throw err;
              }

              assert.ok(res.length);
              done();
            });
          });
        });
      });
    });

    it('should delete from table when down', function (done) {
      queryFunctions.updateRecords(mysql, 'down', table, timestamp, function () {
        mysql.getConnection(function (err, connection) {
          connection.query('SELECT * FROM `' + table + '` WHERE timestamp="' + timestamp + '"', function (err, res) {
            if (err) {
              throw err;
            }

            assert.ok(!res.length);
            done();
          });
        });
      });
    });
  });
});
