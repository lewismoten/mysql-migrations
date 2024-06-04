var poolManager = require('./poolManager.js');
var fs = require('fs');
var config = require('../config.js');
var logger = require('../logger');

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file, index) {
      var curPath = path + "/" + file;
      if (!fs.lstatSync(curPath).isDirectory()) {
        fs.unlinkSync(curPath);
      }
    });
  } else {
    fs.mkdirSync(path);
  }
}

module.exports = function (cb) {
  config.template = undefined;
  config.logLevel = 'ERROR';
  config.logger = logger;

  const pool = poolManager.newPool();

  pool.getConnection(function (err, connection) {
    if (err) {
      throw err;
    }

    connection.query(`

DROP TABLE IF EXISTS user1;
DROP TABLE IF EXISTS user2;
DROP TABLE IF EXISTS user3;
DROP TABLE IF EXISTS user4;
DROP TABLE IF EXISTS user5;
DROP TABLE IF EXISTS Foo;
CREATE TABLE IF NOT EXISTS \`${config.table}\` (\`timestamp\` varchar(254) NOT NULL UNIQUE);
DELETE FROM \`${config.table}\`;

    `, function (error) {
      pool.end();
      if (error) throw error;
      deleteFolderRecursive(__dirname + '/migrations');
      cb();
    });
  });
}
