const { executaSQL } = require('./executaSQL');


function getPrioridade(req, res) {
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };
  
      let sql = `select * from prioridade  `
      executaSQL(credenciais, sql)
        .then(res => {
          if (res.length > 0) {
            let propostas = res;
            resolve(propostas)
          }
          else reject('prioridade não encontrada!')
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  module.exports = { getPrioridade }