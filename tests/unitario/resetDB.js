exec = require('child_process').exec

function resetDb(callback) {
  exec('psql -h localhost -d testdb_altis -U postgres -p 5432 -a -q -f ./resetDb.sql', function (err) {
    if (err !== null) {
      console.log('exec error: ' + err);
    }
    callback(err);
  });
}

function createDb(callback) {
  exec('psql -h localhost -d testdb_altis -U postgres -p 5432 -a -q -f ./createDb.sql', function (err) {
    if (err !== null) {
      console.log('exec error: ' + err);
    }
    callback(err);
  });
}

module.exports = { resetDb, createDb }