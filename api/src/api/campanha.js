const {
  checkTokenAccess
} = require('./checkTokenAccess');
const {
  getPredicoesCampanha
} = require('./predicao');
const {
  getMetaPessoa
} = require('./metaLigacoes');
const {
  executaSQL
} = require('./executaSQL');
const {
  executaSQLComTransacao
} = require('./executaSQL');

function sqlEventosPaiDaCampanha(req) {

  let sqlEventosPaiDaCampanha = `select id from eventos 
  where id_campanha = ${req.query.idCampanha} 
  and date(dt_criou) = date('${req.query.dtCriou}')
  and id_evento_pai is null`

  return sqlEventosPaiDaCampanha

}

function getCampanhasDoUsuario(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const {
        Client
      } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `SELECT * FROM campanhas_usuarios
									INNER JOIN campanhas ON campanhas_usuarios.id_campanha=campanhas.id
									WHERE campanhas_usuarios.id_usuario='${historico.id_usuario}'`

      client.query(sql)
        .then(res => {
          getMetaPessoa(req).then(metaPessoa => {
            if (res.rowCount > 0 && metaPessoa) {
              let campanhas = res.rows;

              client.end();
              resolve({
                campanhas,
                metaPessoa
              })
            } else {
              client.end();
              reject('Campanha não encontrada')
            }
          }).catch(err => {
            client.end();
            reject(err)
          })
        }).catch(err => {
          client.end();
          reject(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}

function getCampanhas(req, res) {
  return new Promise(function (resolve, reject) {

    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    let sql = `select c.*, ca.nome as canal, q.nome as questionario, m.nome as motivo
                from campanhas c
                inner join canais ca on c.id_canal = ca.id
                left  join questionarios q on c.id_questionario = q.id
                inner join motivos m on c.id_motivo = m.id `

    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err)
      })
  })
}


