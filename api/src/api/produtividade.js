const { checkTokenAccess } = require('./checkTokenAccess');

function getProdutividadeCallCenter(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      getEventosPendentesDepartamento(req).then(EventosPendentesDepartamento => {
        getEventosPendentesUsuario(req).then(EventosPendentesUsuario => {
          getEventosTentandoDepartamento(req).then(EventosTentandoDepartamento => {
            getEventosTentandoUsuario(req).then(EventosTentandoUsuario => {
              getEventosPredicaoDepartamento(req).then(EventosPredicaoDepartamento => {
                getEventosPredicaoUsuario(req).then(EventosPredicaoUsuario => {
                  getEventosResultadoDepartamento(req).then(EventosResultadoDepartamento => {
                    getEventosResultadoUsuario(req).then(EventosResultadoUsuario => {
                      getTotalLigacoesDepartamento(req).then(totalLigacoesDepartamento => {
                        getTotalLigacoesUsuario(req).then(totalLigacoesUsuario => {
                          if (!EventosPendentesDepartamento || !EventosPendentesUsuario
                            || !EventosTentandoDepartamento || !EventosTentandoUsuario
                            || !EventosPredicaoDepartamento || !EventosPredicaoUsuario
                            || !EventosResultadoDepartamento || !EventosResultadoUsuario
                            || !totalLigacoesDepartamento || !totalLigacoesUsuario)
                            reject('Produtividade sem retorno');

                          resolve({
                            EventosPendentesDepartamento, EventosPendentesUsuario,
                            EventosTentandoDepartamento, EventosTentandoUsuario,
                            EventosPredicaoDepartamento, EventosPredicaoUsuario,
                            EventosResultadoDepartamento, EventosResultadoUsuario,
                            totalLigacoesDepartamento, totalLigacoesUsuario
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
                  }).catch(e => {
                    reject(e);
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
          }).catch(e => {
            reject(e);
          });
        }).catch(e => {
          reject(e);
        });
      }).catch(e => {
        reject(e);
      });
    }).catch(e => {
      reject(e)
    });
  })
}

function getEventosPendentesDepartamento(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select count(*) as eventos_depatamentos from eventos where id_status_evento in (1,4,5,6) and tipodestino = 'O' and id_pessoa_organograma = 4 `



      client.query(sql)
        .then(res => {
          let registros = res.rows;

          client.end();
          resolve(registros)
        }
        )
        .catch(err => {
          client.end();
          reject(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}

function getEventosPendentesUsuario(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select count(*) as eventos_usuarios from eventos where id_status_evento in (1,4,5,6) 
                  and tipodestino = 'P' and id_pessoa_organograma = ${req.query.id_pessoa_usuario_select} `

      client.query(sql)
        .then(res => {
          let registros = res.rows;

          client.end();
          resolve(registros)
        }
        )
        .catch(err => {
          client.end();
          reject(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}

function getEventosTentandoDepartamento(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select tentativas, CASE  WHEN tentativas = 0 THEN count(*) else sum(tentativas) end  as ligacoes, count(tentativas) as clientes
                    from ( select id_pessoa_receptor, count(*) as tentativas
                            from eventos  
                                where   date(dt_resolvido) between '${req.query.dtInicial}' and '${req.query.dtFinal}' 
                            group by id_pessoa_receptor
			    
                            union

                            select id_pessoa_receptor,  0 as tentativas
                            from eventos  
                                where id_evento_pai is null and id_status_evento in (1,4) 
                                        and tipodestino = 'O' and id_pessoa_organograma = 4 
                            group by id_pessoa_receptor) a
                    group by tentativas
                    order by tentativas `



      client.query(sql)
        .then(res => {
          let registros = res.rows;

          client.end();
          resolve(registros)
        }
        )
        .catch(err => {
          client.end();
          reject(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}

function getEventosTentandoUsuario(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select tentativas, CASE  WHEN tentativas = 0 THEN count(*) else sum(tentativas) end  as ligacoes, count(tentativas) as clientes
                    from ( select id_pessoa_receptor, count(*) as tentativas
                            from eventos  
                                where  id_pessoa_resolveu = ${req.query.id_pessoa_usuario_select} 
                                        and date(dt_resolvido) between '${req.query.dtInicial}' and '${req.query.dtFinal}' 
                            group by id_pessoa_receptor
			    
                            union

                            select id_pessoa_receptor,  0 as tentativas
                            from eventos  
                                where id_evento_pai is null and id_status_evento in (1,4)
                                        and tipodestino = 'P' and id_pessoa_organograma = ${req.query.id_pessoa_usuario_select}  
                            group by id_pessoa_receptor) a
                    group by tentativas
                    order by tentativas `

      client.query(sql)
        .then(res => {
          let registros = res.rows;

          client.end();
          resolve(registros)
        }
        )
        .catch(err => {
          client.end();
          reject(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}


function getEventosPredicaoDepartamento(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select pr.nome, pr.id, count(*)
        from eventos e
        inner join predicao pr on e.id_predicao = pr.id
        inner join (
        select max(id) as id_evento, id_pessoa_receptor
        from eventos  
        where id_status_evento in (3,7)
        and id_resp_motivo = 7
        and CASE  WHEN id_evento_pai is null then id else id_evento_pai end 
          in ( select id from eventos where id_status_evento in (3,7)
                  and id_evento_pai is null  
            and date(dt_resolvido) between '${req.query.dtInicial}'  and '${req.query.dtFinal}' )
        and  CASE  WHEN id_evento_pai is null then id else id_evento_pai end not in ( select id_evento_pai  
                        from eventos 
                        where id_evento_pai is not null and id_resp_motivo in (8,9) )
        group by id_pessoa_receptor) mx on e.id = mx.id_evento
        group by pr.nome, pr.id
        order by pr.id`


      client.query(sql)
        .then(res => {
          let registros = res.rows;

          client.end();
          resolve(registros)
        }
        )
        .catch(err => {
          client.end();
          reject(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}


function getEventosPredicaoUsuario(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select pr.nome, pr.id, count(*)
        from eventos e
        inner join predicao pr on e.id_predicao = pr.id
        inner join (
        select max(id) as id_evento, id_pessoa_receptor
        from eventos  
        where id_status_evento in (3,7)
        and id_resp_motivo = 7
        and id_pessoa_resolveu = ${req.query.id_pessoa_usuario_select} 
        and date(dt_resolvido) between '${req.query.dtInicial}'  and '${req.query.dtFinal}' 
        and  CASE  WHEN id_evento_pai is null then id else id_evento_pai end not in ( select id_evento_pai  
                        from eventos 
                        where id_evento_pai is not null and id_resp_motivo in (8,9) and  excedeu_tentativas = false )
        group by id_pessoa_receptor) mx on e.id = mx.id_evento
        group by pr.nome, pr.id
        order by pr.id`

      
      client.query(sql)
        .then(res => {
          let registros = res.rows;

          client.end();
          resolve(registros)
        }
        )
        .catch(err => {
          client.end();
          reject(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}


function getEventosResultadoDepartamento(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select '1' as id  ,'Comprou' as descricao, count(*) as qdte
                      from eventos 
                    where  date(dt_resolvido) between '${req.query.dtInicial}' and '${req.query.dtFinal}'
                        and id_resp_motivo = 8
                  union 
                  select  '2' as id ,'Não comprou' as descricao, count(*) as qdte
                      from eventos 
                    where  date(dt_resolvido) between '${req.query.dtInicial}' and '${req.query.dtFinal}'
                        and id_resp_motivo = 9
                  union	
                  select  '3' as id , 'Ligações excedidas' as descricao, count(*) as qdte 
                      from eventos 
                    where  date(dt_resolvido) between '${req.query.dtInicial}' and '${req.query.dtFinal}'
                        and excedeu_tentativas 	
                  
                  order by id`

      client.query(sql)
        .then(res => {
          let registros = res.rows;

          client.end();
          resolve(registros)
        }
        )
        .catch(err => {
          client.end();
          reject(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}


function getEventosResultadoUsuario(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select '1' as id  ,'Comprou' as descricao, count(*) as qdte
                      from eventos 
                    where id_pessoa_resolveu = ${req.query.id_pessoa_usuario_select}
                        and date(dt_resolvido) between '${req.query.dtInicial}' and '${req.query.dtFinal}'
                        and id_resp_motivo = 8
                  union 
                  select  '2' as id ,'Não comprou' as descricao, count(*) as qdte
                      from eventos 
                    where  id_pessoa_resolveu = ${req.query.id_pessoa_usuario_select}
                        and date(dt_resolvido) between '${req.query.dtInicial}' and '${req.query.dtFinal}'
                        and id_resp_motivo = 9
                  union	
                  select  '3' as id , 'Ligações excedidas' as descricao, count(*) as qdte 
                      from eventos 
                    where  id_pessoa_resolveu = ${req.query.id_pessoa_usuario_select}
                        and date(dt_resolvido) between '${req.query.dtInicial}' and '${req.query.dtFinal}'
                        and excedeu_tentativas 	
                  
                  order by id`

      client.query(sql)
        .then(res => {
          let registros = res.rows;

          client.end();
          resolve(registros)
        }
        ).catch(err => {
          client.end();
          reject(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}

function getTotalLigacoesDepartamento(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select count(*) as total_ligacoes
                  from eventos e
                  inner join usuarios u on e.id_pessoa_resolveu = u.id_pessoa
                  where id_status_evento in (3,7)
                  and id_canal = 3
                  and u.id_organograma = 4
                  and date(dt_resolvido) between date('${req.query.dtInicial}') and date('${req.query.dtFinal}')`

      client.query(sql)
        .then(res => {
          let registros = res.rows;

          client.end();
          resolve(registros)
        }
        ).catch(err => {
          client.end();
          reject(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}


function getTotalLigacoesUsuario(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select count(*) as total_ligacoes
                  from eventos
                  where id_status_evento in (3,7)
                  and id_canal = 3
                  and date(dt_resolvido) between date('${req.query.dtInicial}') and date('${req.query.dtFinal}')
                  and id_pessoa_resolveu = ${req.query.id_pessoa_usuario_select}`

      client.query(sql)
        .then(res => {
          let registros = res.rows;

          client.end();
          resolve(registros)
        }
        ).catch(err => {
          client.end();
          reject(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}


module.exports = { getProdutividadeCallCenter }