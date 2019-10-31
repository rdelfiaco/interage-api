exports.checkTokenAccess = function checkTokenAccess(req) {
  return new Promise(function (resolve, reject) {
    if (!req.query.id_usuario) reject('!id_usuario')
    if (!req.query.token) reject('!token_usuario')

    const dbconnection = require('../config/dbConnection')
    const { Client } = require('pg')

    const client = new Client(dbconnection)

    client.connect()

    let sql = `SELECT id_usuario, token_access from historico_login
                where token_access='${req.query.token}' AND ativo=true`

    client.query(sql)
      .then(res => {
        if (res.rowCount > 0) {
          let historico = res.rows[0];
          client.end();
          if (historico.id_usuario == req.query.id_usuario)
            resolve(historico)
          else reject('Token não compativel');
        }
        client.end();
        reject('Token não é válido')
      }
      )
      .catch(err => {
        client.end();
        console.log(err)
      })
  })
}