function getCampanhaAnalisar(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      getCampanhaProspects(req).then(campanhaProspects => {
        getCampanhaTentando(req).then(campanhaTentando => {
          getPredicoesCampanha(req).then(campanhaPredicoes => {
            getCampanhaResultado(req).then(campanhaResultado => {
              getTotalLigacoesCampanha(req).then(totalLigacoesCampanha => {
                if (!campanhaProspects || !campanhaTentando || !campanhaPredicoes ||
                  !campanhaResultado || !totalLigacoesCampanha) reject('Campanha sem retorno');

                resolve({
                  campanhaProspects,
                  campanhaTentando,
                  campanhaPredicoes,
                  campanhaResultado,
                  totalLigacoesCampanha
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
    })
  })
}



function getCampanhaProspects(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const {
        Client
      } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select count(*) as prospects from eventos 
						where id_campanha = ${req.query.id_campanha} 
						and date(dt_criou) between '${req.query.dtInicial}' and '${req.query.dtFinal}'
						and id_evento_pai is null`

      client.query(sql)
        .then(res => {
          if (res.rowCount > 0) {
            let registros = res.rows;

            client.end();
            resolve(registros)
          }
          reject('prospects não encontrados')
        })
        .catch(err => {
          client.end();
          console.log(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}

function getCampanhaTentando(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const {
        Client
      } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select tentativas, CASE  WHEN tentativas = 0 THEN count(*) else count(tentativas) end  as qtde
      from ( select id_pessoa_receptor, count(*) as tentativas
              from eventos  
              where id_status_evento in (3,7)
             and CASE  WHEN id_evento_pai is null then id else id_evento_pai end 
                          in ( select id from eventos where id_campanha = ${req.query.id_campanha}
                                                              and id_evento_pai is null  
                              and date(dt_criou) 
                              between '${req.query.dtInicial}' and '${req.query.dtFinal}' )
             group by id_pessoa_receptor
             union
             select id_pessoa_receptor,  0 as tentativas
                     from eventos  
                     where id_evento_pai is null and id_status_evento in (1,4)
                                  and  id_campanha = 5 and id_evento_pai is null 
                and date(dt_criou) between '${req.query.dtInicial}' and '${req.query.dtFinal}' 
             group by id_pessoa_receptor) a
       group by tentativas
       order by tentativas`



      client.query(sql)
        .then(res => {
          if (res.rowCount > 0) {
            let registros = res.rows;

            client.end();
            resolve(registros)
          }
          reject('Campanha tentando não encontrados')
        })
        .catch(err => {
          client.end();
          console.log(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}

function getCampanhaResultado(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const {
        Client
      } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select '1' as id  ,'Comprou' as descricao, count(*) as qdte
                    from eventos 
                  where id_campanha = ${req.query.id_campanha}
                    and date(dt_criou) between '${req.query.dtInicial}' and '${req.query.dtFinal}'
                  and id_resp_motivo = 8
                union 
                select  '2' as id ,'Não comprou' as descricao, count(*) as qdte
                    from eventos 
                  where id_campanha = ${req.query.id_campanha}
                    and date(dt_criou) between '${req.query.dtInicial}' and '${req.query.dtFinal}'
                  and id_resp_motivo = 9
                union	
                select  '3' as id , 'Ligações excedidas' as descricao, count(*) as qdte 
                    from eventos 
                  where id_campanha = ${req.query.id_campanha}
                    and date(dt_criou) between '${req.query.dtInicial}' and '${req.query.dtFinal}'
                  and excedeu_tentativas 	
                
                order by id`



      client.query(sql)
        .then(res => {
          if (res.rowCount > 0) {
            let registros = res.rows;
            client.end();
            resolve(registros)
          } else
            reject('Campanha resultado não encontrados')
          client.end();
        })
        .catch(err => {
          client.end();
          console.log(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}

function getEventosRelatorioCampanha(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const {
        Client
      } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select *
      from view_eventos 
      where id_status_evento in (3,7)
      and id_campanha = ${req.query.id_campanha}`

      client.query(sql)
        .then(res => {
          if (res.rowCount > 0) {
            let eventos = res.rows;
            client.end();
            resolve(eventos)
          } else {
            reject('Não há eventos!')
            client.end();
          }
        })
        .catch(err => {
          client.end();
          reject(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}

function getTotalLigacoesCampanha(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const {
        Client
      } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `select count(*) as total_ligacoes
                  from eventos e
                  inner join usuarios u on e.id_pessoa_resolveu = u.id_pessoa
                  where id_status_evento in (3,7)
                  and id_canal = 3
                  and u.id_organograma = 4
                  and date(dt_resolvido) between date('${req.query.dtInicial}') and date('${req.query.dtFinal}')
                  and e.id_campanha = ${req.query.id_campanha}`

      client.query(sql)
        .then(res => {
          if (res.rowCount > 0) {
            let eventos = res.rows;
            client.end();
            resolve(eventos)
          } else {
            reject('Não há eventos!')
            client.end();
          }
        })
        .catch(err => {
          client.end();
          reject(err)
        })
    }).catch(e => {
      reject(e)
    })
  })
}

function getCampanhasTelemarketingAtivas(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.idUsuarioLogado
    };

    // let sql = `select e.id_campanha,  ROW_NUMBER() OVER (ORDER BY nome) AS sequencia,
    //           ca.nome || ' - inseridos ' || count(e.*) || ' clientes em: ' || to_char(date(e.dt_criou), 'DD/MM/YYYY')  as nome_completo, 
    //           ca.nome, date(e.dt_criou) as dt_criou, count(e.*) as tot_inseridos 
    //           from eventos e
    //           inner join campanhas ca on e.id_campanha = ca.id
    //           where e.id_evento_pai is null 
    //           and e.id_campanha is not null 
    //           and ca.id_canal = 3
    //           group by e.id_campanha, ca.nome, date(e.dt_criou)
    //           order by ca.nome, date(e.dt_criou)`

    let sql = `
    select camp.id, camp.nome, inseridos
    , COALESCE(pendentes, 0) as pendentes
, COALESCE(contatando, 0) as contatando
    , COALESCE(conc.concluidos, 0) as concluidos
, COALESCE(propostas, 0 ) as propostas_solicitadas
    , COALESCE(lig.ligacoes_realizadas, 0) as ligacoes_realizadas 
    , iif( COALESCE(conc.concluidos, 0) <> 0 , round( cast(COALESCE(lig.ligacoes_realizadas, 0)as Numeric(10,2)) / cast(conc.concluidos as Numeric(10,2)),2)  , 0)  as media_ligacoes_por_cliente_concluidos
    , dt_primeira_ligacao
    , dt_ultima_ligacao
    from campanhas camp
    inner join	(select e.id_campanha, count(*) as inseridos
    from eventos e
    inner join (select id_campanha, id_pessoa_receptor, max(id) as id_evento
                  from eventos where id_campanha is not null 
          group by id_campanha, id_pessoa_receptor) ult_e on e.id = ult_e. id_evento 
      group by e.id_campanha ) inser on camp.id = inser.id_campanha				
  
left join ( select e.id_campanha,  count(*) as pendentes 
  from eventos e
  inner join  (select id_campanha, id_pessoa_receptor, max(id) as id_evento
                  from eventos where id_campanha is not null 
          group by id_campanha, id_pessoa_receptor) ult_e on e.id = ult_e. id_evento 
  where id_status_evento in (1, 4, 5, 6) and id_evento_pai is null 
  group by e.id_campanha ) pend on camp.id = pend.id_campanha

left join ( select e.id_campanha,  count(*) as contatando 
  from eventos e
  inner join  (select id_campanha, id_pessoa_receptor, max(id) as id_evento
                  from eventos where id_campanha is not null 
          group by id_campanha, id_pessoa_receptor) ult_e on e.id = ult_e. id_evento 
  where id_status_evento in (1, 4, 5, 6) and id_evento_pai is not null 
  group by e.id_campanha ) contat on camp.id = contat.id_campanha


    left join ( select e.id_campanha, count(*) as concluidos 
                from eventos e
            inner join (select id_campanha, id_pessoa_receptor, max(id) as id_evento
                    from eventos 
                    where id_campanha is not null
                      group by id_campanha, id_pessoa_receptor
                  ) ult_ev on e.id = ult_ev.id_evento
              where e.id_status_evento in (3, 7)
              group by e.id_campanha) conc on camp.id = conc.id_campanha 
    left join ( select id_campanha, count(*) as ligacoes_realizadas
                , min(date(dt_resolvido)) as dt_primeira_ligacao
                , max(date(dt_resolvido)) as dt_ultima_ligacao
            from eventos e
            where id_status_evento in (3,7)
            and id_campanha is not null
and id_canal in (3)
            group by id_campanha) lig on camp.id = lig.id_campanha	
left join ( select id_campanha, count(*) as propostas 
    from eventos e 
      where id_resp_motivo = 8
      group by id_campanha) prop on camp.id = prop.id_campanha  
      where camp.status 
    order by camp.nome		
                `

    executaSQL(credenciais, sql)
      .then(res => {
        if (res) {
          resolve(res);
        } else resolve({
          total_registros: 0
        });
      })
      .catch(err => {
        reject(err)
      })
  })

}

function getCampanhaTelemarketingAnalisar(req, res) {
  return new Promise(function (resolve, reject) {
    checkTokenAccess(req).then(historico => {
      getClientesPendentes(req).then(clientesPendentes => {
        getLigacoesRealizadas(req).then(ligacoesRealizadas => {
          getClientesConcluidos(req).then(clientesConcluidos => {
            if (!clientesPendentes || !ligacoesRealizadas || !clientesConcluidos) reject('Campanha de telemarketing sem retorno');

            resolve({
              clientesPendentes,
              ligacoesRealizadas,
              clientesConcluidos
            });
          }).catch(e => {
            reject(e);
          })
        }).catch(e => {
          reject(e);
        })
      }).catch(e => {
        reject(e);
      })
    }).catch(e => {
      reject(e)
    })
  })
}

function getClientesConcluidos(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.idUsuarioLogado
    };

    let sql = `select distinct id_pessoa_receptor, cliente from view_eventos 
          where id_campanha = ${req.query.idCampanha}                                      
          and  id_evento_pai is null 
          and date(dt_criou) = date('${req.query.dtCriou}') 
          and id_pessoa_receptor not in(
            select distinct  id_pessoa_receptor from view_eventos 
            where id_campanha = ${req.query.idCampanha} 
            and id_status_evento in (1, 4)                                      
            and ( (id_evento_pai is null and date(dt_criou) = date('${req.query.dtCriou}') )
                or id_evento_pai in (${sqlEventosPaiDaCampanha(req)})
                ) 
            ) order by cliente`

    executaSQL(credenciais, sql)
      .then(res => {
        if (res) {
          let clientesConcluidos = res;
          resolve(clientesConcluidos);
        } else resolve({
          total_registros: 0
        });
      })
      .catch(err => {
        reject(err)
      })
  })
}


function getLigacoesRealizadas(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.idUsuarioLogado
    };

    let sql = `select * from view_eventos 
    where id_campanha = ${req.query.idCampanha} 
    and id_status_evento in (3, 7)                                      
    and ( (id_evento_pai is null and date(dt_criou) = date('${req.query.dtCriou}') )
         or id_evento_pai in (${sqlEventosPaiDaCampanha(req)})
         )
    order by cliente, dt_resolvido    `

    executaSQL(credenciais, sql)
      .then(res => {
        if (res) {
          let ligacoesRealizadas = res;
          resolve(ligacoesRealizadas);
        } else resolve({
          total_registros: 0
        });
      })
      .catch(err => {
        reject(err)
      })
  })
}

function getClientesPendentes(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.idUsuarioLogado
    };

    let sql = `select * from view_eventos 
    where id_campanha = ${req.query.idCampanha} 
    and id_status_evento in (1, 4)                                      
    and ( (id_evento_pai is null and date(dt_criou) = date('${req.query.dtCriou}') )
         or id_evento_pai in (${sqlEventosPaiDaCampanha(req)})
         )
    order by cliente, dt_resolvido`
    executaSQL(credenciais, sql)
      .then(res => {

        if (res) {
          let clientesPendentes = res;
          resolve(clientesPendentes);
        } else resolve({
          total_registros: 0
        });
      })
      .catch(err => {
        reject(err)
      })
  })

}

