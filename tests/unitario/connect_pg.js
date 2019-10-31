const { Client } = require('pg')

function conectar() {
  let connect = {
    host: 'localhost',
    port: 5432,
    database: 'testdb_altis',
    user: 'postgres',
    password: 'postgres'
  }


  const client = new Client(connect)

  client.connect()
  return client;
}

module.exports = { conectar }