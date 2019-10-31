exports.checkToken = function checkToken(token, idUsuario) {
    return new Promise(function (resolve, reject) {
      if (!idUsuario) reject('!id_usuario')
      if (!token) reject('!token_usuario')
  
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')
  
      const client = new Client(dbconnection)
  
      client.connect()
  
      let sql = `SELECT id_usuario, token_access from historico_login
                  where token_access='${token}' AND ativo=true`
  
      client.query(sql)
        .then(res => {
          if (res.rowCount > 0) {
            let historico = res.rows[0];
            client.end();
            if (historico.id_usuario == idUsuario)
              resolve(historico)
            else reject('Token não compativel');
          }
          client.end();
          reject('Token não é válido')
        }
        )
        .catch(err => {
          client.end();
        })
    })
  }