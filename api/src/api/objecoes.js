const { checkTokenAccess } = require('./checkTokenAccess');

function getObjecoes(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sqlObjecao = `SELECT * from objecoes where status=true`
      client.query(sqlObjecao).then(res => {
        let objecao = res.rows;

        client.end();
        resolve(objecao)
      }).catch(err => {
        client.end();
        reject(err)
      })
    });
  });
}

module.exports = { getObjecoes }