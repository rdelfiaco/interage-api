const { executaSQL } = require('./executaSQL')
const { checkTokenAccess } = require('./checkTokenAccess');
const { getUsuarios } = require('./usuario')


function getTarefaPorId(req, res) {
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };
  
      let sql = `select * from motivos where id = ${req.query.id} `
      executaSQL(credenciais, sql)
        .then(res => {
          if (res.length > 0) {
            let tarefa = res;
            resolve(tarefa)
          }
          else reject('Tarefa não encontrada!')
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  function getTarefaPerformance(req, res){
    return new Promise(function (resolve, reject) {

        checkTokenAccess(req).then(historico => {
            getTarefaIndicadores(req).then(tarefaIndicadores => {
                getTarefasPendentes(req).then(tarefasPendentes => {
                    if (!tarefaIndicadores || !tarefasPendentes ){
                        reject('Performance não calculada');
                    }
                    resolve({tarefaIndicadores, tarefasPendentes
                    });
                }).catch(e => {
                reject(e);
                });
            }).catch(e => {
                reject(e);
            });
        }).catch(e => {
          reject(e);
        });
    })
  };

  function getTarefaIndicadores(req, res){
    return new Promise(function (resolve, reject) {

        checkTokenAccess(req).then(historico => {
            let credenciais = {
                token: req.query.token,
                idUsuario: req.query.id_usuario
              };

            let sql = `select avg(dt_resolvido - dt_para_exibir)::text as tmr
            , max(dt_resolvido - dt_para_exibir)::text as mat
            , min(dt_resolvido - dt_para_exibir)::text as met
            from eventos 
            where id_motivo = ${req.query.id}
            and id_status_evento in (3,7)
            and date(dt_resolvido) between date('${req.query.dataInicial}') and date('${req.query.dataFinal}') `
            
            executaSQL(credenciais, sql)
            .then(res => {
              if (res) {
                let indicadores = res;
                resolve(indicadores)
              }
              else resolve('Sem indicadores para o periodo')
            })
            .catch(err => {
              reject(err)
            })
      }).catch(e => {
      reject(e)
    })
  })
}

function getTarefasPendentes(req, res){
    return new Promise(function (resolve, reject) {

        checkTokenAccess(req).then(historico => {
            let credenciais = {
                token: req.query.token,
                idUsuario: req.query.id_usuario
              };

            let sql = `select *
            from view_eventos 
            where id_motivo = ${req.query.id}
            and id_status_evento in (1,4)`
            executaSQL(credenciais, sql)
            .then(res => {
              if (res) {
                let indicadores = res;
                resolve(indicadores)
              }
              else reject('Não tem tarefa pendente')
            })
            .catch(err => {
              reject(err)
            })
      }).catch(e => {
      reject(e)
    })
  })
}



  module.exports = { 
      getTarefaPorId, getTarefaPerformance, getTarefaIndicadores, getTarefasPendentes

  }
