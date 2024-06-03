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
