const { executaSQL } = require('./executaSQL')


function getRanks(req, res){
    return new Promise(function (resolve, reject) {
      getProspeccao(req).then(prospeccao => {
        getPropostasEmitidas(req).then(propostasEmitidas => {
          getProspeccaoSolicitouProposta(req).then(ProspeccaoSolicitouProposta => {
              if (!prospeccao || !propostasEmitidas || !ProspeccaoSolicitouProposta)
                reject('Filtro não pode ser elaborado ');
      
              resolve({ prospeccao, propostasEmitidas, ProspeccaoSolicitouProposta });
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
  }


  function getProspeccao(req, res){
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };
      let sql = `select mr.nome as resposta_motivo, u.login as consultor , u.color_r, u.color_g, u.color_b, count(e.*) as total
                 from motivos_respostas mr
                 inner join usuarios u on u.status and id_organograma = 4 and responsavel_membro = 'M'
                 left join eventos e on u.id_pessoa = e.id_pessoa_resolveu 
                      and mr.id = e.id_resp_motivo 
                      and e.id_status_evento in (3,7)
                      and date(dt_resolvido) between date('${req.query.dataInicial}') and date('${req.query.dataFinal}')
                  where mr.id_motivo = 1 and mr.status 
                  group by mr.nome, u.login, u.color_r, u.color_g, u.color_b
                  order by mr.nome, u.login`
      executaSQL(credenciais, sql)
        .then(res => {
          if (res.length > 0) {
            resolve( res )
          }
          else resolve( 0 )
        })
        .catch(err => {
          reject(err)
        })
    })
  }



  function getPropostasEmitidas(req, res){
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };
      let sql = `select  sp.nome as status_proposta , u.login as consultor,  u.color_r, u.color_g, u.color_b, coalesce( tot.total, 0)   as total
                  from  status_proposta sp
                      left join usuarios u on u.status and id_organograma = 4 and responsavel_membro = 'M'
                      left join (select id_status_proposta, id_usuario, count(*) as total
                      from propostas
                      where date(dtsalvou) between date('${req.query.dataInicial}') and date('${req.query.dataFinal}')
                      group by id_status_proposta, id_usuario) tot on sp.id = tot.id_status_proposta and u.id = tot.id_usuario
                      where sp.status
                  order by sp.nome, u.login`
      executaSQL(credenciais, sql)
        .then(res => {
          if (res.length > 0) {
            resolve( res )
          }
          else resolve( 0 )
        })
        .catch(err => {
          reject(err)
        })
    })
  }


  function getProspeccaoSolicitouProposta(req, res){
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };
      let sql = `select  mr.nome as resposta_motivo, u.login as consultor , count(e.*) as total
                  from motivos_respostas mr
                  inner join usuarios u on u.status and id_organograma = 4 and responsavel_membro = 'M'
                  left join eventos e on u.id_pessoa = e.id_pessoa_resolveu 
                        and mr.id = e.id_resp_motivo 
                        and e.id_status_evento in (3,7)
                        and date(dt_resolvido)= date(now()) 
                    where mr.id_motivo = 1 and mr.status and mr.id = 8
                    group by mr.nome, u.login, u.color_r, u.color_g, u.color_b
                    order by mr.nome, u.login`
      executaSQL(credenciais, sql)
        .then(res => {
          if (res.length > 0) {
            resolve( res )
          }
          else resolve( 0 )
        })
        .catch(err => {
          reject(err)
        })
    })
  }


module.exports = {  getRanks };
