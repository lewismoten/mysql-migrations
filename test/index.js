var migrations = require('../index');
var testCommons = require('./test_commons');
var mysql = require('./mysql');
var assert = require('assert');
var fs = require('fs');
var config = require('../config');

var path = __dirname + '/migrations';

describe('index.js', function () {
  before(function (done) {
    testCommons(done);
  });

  context('init', function () {
    it('reads template option', function (done) {
      var name = __dirname + '/migrations/template_17c2387b-38af-4ef6-bf6f-bb72f68255ff.js';
      fs.writeFileSync(name, 'this is a template', { encoding: 'utf-8' });
      mysql.getConnection(function (err, connection) {
        if (err) throw err;
        migrations.init(
          mysql,
          path,
          function () {
            assert.equal(name, config.template);
            done();
          },
          [
            `--template ${name}`
          ]
        )
      });

    })
  });

});