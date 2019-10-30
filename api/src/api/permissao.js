const { executaSQL } = require('./executaSQL');


function getPermissoes(req, res){
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };
      let sql = `select *
                  from permissoes_recursos
                  where status ` 
      executaSQL(credenciais, sql)
        .then(res => {
            resolve(res);
        })
        .catch(err => {
          reject(err)
        })
    })
  }



  module.exports = { getPermissoes }
