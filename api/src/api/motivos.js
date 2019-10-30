const { executaSQL } = require('./executaSQL');
const { executaSQLComTransacao } = require('./executaSQL');
const { getCanais } = require('./canais'); 
const { awaitSQL } = require('./shared');
const { getQuestionarios } = require('./questionarios');
const { getPrioridade } = require('./prioridade')
const { getDepartamentos } = require('./departamento')
const { getUsuarios } = require('./usuario')

function getMotivos(req, res){
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };
                                              
      let sql = `SELECT * from motivos ` 

      executaSQL(credenciais, sql)
        .then(res => {
          
            resolve(res)
        })
        .catch(err => {
          reject(err)
        })
  });
};

function crudMotivos(req, res){
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

// divide o objeto em atuais e anteriores 
  let dadosAtuais = JSON.parse(req.query.dadosAtuais);
  const dadosAnteriores =  JSON.parse(req.query.dadosAnteriores);
  const crud = req.query.crud;
  req.query = dadosAtuais;
  //req.query.id_usuario = credenciais.idUsuario;
  let tabela = 'motivos';
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
    let sql = `INSERT INTO motivos(
               status,  nome)
              VALUES ( ${req.query.status},  '${req.query.nome}') RETURNING id;`;
    return sql;
  };
  function sqlDelete(){
    let sql = `DELETE FROM motivos
                WHERE id= ${req.query.id};`;
    return sql;
  };
  function sqlUpdate(){
    let sql = `UPDATE motivos
               SET  status=${req.query.status}, 
                    nome='${req.query.nome}'
              WHERE id= ${req.query.id};`;
    return sql;
  };


});
};

function getCanaisMotivoSeleconado(req, res){
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
      
    let sql = `SELECT c.id::integer, c.nome
                  from motivos_canais mc
                  inner join canais c on mc.id_canal = c.id 
     
                where id_motivo = ${req.query.motivoSelecionado} ` 
    executaSQL(credenciais, sql)
      .then(canaisMotivo => {
        getCanais(req, res) .then(canais => {
          resolve({canaisMotivo: canaisMotivo, canais: canais});

        })
        .catch(err => {
          reject(err)
        });    
      })
      .catch(err => {
        reject(err)
      })
});
};

async function salvarCanaisDoMotivo(req, res){
  let credenciais = {
    token: req.query.token,
    idUsuario: req.query.id_usuario
  };

  let motivoSelecionado = JSON.parse (req.query.motivoSelecionado);
  let canaisDoMotivo = JSON.parse(req.query.canaisDoMotivo);

      // não excluir e nem inserir os motivos e canais que estiferem em campanhas e/ou em eventos. 
    // ou seja onde estiver foreign key não pode excluir e nem inserir. 

    let sqlForeignKey = `
    select distinct mc.id_canal
    from  motivos_canais mc 
    left join campanhas c on mc.id_motivo = c.id_motivo and mc.id_canal = c.id_canal
    left join eventos e on mc.id_motivo = e.id_motivo and mc.id_canal = e.id_canal 
    WHERE (c.id is not null or e.id is not  null  ) and mc.id_motivo = ${motivoSelecionado} 
    `;

    var foreignKey = await awaitSQL(credenciais, sqlForeignKey);
    var vtforeignKey = [];
    (foreignKey || []).forEach(elem =>{
      if (elem.id_canal != null) vtforeignKey.push(elem.id_canal)
    });

  return new Promise(function (resolve, reject) {

    let sqlDelet = `
    delete from motivos_canais
    where motivos_canais in (select mc
                              from motivos_canais as mc 
                              left join campanhas c on mc.id_motivo = c.id_motivo and mc.id_canal = c.id_canal
                              left join eventos e on mc.id_motivo = e.id_motivo and mc.id_canal = e.id_canal 
                              WHERE (c.id is null and e.id is null ) and mc.id_motivo = ${motivoSelecionado} 
                            )` 
    let sqlInsert = ` INSERT INTO public.motivos_canais(
                    id_motivo, id_canal)
            VALUES  `
    let tamanhoSqlInsert = sqlInsert.length -1 ;

    for (i = 0; i <= canaisDoMotivo.length -1 ;  i++ ){
      // verificar se o canal e motivo estão em campanha ou eventos 
      if ((vtforeignKey || []).find(element =>  element == canaisDoMotivo[i]._id ) == undefined )
      {
        sqlInsert =  sqlInsert  + `(${motivoSelecionado}, ${canaisDoMotivo[i]._id}),`
      }
    }
    sqlInsert = sqlInsert.substr(0,  sqlInsert.length -1 ) 
    if (!canaisDoMotivo.length || tamanhoSqlInsert == sqlInsert.length)  sqlInsert = "Select now()" ;

    const dbconnection = require('../config/dbConnection');
    const { Client } = require('pg');
    const client = new Client(dbconnection);
    client.connect();

    client.query('BEGIN').then((res1) => {
        executaSQLComTransacao(credenciais, client, sqlDelet ).then(resDel => {
          executaSQLComTransacao(credenciais, client, sqlInsert). then( resInsert => {
            client.query('COMMIT')
            .then((resp) => { resolve('Canais dos motivo atualizados ') })
            .catch(err => {  reject(err) });
          });
          });
        });
    })
}