function getCampanhaFollowDoUsuario(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    let sql = `Select  id_campanha, campanha,  count(*) as qtde
                from view_eventos 
                where id_status_evento in (1,5,4,6)
                and tipodestino = 'P' and id_campanha is not null 
                and id_usuario = ${req.query.id_usuario} 
                group by  id_campanha, campanha
                order by campanha `
    executaSQL(credenciais, sql)
      .then(res => {
        if (res) {
          let clientesPendentes = res;
          resolve(clientesPendentes);
        } else {
          resolve(0)
        }
      })
      .catch(err => {
        reject(err)
      })
  })

}


function getDetalheCampanha(req, res) {
  return new Promise(function (resolve, reject) {

    getDetalheCampanhaStatus(req).then(detalheCampanhaStatus => {
      getDetalheCampanhaConsultor(req).then(detalheCampanhaConsultor => {
        getDetalheCampanhaStatusConsultor(req).then(detalheCampanhaStatusConsultor => {
          getDetalheCampanhaConsultorStatus(req).then(detalheCampanhaConsultorStatus => {
            getQuestRespSintetica(req).then(questRespSintetica => {
              if (!detalheCampanhaStatus || !detalheCampanhaConsultor || !detalheCampanhaStatusConsultor ||
                !detalheCampanhaConsultorStatus || !questRespSintetica
              ) reject('Campanha de telemarketing sem retorno');

              resolve({
                detalheCampanhaStatus,
                detalheCampanhaStatusConsultor,
                detalheCampanhaConsultor,
                detalheCampanhaConsultorStatus,
                questRespSintetica
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
  });
};


function getDetalheCampanhaStatus(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `
        select id_campanha, id_resp_motivo , resposta_motivo as status_ligacao, count(*) as total
          from view_eventos 
          where id_campanha = ${req.query.idCampanha}
          and id_resp_motivo is not null
          and date(dt_resolvido) between date('${req.query.dtInicial}') and date('${req.query.dtFinal}')
          group by id_campanha, id_resp_motivo , resposta_motivo
          order by resposta_motivo
    `
    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err)
      })
  })
}

function getQuestRespSintetica(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `
        select * from view_quest_resp_sintetica
          where id_campanha = ${req.query.idCampanha}
    `
    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err)
      })
  })
}

function getQuestRespAnalitica(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `
        select * from view_quest_resp_analitica
          where id_alternativa in (${req.query.idAlternativa}) or id_pergunta in (${req.query.idAlternativa}) `
    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err)
      })
  })
}


