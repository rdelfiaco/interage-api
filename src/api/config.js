const { executaSQL } = require('./executaSQL')

function getConfiguracao(req, res) {
  return new Promise(function (resolve, reject) {

    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `select valor from interage_parametros where
                   nome_parametro = '${req.query.nomeConfiguracao}'`

    executaSQL(credenciais, sql)
      .then(res => {
        if (res) {
          let eventos = res;
          resolve(eventos)
        }
        else {
          reject(0)
        }
      })
      .catch(err => {
        reject(`Erro no getConfiguração : ${err}`)
      })
  })
}

module.exports = {
  getConfiguracao
}