function getRespostasMotivoSeleconado(req, res){
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    
    let sql = `select *
              from motivos_respostas
              where id_motivo = ${req.query.idMotivoSelecionado} ` 
    console.log(1,sql)  
    executaSQL(credenciais, sql)
      .then(respostasMotivo => {
        getQuestionarios(req, res)
          .then(questionarios => { 
            getPrioridade(req, res)
            .then(prioridade => {
              resolve({respostasMotivo: respostasMotivo, questionarios: questionarios, prioridade: prioridade });
              })
            .catch(err => {
              reject(err)
            });
          })
          .catch(err => {
            reject(err)
          });
        })
        .catch(err => {
          reject(err)
        });
  });
};


function getMotivosRespostasAutomaticas(req, res){
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
      
    let sql = `select mea.id , id_motivo_resposta, mre.nome as motivo_resposta, 
    mea.id_motivo, mot.nome as motivo,
    mea.id_canal, can.nome as canal,
    mea.id_prioridade, pri.nome as prioridade,
    mea.gera_para as id_tipo_usuario,
    case when mea.gera_para = 1 then 'Usuário fixo'
       when mea.gera_para = 2 then 'Usuário que encerrou evento'
       when mea.gera_para = 3 then 'Usuário que atende o cliente'
       when mea.gera_para = 4 then 'Usuário que criou o evento que está sendo encerrado'
    end as tipo_usuario,
    tipodestino as id_tipo_destino,
    iif(tipodestino = 'O', 'Depatamento', 'Usuário') as tipo_destino,
    iif(tipodestino = 'O', dep.nome, pes.nome) as  destino,
    mea.observacao_origem,
    case when tipodestino = 'O' then dep.id::numeric else pes.id::numeric end  as  id_destino,
    prazo_para_exibir, reagendar 
    from motivos_eventos_automaticos mea
    inner join motivos_respostas mre on mea.id_motivo_resposta = mre.id 
    inner join motivos mot on mea.id_motivo = mot.id 
    inner join canais can on mea.id_canal = can.id 
    inner join prioridade pri on mea.id_prioridade = pri.id 
    left join pessoas pes on mea.id_pessoa_organograma = pes.id and mea.tipodestino = 'P'
    left join organograma dep on mea.id_pessoa_organograma = dep.id and mea.tipodestino = 'O'
    where mea.id_motivo_resposta =  ${req.query.idRespostaSelecionada} ` 
    executaSQL(credenciais, sql)
      .then(eventosAutomaticoMotivo => {
        getMotivos(req, res)
          .then(motivos => { 
            getPrioridade(req, res)
            .then(prioridade => {
              getCanais(req, res)
              .then(canais => {
                getCanaisMotivos(req,res)
                .then( canaisMotivos => { 
                  getDepartamentos(req, res)
                  .then(departamentos => {
                    getUsuarios(req, res)
                    .then(usuarios => {
                      resolve({eventosAutomaticoMotivo: eventosAutomaticoMotivo, 
                          motivos: motivos, prioridade: prioridade,
                          canais: canais, canaisMotivos: canaisMotivos, 
                          departamentos: departamentos, usuarios: usuarios });
                      })
                      .catch(err => {
                        reject(err)
                      });
                      })
                    .catch(err => {
                      reject(err)
                    });
                  })
                  .catch(err => {
                    reject(err)
                  });
                })
              .catch(err => {
                reject(err)
              });
            })
            .catch(err => {
              reject(err)
            });
          })
          .catch(err => {
            reject(err)
          });
        })
        .catch(err => {
          reject(err)
        });
  });
};