function getDetalheCampanhaConsultor(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `
      select id_campanha, id_pessoa_resolveu, pessoa_resolveu, count(*) as total
        from view_eventos 
        where id_campanha = ${req.query.idCampanha}
        and id_resp_motivo is not null
        and date(dt_resolvido) between date('${req.query.dtInicial}') and date('${req.query.dtFinal}')
        group by id_campanha, id_pessoa_resolveu, pessoa_resolveu
        order by pessoa_resolveu
    `
    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err)
      })
  })
}

function getDetalheCampanhaConsultorStatus(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `
      select id_campanha, id_pessoa_resolveu, pessoa_resolveu, id_resp_motivo , resposta_motivo as status_ligacao, count(*) as total
        from view_eventos 
        where id_campanha = ${req.query.idCampanha}
        and id_resp_motivo is not null
        and date(dt_resolvido) between date('${req.query.dtInicial}') and date('${req.query.dtFinal}')
        group by id_campanha, id_pessoa_resolveu, pessoa_resolveu, id_resp_motivo , resposta_motivo 
        order by pessoa_resolveu,resposta_motivo
    `
    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err)
      })
  })
}

function getDetalheCampanhaStatusConsultor(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `
      select id_campanha, id_resp_motivo , resposta_motivo as status_ligacao, id_pessoa_resolveu, pessoa_resolveu,  count(*) as total
        from view_eventos 
        where id_campanha = ${req.query.idCampanha}
        and id_resp_motivo is not null
        and date(dt_resolvido) between date('${req.query.dtInicial}') and date('${req.query.dtFinal}')
        group by id_campanha, id_resp_motivo , resposta_motivo, id_pessoa_resolveu, pessoa_resolveu 
        order by resposta_motivo,  pessoa_resolveu
    `
    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err)
      })
  })
}


