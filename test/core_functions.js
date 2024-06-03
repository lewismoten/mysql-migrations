var chai = require('chai');
var fs = require('fs');

var coreFunctions = require('../core_functions');
var testCommons = require('./test_commons');
var mysql = require('./mysql');
var assert = require('assert');
var config = require('../config');

var should = chai.should();

describe('core_functions.js', function() {
  beforeEach(function (done) {
    testCommons(done);
  });

  context('add_migration', function () {
    it('uses custom template with up SQL', function (done) {
      config.template = './test-template.js';
      fs.writeFileSync('./test-template.js', 'Test: ${{ args.up }}', { encoding: 'utf-8' });
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
      config.template = './test-template.js';
      fs.writeFileSync('./test-template.js', 'Test: ${{ args.up }}', { encoding: 'utf-8' });
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
      var path = __dirname +  '/migrations';
      coreFunctions.add_migration(commands, path, function () {
        fs.readdirSync(path).forEach(function(file,index){
          assert.ok(file.indexOf('create_user2'));
        });

        done();
      });
    });
  });
});
