const { checkTokenAccess } = require('./checkTokenAccess');

function getPredicao(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sqlPredicao = `SELECT * from predicao where status=true`
      client.query(sqlPredicao).then(res => {
        let predicao = res.rows;

        client.end();
        resolve(predicao)
      }).catch(err => {
        client.end();
        reject(err)
      })
    });
  });
}

function getPredicoesCampanha(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sqlPredicao = `select pr.nome, pr.id, count(*)
                            from eventos e
                            inner join predicao pr on e.id_predicao = pr.id
                            inner join (
                            select max(id) as id_evento, id_pessoa_receptor
                            from eventos  
                            where id_status_evento in (3,7)
                            and id_resp_motivo = 7
                            and CASE  WHEN id_evento_pai is null then id else id_evento_pai end 
                              in ( select id from eventos where id_campanha = ${req.query.id_campanha}
                                      and id_evento_pai is null  
                                and date(dt_criou) between '${req.query.dtInicial}' and '${req.query.dtFinal}')
                            and  CASE  WHEN id_evento_pai is null then id else id_evento_pai end not in ( select id_evento_pai  
                                            from eventos 
                                            where id_evento_pai is not null and id_resp_motivo in (8,9) )
                            group by id_pessoa_receptor) mx on e.id = mx.id_evento
                            group by pr.nome, pr.id
                            order by pr.id`

      client.query(sqlPredicao).then(res => {
        let predicao = res.rows;

        client.end();
        resolve(predicao)
      }).catch(err => {
        client.end();
        reject(err)
      })
    });
  });
}

module.exports = { getPredicao, getPredicoesCampanha }