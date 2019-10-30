const { executaSQL } = require('./executaSQL')


function getSQLs(req, res) {
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.idUsuarioLogado
      };
      
      let sql = `select id,nome, sql from sql_exportar where status`
      
      executaSQL(credenciais, sql)
        .then(res => {
          if (res) {
            let sqls = res;
            resolve(sqls)
          }
          else reject('Não há SQL!')
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  function getResultadoSQLs(req, res) {
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.idUsuarioLogado
      };
      
      let sql = req.query.sql
      
      if (req.query.dataInicial) sql = sql.replace('${dataInicial}', `${req.query.dataInicial}`)
      if (req.query.dataFinal) sql = sql.replace('${dataFinal}', `${req.query.dataFinal}`)
      if (req.query.idRegistro) sql = sql.replace('${idRegistro}', `${req.query.idRegistro}`)
      if (req.query.filtros) sql = sql.replace('${filtros}', `${req.query.filtros}`)
      sql = sql.replace('${idUsuario}',`${req.query.idUsuarioLogado}`)

      executaSQL(credenciais, sql)
        .then(res => {
          if (res) {
            let sqls = res;
            resolve(sqls)
          } 
          else reject(' há SQL!')
        })
        .catch(err => {
          reject(err)
        })
    })
  }


  function getSQL(req, res) {
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.idUsuarioLogado
      };

      let sql = `Select sql from sql_exportar where id = ${req.query.idSql}`
      
      executaSQL(credenciais, sql)
        .then(res => {
          if (res) {
            req.query.sql = res[0].sql
            getResultadoSQLs(req, res)
              .then(res => {
                resolve(res)
              })
              .catch(err => {reject(err)})

          }
          else reject(' há SQL!')
        })
        .catch(err => {
          reject(err)
        })
    })



  }


  module.exports = {getSQLs, getResultadoSQLs, getSQL}