function getCampanhasUsuarioSeleconado(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `SELECT * FROM campanhas_usuarios
    INNER JOIN campanhas ON campanhas_usuarios.id_campanha=campanhas.id
    WHERE campanhas_usuarios.id_usuario=  ${req.query.id} `

    executaSQL(credenciais, sql)
      .then(resCampanhasUsuario => {
        getCampanhas(req, res).then(campanhas => {
            resolve({
              campanhasUsuario: resCampanhasUsuario,
              campanhas: campanhas
            });
          })
          .catch(err => {
            reject(err)
          })
          .catch(err => {
            reject(err)
          })
      })
  })
}


function salvarCampanhasDoUsuario(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let usuarioSelecionado = JSON.parse(req.query.usuarioSelecionado);
    let campanhasDoUsuario = JSON.parse(req.query.campanhasDoUsuario);

    let sqlDelet = `DELETE FROM campanhas_usuarios
    WHERE campanhas_usuarios.id_usuario  =  ${usuarioSelecionado.id} `

    let sqlInsert = ` INSERT INTO public.campanhas_usuarios(
                      id_usuario, id_campanha)
            VALUES  `
    for (i = 0; i <= campanhasDoUsuario.length - 1; i++) {
      sqlInsert = sqlInsert + `(${usuarioSelecionado.id}, ${campanhasDoUsuario[i]._id}),`
    }
    sqlInsert = sqlInsert.substr(0, sqlInsert.length - 1)
    if (!campanhasDoUsuario.length) {
      sqlInsert = "Select now()"
    }


    const dbconnection = require('../config/dbConnection');
    const {
      Client
    } = require('pg');
    const client = new Client(dbconnection);
    client.connect();

    client.query('BEGIN').then((res1) => {
      executaSQLComTransacao(credenciais, client, sqlDelet).then(resDel => {
        executaSQLComTransacao(credenciais, client, sqlInsert).then(resInsert => {
          client.query('COMMIT')
            .then((resp) => {
              resolve({
                resposta: 'Campanhas do usuário atualizadas '
              })
            })
            .catch(err => {
              reject(err)
            });
        });
      });
    });
  })
}

function salvarUsuariosDaCampanha(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let campanhaSelecionada = JSON.parse(req.query.campanhaSelecionada);
    let usuariosDaCampanha = JSON.parse(req.query.usuariosDaCampanha);


    let sqlDelet = `DELETE FROM campanhas_usuarios
      WHERE campanhas_usuarios.id_campanha =  ${campanhaSelecionada.id} `

    let sqlInsert = ` INSERT INTO public.campanhas_usuarios(
                       id_campanha, id_usuario)
              VALUES  `
    for (i = 0; i <= usuariosDaCampanha.length - 1; i++) {
      sqlInsert = sqlInsert + `(${campanhaSelecionada.id}, ${usuariosDaCampanha[i]._id}),`
    }
    sqlInsert = sqlInsert.substr(0, sqlInsert.length - 1)
    if (!usuariosDaCampanha.length) {
      sqlInsert = "Select now()"
    }


    const dbconnection = require('../config/dbConnection');
    const {
      Client
    } = require('pg');
    const client = new Client(dbconnection);
    client.connect();

    client.query('BEGIN').then((res1) => {
      executaSQLComTransacao(credenciais, client, sqlDelet).then(resDel => {
        executaSQLComTransacao(credenciais, client, sqlInsert).then(resInsert => {
          client.query('COMMIT')
            .then((resp) => {
              resolve({
                resposta: 'Campanhas do usuário atualizadas '
              })
            })
            .catch(err => {
              reject(err)
            });
        });
      });
    });
  })
}

