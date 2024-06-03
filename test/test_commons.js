var mysql = require('./mysql');
var fs = require('fs');
var config = require('../config.js');
var logger = require('../logger');

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if (!fs.lstatSync(curPath).isDirectory()) {
        fs.unlinkSync(curPath);
      }
    });
  } else {
    fs.mkdirSync(path);
  }
}

module.exports = function(cb) {
  config.template = undefined;
  config.logLevel = 'ALL';
  config.logger = logger;
  mysql.getConnection(function (err, connection) {
    if (err) {
      throw err;
    }

    connection.query("DROP TABLE IF EXISTS user1", function (error) {
      if (error) throw error;
      connection.query("DROP TABLE IF EXISTS user2", function (error) {
        if (error) throw error;
        connection.query("DROP TABLE IF EXISTS user3", function (error) {
          if (error) throw error;
          connection.query("DROP TABLE IF EXISTS user4", function (error) {
            if (error) throw error;
            connection.query("DROP TABLE IF EXISTS user5", function (error) {
              if (error) throw error;
              connection.query("CREATE TABLE IF NOT EXISTS `" + config.table + "` (`timestamp` varchar(254) NOT NULL UNIQUE)", function (error, results) {
                if (error) throw error;
                connection.query(`delete from ${config.table}`, function (error) {
                  if (error) throw error;
                  deleteFolderRecursive(__dirname + '/migrations');
                  cb();
                });
              })
            });
          });
        });
      });
    });
  });
}
