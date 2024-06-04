var mysql = require('mysql');

const newPool = () => mysql.createPool({
  connectionLimit: 30,
  host: 'localhost',
  user: 'test_mig',
  password: 'your_password_here',
  database: 'test_mig',
  multipleStatements: true,
  connectTimeout: 1000
});

module.exports = {
  newPool
};