function crudRespostasMotivo(req, res){
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    // divide o objeto em atuais e anteriores 
    let dadosAtuais = JSON.parse(req.query.dadosAtuais);
    const dadosAnteriores =  JSON.parse(req.query.dadosAnteriores);
    const crud = req.query.crud;
    req.query = dadosAtuais;
    let tabela = 'motivos_respostas';
    let idTabela = req.query.id;
    let sql = ''
    if (crud == 'C') sql = sqlCreate(); 
    if (crud == 'D') sql = sqlDelete();
    if (crud == 'U') sql = sqlUpdate();
    //console.log('crudRespostasMotivo',sql)
    executaSQL(credenciais, sql).then(res => {
      resolve(res)

    })
    .catch(err => {
      reject(err)
    });
    
    function sqlCreate(){
      let sql = `INSERT INTO motivos_respostas(
        id_motivo, status,  nome,   exige_predicao, exige_observacao,
           exige_objecao, exige_proposta, id_questionario, id_prioridade,
          ordem_listagem, acao_sql, acao_js, tentativas)
                VALUES ( ${req.query.id_motivo}, ${req.query.status},  '${req.query.nome}', ${req.query.exige_predicao}, 
                ${req.query.exige_observacao}, ${req.query.exige_objecao}, ${req.query.exige_proposta}, ${req.query.id_questionario}, ${req.query.id_prioridade},
                ${req.query.ordem_listagem}, '${req.query.acao_sql}', '${req.query.acao_js}', ${req.query.tentativas}
                ) RETURNING id;`;
      return sql;
    };
    function sqlDelete(){
      let sql = `DELETE FROM motivos_respostas
                  WHERE id= ${req.query.id} ;`;
      return sql;
    };
    function sqlUpdate(){
      let sql = `UPDATE motivos_respostas
                 SET  status =${req.query.status}, 
                      nome ='${req.query.nome}',
                      exige_predicao = ${req.query.exige_predicao},
                      exige_observacao = ${req.query.exige_observacao},
                      exige_objecao = ${req.query.exige_objecao},
                      exige_proposta = ${req.query.exige_proposta},
                      id_questionario = ${req.query.id_questionario},
                      id_prioridade = ${req.query.id_prioridade},
                      ordem_listagem = ${req.query.ordem_listagem},
                      acao_sql = '${req.query.acao_sql}',
                      acao_js = '${req.query.acao_js}',
                      tentativas = ${req.query.tentativas}
                      
                WHERE id= ${req.query.id} ;`;
      return sql;
    };
  
  
  });
};



function crudMotivosRespostasAutomaticas(req, res){
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    // divide o objeto em atuais e anteriores 
    let dadosAtuais = JSON.parse(req.query.dadosAtuais);
    const dadosAnteriores =  JSON.parse(req.query.dadosAnteriores);
    const crud = req.query.crud;
    req.query = dadosAtuais;
    let tabela = 'motivos_respostas';
    let idTabela = req.query.id;
    let sql = ''
    if (crud == 'C') sql = sqlCreate(); 
    if (crud == 'D') sql = sqlDelete();
    if (crud == 'U') sql = sqlUpdate();


    executaSQL(credenciais, sql).then(res => {
      resolve(res)

    })
    .catch(err => {
      reject(err)
    });
    
    function sqlCreate(){

      let sql = `INSERT INTO public.motivos_eventos_automaticos(
         id_motivo_resposta, id_motivo, id_canal, 
        gera_para, tipodestino, id_pessoa_organograma, id_prioridade, 
        observacao_origem, prazo_para_exibir, reagendar)
        VALUES ( ${req.query.id_motivo_resposta}, ${req.query.id_motivo}, 
          ${req.query.id_canal}, ${req.query.id_tipo_usuario}, '${req.query.id_tipo_destino}', 
          ${req.query.id_destino}, ${req.query.id_prioridade}, 
          '${req.query.observacao_origem}', ${req.query.prazo_para_exibir}, ${req.query.reagendar}) RETURNING id;`;

      return sql;
    };
    function sqlDelete(){
      let sql = `DELETE FROM motivos_eventos_automaticos
                  WHERE id= ${req.query.id} ;`;
      return sql;
    };
    function sqlUpdate(){
      let sql = `UPDATE motivos_eventos_automaticos
                 SET  
                 id_motivo_resposta =  ${req.query.id_motivo_resposta}, 
                 id_motivo = ${req.query.id_motivo}, 
                 id_canal = ${req.query.id_canal}, 
                 gera_para = ${req.query.id_tipo_usuario}, 
                 tipodestino =  '${req.query.id_tipo_destino}', 
                 id_pessoa_organograma = ${req.query.id_destino}, 
                 id_prioridade = ${req.query.id_prioridade}, 
                 observacao_origem = '${req.query.observacao_origem}', 
                 prazo_para_exibir = ${req.query.prazo_para_exibir}, 
                 reagendar = ${req.query.reagendar}
                      
                WHERE id= ${req.query.id} ;`;
      return sql;
    };
  
  
  });
};


function getCanaisMotivos(req, res){
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
      
    let sql = `SELECT * from motivos_canais ` 
    executaSQL(credenciais, sql)
      .then(resp => {
          resolve(resp);
      })
      .catch(err => {
        reject(err)
      })
});
};



module.exports = { 
                    getMotivos, 
                    crudMotivos, 
                    getCanaisMotivoSeleconado, 
                    salvarCanaisDoMotivo, 
                    getRespostasMotivoSeleconado,
                    crudRespostasMotivo,
                    getMotivosRespostasAutomaticas,
                    crudMotivosRespostasAutomaticas,
                    getCanaisMotivos }