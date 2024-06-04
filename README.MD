# mysql-migrations

## Table of contents
 - [Prerequisites](#prerequisites)
 - [Install](#install)
 - [Setup](#setup)
 - [Adding Migrations](#adding-migrations)
 - [Executing Migrations](#executing-migrations)
 - [Logging](#logging)

## Prerequisites
A node project with [mysql](https://github.com/mysqljs/mysql) used for database.

## Install
It can be installed using npm.

```bash
npm install mysql-migrations
```

## Setup
1. Create a directory where you wish to maintain all your migrations. We call it `migrations`.
2. Instantiate mysql-migrations by passing a mysql pool and the migrations directory path.

```js
# migration.js
var mysql = require('mysql');
var migration = require('mysql-migrations');

var connection = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'your_database'
});

migration.init(connection, __dirname + '/migrations');
```

### Advanced Setup
If you want to execute something at the end of any migration, you can add third parameter as callback function. Example:

```js
# migration.js
var mysql = require('mysql');
var migration = require('mysql-migrations');

var connection = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'your_database'
});

migration.init(connection, __dirname + '/migrations', function() {
  console.log("finished running migrations");
});
```

## Adding Migrations

### Initiate a migration
Run

```bash
node migration.js add migration create_table_users
```

Now open the migrations folder. Locate the newest file with greatest timestamp as it predecessor. The file will have the name which was specified in the command such as `12213545345_create_table_users.js`

### Add migrations
Write the query in `up` key of the json created for the forward migration. As a part of good practice, also write the script to rollback the migration in `down` key. Ex.

```js
module.exports = {
    "up": "CREATE TABLE users (user_id INT NOT NULL, UNIQUE KEY user_id (user_id), name TEXT )",
    "down": "DROP TABLE users"
}
```

### Add seed
Run
```bash
node migration.js add seed create_table_users
```
to add a seed.

```js
module.exports = {
    "up": "UPDATE users SET name = 'John Snow' WHERE name = ''",
    "down": "UPDATE users SET name = '' WHERE name = 'John Snow'"
}
```

### Initate and Add migration in single command

Run
```bash
node migration.js add migration create_table_users "CREATE TABLE mysql_migrations_347ertt3e (user_id INT NOT NULL, UNIQUE KEY user_id (user_id) )"
```
Locate the newest file with greatest timestamp as it predecessor and open it. Query will be automatically added as `up` key. However `down` key needs to be filled manually.

### Custom migrations
You may initiate the migration file and add a function.

```js
module.exports = {
  'up' :  function (conn, cb) {
    conn.query ("UPDATE users set name = 'alen'", function (err, res) {
      cb();
    });
  },
  'down' : ""
}
```

### Custom templates
You may specify a custom template file as an option.

```js
migration.init(
  connection,
  __dirname + '/migrations',
  function() {},
  [
    "--template migration_template.js"
  ]
);
```

Use the `${{ args.up }}` tag to indicate where the `up` content passed on the command line should be placed.

```js
module.exports = {
  'up' :  function (conn, cb) {
    conn.query ("${{ args.up }}", function (err, res) {
      cb();
    });
  },
  'down' : ""
}
```

## Executing Migrations
There are few ways to run migrations.

1. Run `node migration.js up`. Runs all the pending `up` migrations.
2. Run `node migration.js up 2`. Runs 2 pending `up` migrations from the last position.
3. Run `node migration.js down`. Runs only 1 `down` migrations.
4. Run `node migration.js refresh`. Runs all down migrations followed by all up.

Example Output:

```bash
UP: "CREATE TABLE users2 (user_id INT NOT NULL, UNIQUE KEY user_id (user_id), name TEXT )"
UP: "CREATE TABLE users (user_id INT NOT NULL, UNIQUE KEY user_id (user_id), name TEXT )"
UP: "CREATE TABLE users1 (user_id INT NOT NULL, UNIQUE KEY user_id (user_id), name TEXT )"
No more "UP" migrations to run
```

### Execute anonymous migrations
At times, few migrations need to run again or anonymously. There could be variety of reasons old migrations need to be executed or rollbacked. It can be done this way by specifying the complete file name, or the timestamp alone.

**Up migration**
```bash
node migration.js run 1500891087394_create_table_users.js up
node migration.js run 1500891087394 up
```

**Down migration**
```bash
node migration.js run 1500891087394_create_table_users.js down
node migration.js run 1500891087394 down
```

## Executing backdated migrations
Suppose there are few migrations which were merged late into the main branch. Technically, they should not run because they are old migrations and should already have been run, but it happens that someone has been working on a branch for long and once merged into master, the older migrations do not work because the latest migration timestamp is greater. There is a flag which can help in running those migrations. There are two ways:
1. Single Run
```bash
node migration.js up --migrate-all
```
2. For all runs, you can configure in the init part itself.
```js
# migration.js
var mysql = require('mysql');
var migration = require('mysql-migrations');

var connection = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'your_database'
});

migration.init(connection, __dirname + '/migrations', function() {}, ["--migrate-all"]);
```
and then run migrations normally

```bash
node migration.js up
```

## Saving Schema and Loading from Schema
Having schema.sql is good because it will help you review the schema changes in PR itself. The schema is stored in migrations folder under the file name `schema.sql`. There are two ways to generate schema.
1. Single Run
```bash
node migration.js up --update-schema
```
2. For all runs, you can configure in the init part itself.
```js
# migration.js
var mysql = require('mysql');
var migration = require('mysql-migrations');

var connection = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'your_database'
});

migration.init(connection, __dirname + '/migrations', function() {}, ["--update-schema"]);
```
and then run migrations normally

```bash
node migration.js up
node migration.js down 2
```

Updated Schema will be stored in migrations folder after each run.

### Loading Directly from Schema
Suppose you setup your project and you want to avoid running the entire migrations and simply want to load it from schema generated in the above process. You can do it via:

```bash
node migration.js load-from-schema
```

The above command will create all the tables and make entry in the logs table. It is helpful when setting up projects for newbies or environments without running entire migration process.

## Saving Data and Loading from Data
Having `data.sql` is good because it will help you review the data changes in the PR itself. The data is stored in migrations folder under the file name `data.sql`. There are two ways to generate data.
1. Single Run
```bash
node migration.js up --update-data
```
2. For all runs, you can configure in the init part itself.
```js
# migration.js
var mysql = require('mysql');
var migration = require('mysql-migrations');

var connection = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'your_database'
});

migration.init(connection, __dirname + '/migrations', function() {}, ["--update-data"]);
```
and then run migrations normally

```bash
node migration.js up
node migration.js down 2
```

Updated Data will be stored in migrations folder after each run.
### Loading Directly from Data
Suppose you setup your project and you want to avoid running the entire migrations and simply want to load it from data generated in the above process. You can do it via:

```bash
node migration.js load-from-data
```

The above command will populate all the tables except the logs table. It is helpful when setting up projects for newbies or environments without running entire migration process.

### Combining Schema and Data

#### Updating
Via command line:

```bash
node migration.js up --update-schema --update-data
```
For all runs:
```js
# migration.js
var mysql = require('mysql');
var migration = require('mysql-migrations');

var connection = mysql.createPool({
  connectionLimit : 10,
  host     : 'localhost',
  user     : 'root',
  password : 'password',
  database : 'your_database'
});

migration.init(
  connection,
  __dirname + '/migrations',
  function() {}, 
  [
    "--update-schema",
    "--update-data"
  ]
);
```
#### Loading

Make sure you load the schema first before loading data.

```bash
node migration.js load-from-schema
node migration.js load-from-data
```

## Logging

### Custom Logging

By default, logging is done with `console`. You may specify your own logger with the following methods: `debug`, `log`, `info`, `warn`, `error`, and `critical`. Each one expects a string argument as a message.

```js
var customLogger = {
  debug: function (message) {
    console.debug(message);
  },
  log: function (message) {
    console.log(message);
  },
  info: function (message) {
    console.info(message);
  },
  warn: function (message) {
    console.warn(message);
  },
  error: function (message) {
    console.error(message);
  },
  critical: function (message) {
    console.error(message);
  }
};

migration.init(
  connection,
  __dirname + '/migrations',
  function() {},
  [
    "--logger",
    customLogger
  ]
);
```

### Logging Threshold

The logs can be fairly verbose. You can adjust the `--log-level <threshold>` according to the logs that you want to see.

| Threshold | Logs |
| --- | --- |
| ALL | CRITICAL, ERROR, WARN, INFO, LOG, DEBUG |
| DEBUG | CRITICAL, ERROR, WARN, INFO, LOG, DEBUG |
| LOG | CRITICAL, ERROR, WARN, INFO, LOG |
| INFO | CRITICAL, ERROR, WARN, INFO |
| WARN | CRITICAL, ERROR, WARN |
| ERROR | CRITICAL, ERROR |
| CRITICAL | CRITICAL |
| NONE | *(nothing/silent)* |

```js
migration.init(
  connection,
  __dirname + '/migrations',
  function() {},
  [
    "--log-level ERROR"
  ]
);
```

NOTE: The `--log-level` option is not evaluated before calling methods on custom loggers specified via the `--logger` option.

## Pending
>>Test cases: Will pick up when I get time.

## Help and Support
Will be more than happy to improve upon this version. This is an over night build and needs to be improved certainly. Will welcome everyone who wants to contribute.

## Credits and other stuff
It is my first contribution to npm and I am sort of happy over it. I made this when I was really looking for a suitable tool with barebone settings allowing me to maintain database structure. I could not find a basic one and hence wrote my own and finally decided to publish. It took me around 2 hours to write the first version which barely works. But it still does my job.

>>Credits to my parents.

### Forked

The original repository [kawadhiya21/mysql-migrations](https://github.com/kawadhiya21/mysql-migrations) appears to be abandoned. The library has been forked to resolve a few of my own issues as well as those submitted by others. Enjoy.