function getUsuariosCampanhaSelecionada(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    let campanhaSelecionada = JSON.parse(req.query.campanhaSelecionada);

    let sql = `SELECT * FROM campanhas_usuarios cu
                INNER JOIN usuarios u ON cu.id_usuario = u.id
                INNER JOIN pessoas pe on u.id_pessoa = pe.id 
      WHERE cu.id_campanha =  ${campanhaSelecionada.id} `

    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err)
      })
      .catch(err => {
        reject(err)
      })
  })
}


function crudCampanha(req, res){
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
   const dataPadrão = '01/01/1900'
// divide o objeto em atuais e anteriores 
  let dadosAtuais = JSON.parse(req.query.dadosAtuais);
  const dadosAnteriores =  JSON.parse(req.query.dadosAnteriores);
  const crud = req.query.crud;
  req.query = dadosAtuais;
  //req.query.id_usuario = credenciais.idUsuario;
  let tabela = 'campanhas';
  let idTabela = req.query.id;
  let sql = ''
  if (crud == 'C') sql = sqlCreate(); 
  if (crud == 'D') sql = sqlDelete();
  if (crud == 'U') sql = sqlUpdate();
  executaSQL(credenciais, sql).then(res => {
    // auditoria 
    // if (crud == 'C') idTabela = res[0].id;
    // auditoria(credenciais, tabela, crud , idTabela, dadosAnteriores, dadosAtuais );
    resolve(res)

  })
  .catch(err => {
    reject(err)
  });

  function sqlCreate(){
    let sql = `INSERT INTO campanhas(
      id_canal, nome, descricao, dt_inicio, dt_fim, id_questionario, id_motivo, status)
      VALUES (${!req.query.id_canal ? null : req.query.id_canal},
        '${req.query.nome}',
        '${req.query.descricao}',
         date('${!req.query.dt_inicio ? dataPadrão : req.query.dt_inicio }'),
        date('${!req.query.dt_fim ? dataPadrão : req.query.dt_fim}'),
        ${ !req.query.id_questionario ? null : req.query.id_questionario },
        ${ !req.query.id_motivo ? null : req.query.id_motivo},
        ${req.query.status})
              RETURNING id;`;
    return sql;
  };
  function sqlDelete(){
    let sql = `DELETE FROM campanhas
                WHERE id= ${req.query.id};`;
    return sql;
  };
  function sqlUpdate(){
    let sql = `UPDATE campanhas
               SET  status=${req.query.status}, 
                    nome='${req.query.nome}',
                    descricao='${req.query.descricao}',
                    id_canal=${!req.query.id_canal ? null : req.query.id_canal},
                    id_motivo= ${!req.query.id_motivo ? null : req.query.id_motivo},
                    id_questionario= ${ !req.query.id_questionario ? null : req.query.id_questionario},
                    dt_inicio=date('${!req.query.dt_inicio ? dataPadrão : req.query.dt_inicio}'),
                    dt_fim=date('${!req.query.dt_fim ? dataPadrão : req.query.dt_fim}')
              WHERE id= ${req.query.id};`;
    return sql;
  };


});
};





module.exports = {
  getCampanhasDoUsuario,
  getCampanhas,
  getCampanhaAnalisar,
  getCampanhaResultado,
  getCampanhaFollowDoUsuario,
  getEventosRelatorioCampanha,
  getClientesPendentes,
  getCampanhaTelemarketingAnalisar,
  getCampanhasTelemarketingAtivas,
  getDetalheCampanha,
  getCampanhasUsuarioSeleconado,
  salvarCampanhasDoUsuario,
  getUsuariosCampanhaSelecionada,
  getQuestRespSintetica,
  salvarUsuariosDaCampanha,
  getQuestRespAnalitica,
  crudCampanha
}