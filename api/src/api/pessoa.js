const { checkTokenAccess } = require('./checkTokenAccess');
const { executaSQL } = require('./executaSQL');
const { buscaValorDoAtributo } = require( './shared');
const { auditoria } = require('./auditoria');





function getPessoaPorCPFCNPJ(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    req.query.cpf_cnpj = req.query.cpf_cnpj.replace(/\W/gi, '');
    let sql = `SELECT * FROM pessoas WHERE cpf_cnpj = '${req.query.cpf_cnpj}'`
    executaSQL(credenciais, sql).then(res => {
        resolve(res)
    })
    .catch(err => {
      reject(err)
    });
  });
};

function getTipoRelacionamentos(req, res){
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    let sql = `select * from  view_tipo_relacionamentos`
    executaSQL(credenciais, sql).then(res => {
        resolve(res)
    })
    .catch(err => {
      reject(err)
    });
  });
};

function crudRelacionamento(req, res){
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    // divide o objeto em atuais e anteriores 
    const dadosAtuais = JSON.parse(req.query.dadosAtuais);
    const dadosAnteriores =  JSON.parse(req.query.dadosAnteriores);
    const crud = req.query.crud;
    req.query = {...dadosAtuais};
    req.query.id_usuario = credenciais.idUsuario;
    let sql = ''
    if (crud == 'C') {
       sql = sqlCreate(); 
       executaSQL(credenciais, sql).then(res => {
            resolve(res)
        })
        .catch(err => {
          reject(err)
        });
    }
    if (crud != 'C'){
        sql = `delete from pessoas_relacionamentos where id = ${dadosAnteriores.relacionamentoId}`
          // excluir o existente e incluir um novo 
            executaSQL(credenciais, sql).then(res => {
            sql = sqlCreate();
            if (crud == 'U'){
                executaSQL(credenciais, sql).then(res => {
                  resolve(res)
                  })
                  .catch(err => {
                    reject(err)
                  });
            }
            resolve(res);
          })
          .catch(err => {
            reject(err)
          });
        };
    





    function sqlCreate(){
      let sql = `INSERT INTO public.pessoas_relacionamentos(
        id_pessoa_referencia, id_tipo_relacionamentos_referencia, 
        id_pessoa_referenciada, id_tipo_relacionamentos_referenciada )
        VALUES (${req.query.pessoaReferenciaId} , ${req.query.tipoRelacionamentos}
          , ${req.query.pessoaReferenciadaId} , ${req.query.tipoRelacionamentosVolta});`;
      return sql
      }


  });
};

function getPessoa(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    if (req.query.id_pessoa != '[object Object]' ){
      let sql = `SELECT * FROM pessoas WHERE id=${req.query.id_pessoa}`
      executaSQL(credenciais, sql).then(res => {
        var enderecos = {};
        var telefones = {};
        if (res.length > 0) {
          var pessoa = res[0];
          getTelefones(req).then(resTelefones => {
            getEnderecos(req).then(resEndereco => {
              getRelacionamentos(req).then(resRelacionamento => {
                getLeadsMiling(req).then(resLeadsMiling => {
                  getAuditoria(req).then(respAuditoria => {
                    if (!respAuditoria) { auditoria_ = {} ;
                    }else auditoria_ = respAuditoria;
                    if (!resLeadsMiling) { leadsMilings = {} ;
                    }else leadsMilings = resLeadsMiling;
                    if (!resRelacionamento) { relacionamento = {} ;
                    }else relacionamentos = resRelacionamento;
                    if (!resTelefones) { telefones = {} ;
                    }else telefones = resTelefones;
                    if (!resEndereco) {enderecos = {}
                    }else enderecos = resEndereco;
                    resolve({ principal: pessoa, enderecos, telefones, relacionamentos, leadsMilings, auditoria_ })
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
          })
         // resolve({ principal: pessoa[0], enderecos, telefones })
        }
        else resolve({});
      })
      .catch(err => {
        reject(err)
      })
    }             
              
  });
}
function getEnderecos(req) {
  return new Promise((resolve, reject) => {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    let sqlEnderecos = `SELECT 
                        pessoas_enderecos.id,
                        pessoas_enderecos.id_pessoa,
                        pessoas_enderecos.id_cidade,
                        pessoas_enderecos.cep,
                        pessoas_enderecos.logradouro, 
                        pessoas_enderecos.bairro,
                        pessoas_enderecos.complemento,
                        pessoas_enderecos.recebe_correspondencia,
                        pessoas_enderecos.status,
                        cidades.nome,
                        cidades.uf_cidade
                        FROM pessoas_enderecos
                        LEFT JOIN cidades ON pessoas_enderecos.id_cidade=cidades.id
                        WHERE id_pessoa=${req.query.id_pessoa}
                        ORDER BY recebe_correspondencia DESC`
  executaSQL(credenciais, sqlEnderecos).then(res => {
              resolve(res);
            }).catch(err => {
              reject(err)
            })
  })
}

function getTelefones(req) {
  return new Promise((resolve, reject) => {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    let sqlTelefones = `SELECT * FROM pessoas_telefones
                        WHERE id_pessoa=${req.query.id_pessoa}
                        ORDER BY principal DESC`
executaSQL(credenciais, sqlTelefones).then(res => {
  resolve(res);
}).catch(err => {
  reject(err)
  })
})
}

function getRelacionamentos(req) {
  return new Promise((resolve, reject) => {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    let sql = `select * 
                        from view_pessoa_relacionamentos
                        where id_pessoa_referencia = ${req.query.id_pessoa}
                        order by id`
executaSQL(credenciais, sql).then(res => {
  resolve(res);
}).catch(err => {
  reject(err)
  })
})
}

function getLeadsMiling(req) {
  return new Promise((resolve, reject) => {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    let sql = `select p.id as ip_pessoa, lm.*, plm.dtinclusao   
        from pessoas p
        inner join pessoas_leads_mailing plm on p.id = plm.id_pessoa
        inner join leads_mailing lm on plm.id_leads_mailing = lm.id 
        where p.id = ${req.query.id_pessoa} order by lm.nome`
executaSQL(credenciais, sql).then(res => {
  resolve(res);
}).catch(err => {
  reject(err)
  })
})
}

function getAuditoria(req) {
  return new Promise((resolve, reject) => {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    let sql = `select data_hora, p.nome as usuario, campo, 
              iif(operacao = 'U', 'Alterou',  
              iif(operacao = 'C', 'Inseriu', 'Excluiu')) as operacao
              , conteudo_anterior, conteudo_novo 
              from auditoria au 
              inner join auditoria_detalhe aud on au.id = aud.id_auditoria 
              inner join usuarios u on au.id_usuario = u.id
              inner join pessoas p on u.id_pessoa = p.id 
              where au.id_pessoa = ${req.query.id_pessoa}
              order by data_hora desc`
executaSQL(credenciais, sql).then(res => {
  resolve(res);
}).catch(err => {
  reject(err)
  })
})
}


function salvarPessoa(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };

      // divide o objeto em atuais e anteriores 
      const dadosAtuais = JSON.parse(req.query.dadosAtuais);
      const dadosAnteriores =  JSON.parse(req.query.dadosAnteriores);

      console.log(dadosAtuais)
      req.query = {...dadosAtuais};
      req.query.id_usuario = credenciais.idUsuario;

      // trata as variaveis que tem combro que vem com null
      req.query.id_atividade = req.query.id_atividade == 'null' ?  'null':  req.query.id_atividade; 
      req.query.id_pronome_tratamento = req.query.id_pronome_tratamento == 'null' ?  'null':  req.query.id_pronome_tratamento; 

      req.query.datanascimento = req.query.datanascimento == 'Invalid date' ? 'null': req.query.datanascimento;
      req.query.datanascimento = req.query.datanascimento == 'DD/MM/YYYY' ? 'null': req.query.datanascimento;

     // console.log((req.query.datanascimento == 'null' || req.query.datanascimento == ''  ? null : " date('" + req.query.datanascimento + "')" ))

      let update = String;
      client.query('BEGIN').then((res1) => {
          update = `UPDATE pessoas SET
            ${montaCamposUpdatePessoa()},
            dtalteracao=now()
            WHERE pessoas.id=${req.query.id};
            `;
        const tabela = 'pessoas'
        const idTabela = req.query.id
        const idPessoa = req.query.id
        
        update = update.replace(/'null'/g, null)
        update = update.replace(/'`'/g, ' ')

        console.log(update)
       client.query(update).then((res) => {
          client.query('COMMIT').then((resposta) => {
            client.end();
            // auditoria 
            auditoria(credenciais, tabela, 'U', idTabela, idPessoa, dadosAnteriores, dadosAtuais );
            resolve(resposta);
          }).catch(err => {
            client.end();
            reject(err)
          })
        }).catch(e => {
          client.query('ROLLBACK').then((resposta) => {
            client.end();
            reject(e)
          }).catch(err => {
            client.end();
            reject(err)
          })
        })

        function montaCamposUpdatePessoa() {
          let ret = [];
          ret.push("nome='" + req.query.nome + "'")
          ret.push("tipo='" + req.query.tipo + "'")
          ret.push('id_pronome_tratamento=' + (req.query.id_pronome_tratamento != 'null' || req.query.id_pronome_tratamento != '' ? "'" + req.query.id_pronome_tratamento + "'" : null))
          ret.push('apelido_fantasia=' + (req.query.apelido_fantasia != 'null' || req.query.apelido_fantasia != '' ? "'" + req.query.apelido_fantasia + "'" : null))
          ret.push('sexo=' + (req.query.sexo != 'null' || req.query.sexo != ''  ? "'" + req.query.sexo + "'" : null))
          ret.push('datanascimento=' + (req.query.datanascimento == 'null' || req.query.datanascimento == ''  ? null : " date('" + req.query.datanascimento + "')" ))
          ret.push('rg_ie=' + (req.query.rg_ie != 'null' || req.query.rg_ie != '' ? "'" + req.query.rg_ie + "'" : null))
          ret.push('orgaoemissor=' + (req.query.orgaoemissor != 'null' || req.query.orgaoemissor != '' ? "'" + req.query.orgaoemissor + "'" : null))
          ret.push('cpf_cnpj=' + (req.query.cpf_cnpj != 'null' || req.query.cpf_cnpj != ''  ? "'" + req.query.cpf_cnpj + "'" : null))
          ret.push('cnh=' + (req.query.cnh != 'null' || req.query.cnh != ''  ? "'" + req.query.cnh + "'" : null))
          ret.push('cnh_validade=' + (req.query.cnh_validade == 'null' || req.query.cnh_validade == ''  ? null : " date('" + req.query.cnh_validade + "')" ))
          ret.push('cnh_categoria=' + (req.query.cnh_categoria != 'null' || req.query.cnh_categoria != ''  ? "'" + req.query.cnh_categoria + "'" : null))
          ret.push('email=' + (req.query.email != 'null' || req.query.email != '' ? "'" + req.query.email + "'" : null))
          ret.push('website=' + (req.query.website != 'null' || req.query.website != '' ? "'" + req.query.website + "'" : null))
          ret.push('id_atividade=' + (req.query.id_atividade != 'null' || req.query.id_atividade != '' ? "'" + req.query.id_atividade + "'" : null))
          ret.push('observacoes=' + (req.query.observacoes != 'null' || req.query.observacoes != '' ? "'" + req.query.observacoes + "'" : null))
          ret.push('id_tipo_cliente=' + (req.query.id_tipo_cliente != 'null' || req.query.id_tipo_cliente != '' ? "'" + req.query.id_tipo_cliente + "'" : null))
          ret.push('id_classificacao_cliente=' + (req.query.id_classificacao_cliente != 'null' || req.query.id_classificacao_cliente != '' ? "'" + req.query.id_classificacao_cliente + "'" : null))
         
          return ret.join(', ');
        }


      }).catch(err => {
        client.end();
        reject(err)
      })
    }).catch(e => {
      reject(e);
    });
  });

}

async function  adicionarPessoa(req, res) {

  let credenciais = {
    token: req.query.token,
    idUsuario: req.query.id_usuario
  };
  var possui_carteira_cli = await buscaValorDoAtributo(credenciais, 'possui_carteira_cli', 'usuarios', `id = ${req.query.id_usuario}` );
  possui_carteira_cli = Object.values( possui_carteira_cli[0])[0];

  return new Promise(function (resolve, reject) {    
    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)
      
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };
      // divide o objeto em atuais e anteriores 
      const dadosAtuais = JSON.parse(req.query.dadosAtuais);
      const dadosAnteriores =  JSON.parse(req.query.dadosAnteriores);

      req.query = {...dadosAtuais} ;
      req.query.id_usuario = credenciais.idUsuario;

      client.connect()
      // trata as variaveis que tem combro que vem com null
      req.query.id_atividade = req.query.id_atividade == 'null' ?  '':  req.query.id_atividade; 
      req.query.id_pronome_tratamento = req.query.id_pronome_tratamento == 'null' ?  '':  req.query.id_pronome_tratamento; 

      req.query.datanascimento = req.query.datanascimento == 'Invalid date' ? 'null': req.query.datanascimento;
      req.query.datanascimento = req.query.datanascimento == 'DD/MM/YYYY' ? 'null': req.query.datanascimento;

      let update;
      if (req.query.tipo == 'F') {
        let pessoaFisica = montaCamposUpdatePessoaFisica()
        update = `INSERT INTO pessoas ${pessoaFisica} RETURNING id`;
      }
      else if (req.query.tipo == 'J') {
        let pessoaJuridica = montaCamposUpdatePessoaJuridica()
        update = `INSERT INTO pessoas ${pessoaJuridica} RETURNING id`
      }
     
      update = update.replace(/'null'/g, null)
      update = update.replace(/'`'/g, ' ')
      client.query(update).then((res) => {
        client.end();
        auditoria(credenciais, 'pessoas', 'C', res.rows[0].id, res.rows[0].id, dadosAnteriores, dadosAtuais );
        resolve(res.rows[0])
      }).catch(e => {
        client.end();
        reject(e)
      })

      function montaCamposUpdatePessoaFisica() {
        let ret = [];
        ret.push("(")
        ret.push("nome,")
        ret.push("tipo,")
        ret.push('id_pronome_tratamento,')
        ret.push('sexo,')
        ret.push('datanascimento,')
        ret.push('rg_ie,')
        ret.push('orgaoemissor,')
        ret.push('cpf_cnpj,')
        ret.push('cnh,')
        ret.push('cnh_validade,')
        ret.push('cnh_categoria,')
        ret.push('email,')
        ret.push('website,')
        ret.push('observacoes,')
        ret.push('apelido_fantasia,')
        ret.push('dtinclusao,')
        ret.push('dtalteracao,')
        ret.push('id_usuario_incluiu,')
        ret.push('id_usuario_carteira,')
        ret.push('id_tipo_cliente,')
        ret.push('id_classificacao_cliente,')
        ret.push('id_atividade')

        ret.push(')')

        ret.push('VALUES(')

        ret.push("'" + req.query.nome + "',")
        ret.push("'" + req.query.tipo + "',")
        ret.push((req.query.id_pronome_tratamento != '' ? "'" + req.query.id_pronome_tratamento + "'" : 'NULL') + ",")
        ret.push((req.query.sexo != '' ? "'" + req.query.sexo + "'" : 'NULL') + ",")
        ret.push((req.query.datanascimento == 'null' || req.query.datanascimento == ''  ? 'NULL': " date('" + req.query.datanascimento + "')" ) + ",")
        ret.push((req.query.rg_ie != '' ? "'" + req.query.rg_ie + "'" : 'NULL') + ",")
        ret.push((req.query.orgaoemissor != '' ? "'" + req.query.orgaoemissor + "'" : 'NULL') + ",")
        ret.push((req.query.cpf_cnpj != '' ? "'" + req.query.cpf_cnpj + "'" : 'NULL') + ",")
        ret.push((req.query.cnh != '' ? "'" + req.query.cnh + "'" : 'NULL') + ",")
        ret.push((req.query.cnh_validade == 'null' || req.query.cnh_validade == ''  ? 'NULL': " date('" + req.query.cnh_validade + "')" ) + ",")
        ret.push((req.query.cnh_categoria != '' ? "'" + req.query.cnh_categoria + "'" : 'NULL') + ",")
        ret.push((req.query.email != '' ? "'" + req.query.email + "'" : 'NULL') + ",")
        ret.push((req.query.website != '' ? "'" + req.query.website + "'" : 'NULL') + ",")
        ret.push((req.query.observacoes != '' ? "'" + req.query.observacoes + "'" : 'NULL') + ",")
        ret.push((req.query.apelido_fantasia != null ? "'" + req.query.apelido_fantasia + "'" : 'NULL') + ",")
        ret.push('now(),')
        ret.push('now(),')
        ret.push(req.query.id_usuario + ",")
        ret.push(possui_carteira_cli ? req.query.id_usuario: 'NULL'+ ",")
        ret.push((req.query.id_tipo_cliente != '' ? "'" + req.query.id_tipo_cliente + "'" : 'NULL') + ",")
        ret.push((req.query.id_classificacao_cliente != '' ? "'" + req.query.id_classificacao_cliente + "'" : 'NULL')+ "," )
        ret.push((req.query.id_atividade != 'null' || req.query.id_atividade != '' ? "'" + req.query.id_atividade + "'" : null))

        ret.push(')')
        return ret.join(' ');
      }

      function montaCamposUpdatePessoaJuridica() {
        let ret = [];
        ret.push("(")
        ret.push("nome,")
        ret.push("tipo,")
        ret.push('id_pronome_tratamento,')
        ret.push('sexo,')
        ret.push('rg_ie,')
        ret.push('orgaoemissor,')
        ret.push('cpf_cnpj,')
        ret.push('cnh,')
        ret.push('email,')
        ret.push('website,')
        ret.push('observacoes,')
        ret.push('apelido_fantasia,')
        ret.push('dtinclusao,')
        ret.push('dtalteracao,')
        ret.push('id_usuario_incluiu,')
        ret.push('id_usuario_carteira,')
        ret.push('id_tipo_cliente,')
        ret.push('id_classificacao_cliente,')
        ret.push('datanascimento,')
        ret.push('id_atividade')
        ret.push(')')
        ret.push('VALUES(')

        ret.push("'" + req.query.nome + "',")
        ret.push("'" + req.query.tipo + "',")
        ret.push((req.query.id_pronome_tratamento != '' ? "'" + req.query.id_pronome_tratamento + "'" : 'NULL' ) + ",")
        ret.push((req.query.sexo != '' ? "'" + req.query.sexo + "'" : 'NULL') + ",")
        ret.push((req.query.rg_ie != '' ? "'" + req.query.rg_ie + "'" : 'NULL') + ",")
        ret.push((req.query.orgaoemissor != '' ? "'" + req.query.orgaoemissor + "'" : 'NULL') + ",")
        ret.push((req.query.cpf_cnpj != '' ? "'" + req.query.cpf_cnpj + "'" : 'NULL') + ",")
        ret.push((req.query.cnh != '' ? "'" + req.query.cnh + "'" : 'NULL') + ",")
        ret.push((req.query.email != '' ? "'" + req.query.email + "'" : 'NULL') + ",")
        ret.push((req.query.website != '' ? "'" + req.query.website + "'" : 'NULL') + ",")
        ret.push((req.query.observacoes != '' ? "'" + req.query.observacoes + "'" : 'NULL') + ",")
        ret.push((req.query.apelido_fantasia != '' ? "'" + req.query.apelido_fantasia + "'" : 'NULL') + ",")
        ret.push('now(),')
        ret.push('now(),')
        ret.push(req.query.id_usuario + ",")
        ret.push((possui_carteira_cli ? req.query.id_usuario: 'NULL') + ",")
        ret.push((req.query.id_tipo_cliente != '' ? "'" + req.query.id_tipo_cliente + "'" : 'NULL') + ",")
        ret.push((req.query.id_classificacao_cliente != '' ? "'" + req.query.id_classificacao_cliente + "'" : 'NULL')+ ",")
        ret.push((req.query.datanascimento == 'null' || req.query.datanascimento == ''  ? 'NULL': " date('" + req.query.datanascimento + "')" )+ ",")
        ret.push((req.query.id_atividade != 'null' || req.query.id_atividade != '' ? "'" + req.query.id_atividade + "'" : null))

        ret.push(')')
        return ret.join(' ');
      }
    }).catch(e => {
      reject(e);
    });
  });

}

function getTipoTelefone(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()
      let sql = `SELECT * FROM tipo_telefone`

      client.query(sql)
        .then(res => {
          if (res.rowCount > 0) {
            let tipo_telefone = res.rows;

            client.end();
            resolve(tipo_telefone)
          }
          reject('Erro ao buscar tipos de telefones')
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

function salvarTelefonePessoa(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };

      // divide o objeto em atuais e anteriores 
      const dadosAtuais = JSON.parse(req.query.dadosAtuais);
      const dadosAnteriores =  JSON.parse(req.query.dadosAnteriores);
      let operacao = 'U';

      req.query = {...dadosAtuais} 

      client.connect()

      let update;
      client.query('BEGIN').then(() => {
        const buscaTelefone = `SELECT * FROM pessoas_telefones WHERE pessoas_telefones.id_pessoa = ${req.query.id_pessoa}`

        client.query(buscaTelefone).then((telefonesPessoa) => {
          let principal = req.query.principal;
          if (!telefonesPessoa.rowCount) principal = true
          if (req.query.id){
            update = `UPDATE pessoas_telefones SET
                      ddd='${req.query.ddd}',
                      telefone='${req.query.telefone}',
                      ramal=${req.query.ramal || null},
                      principal=${principal},
                      id_tipo_telefone=${req.query.id_tipo_telefone},
                      contato='${req.query.contato}',
                      ddi=55,
                      dtalteracao=now()
                      WHERE pessoas_telefones.id=${req.query.id}`;}
          else{
            operacao = 'C'
            update = `INSERT INTO pessoas_telefones(
            id_pessoa, ddd, telefone, ramal, principal, id_tipo_telefone, contato, ddi,dtalteracao)
            VALUES('${req.query.id_pessoa}',
                  '${req.query.ddd}',
                  '${req.query.telefone}',
                  ${req.query.ramal || null},
                  ${principal},
                  ${req.query.id_tipo_telefone},
                  '${req.query.contato}',
                  '55', now())`;}
          client.query(update).then((res) => {
            client.query('COMMIT').then((resposta) => {
              client.end();
              auditoria(credenciais,'telefones',operacao,req.query.id, req.query.id_pessoa, dadosAnteriores, dadosAtuais);
              resolve(resposta)
            }).catch(err => {
              client.end();
              reject(err)
            })
          }).catch(e => {
            client.query('ROLLBACK').then((resposta) => {
              client.end();
              reject(e)
            }).catch(err => {
              client.end();
              reject(err)
            })
          })

        }).catch(err => {
          client.end();
          reject(err)
        })
      }).catch(err => {
        client.end();
        reject(err)
      })

    }).catch(e => {
      reject(e);
    });
  })
}

async function editaTelefonePrincipal(req, res) {
  let credenciais = {
    token: req.query.token,
    idUsuario: req.query.id_usuario
  };
      // busca o telefone que era principal e o que será 
      var idTelefoneAnt = await buscaValorDoAtributo(credenciais, 'id', 'pessoas_telefones', `id_pessoa=${req.query.id_pessoa} and  principal` );
       idTelefoneAnt = Object.values( idTelefoneAnt[0])[0];
      var telefoneAnt = await buscaValorDoAtributo(credenciais, 'telefone', 'pessoas_telefones', `id = ${idTelefoneAnt}`);
      telefoneAnt = Object.values( telefoneAnt[0])[0];
      var dddAnt = await buscaValorDoAtributo(credenciais, 'ddd', 'pessoas_telefones', `id = ${idTelefoneAnt}`);
      dddAnt = Object.values( dddAnt[0])[0];
      var telefoneAlterado = await buscaValorDoAtributo(credenciais, 'telefone', 'pessoas_telefones', `id=${req.query.id_telefone}`);
      telefoneAlterado = Object.values( telefoneAlterado[0])[0];
      var dddAlterado = await buscaValorDoAtributo(credenciais, 'ddd', 'pessoas_telefones', `id=${req.query.id_telefone}`);
      dddAlterado = Object.values( dddAlterado[0])[0];

      var dadosAnteriores = {
        telefone: telefoneAnt,
        ddd: dddAnt,
        principal: true
      };
      var dadosAtuais = {
        telefone: '',
        ddd: '',
        principal: false
      };

      auditoria(credenciais,'pessoas_telefones','U',idTelefoneAnt,req.query.id_pessoa,dadosAnteriores,dadosAtuais)
      var dadosAnteriores = {
        telefone: '',
        ddd: '',
        principal: false
      };
      var dadosAtuais = {
        telefone: telefoneAlterado,
        ddd: dddAlterado,
        principal: true
      };
      auditoria(credenciais,'pessoas_telefones','U',req.query.id_telefone,req.query.id_pessoa,dadosAnteriores,dadosAtuais)


  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let update;
      client.query('BEGIN').then(() => {
        todosOsOutrosTelefonesFalse = `UPDATE pessoas_telefones SET
                      principal=false
                      WHERE pessoas_telefones.id_pessoa=${req.query.id_pessoa}`;

        client.query(todosOsOutrosTelefonesFalse).then(() => {
          setaNovoTelefonePrincipal = `UPDATE pessoas_telefones SET
                      principal=true
                      WHERE pessoas_telefones.id=${req.query.id_telefone} 
                      AND pessoas_telefones.id_pessoa=${req.query.id_pessoa}`;


          client.query(setaNovoTelefonePrincipal).then(() => {
            client.query('COMMIT').then((resposta) => {
              client.end();
              resolve(resposta)
            }).catch(err => {
              client.end();
              reject(err)
            })
          }).catch(err => {
            client.end();
            reject(err)
          })
        }).catch(e => {
          client.query('ROLLBACK').then((resposta) => {
            client.end();
            reject(e)
          }).catch(err => {
            client.end();
            reject(err)
          })
        })
      }).catch(err => {
        client.end();
        reject(err)
      })
    }).catch(e => {
      reject(e);
    });
  })
}

function editaEnderecoDeCorrespondencia(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let update;
      client.query('BEGIN').then(() => {
        todosOsOutrosEnderecosFalse = `UPDATE pessoas_enderecos SET
                      recebe_correspondencia=false
                      WHERE pessoas_enderecos.id_pessoa=${req.query.id_pessoa} `;

        client.query(todosOsOutrosEnderecosFalse).then(() => {
          setaNovoEnderecoCorrespondencia = `UPDATE pessoas_enderecos SET
                      recebe_correspondencia=true
                      WHERE pessoas_enderecos.id=${req.query.id_endereco} 
                      AND pessoas_enderecos.id_pessoa=${req.query.id_pessoa}`;


          client.query(setaNovoEnderecoCorrespondencia).then(() => {
            client.query('COMMIT').then((resposta) => {
              client.end();
              resolve(resposta)
            }).catch(err => {
              client.end();
              reject(err)
            })
          }).catch(err => {
            client.end();
            reject(err)
          })
        }).catch(e => {
          client.query('ROLLBACK').then((resposta) => {
            client.end();
            reject(e)
          }).catch(err => {
            client.end();
            reject(err)
          })
        })
      }).catch(err => {
        client.end();
        reject(err)
      })
    }).catch(e => {
      reject(e);
    });
  })
}

async function excluirTelefonePessoa(req, res) {

  let credenciais = {
    token: req.query.token,
    idUsuario: req.query.id_usuario
  };
      // busca o telefone que era ecluido 
      var telefoneAlterado = await buscaValorDoAtributo(credenciais, 'telefone', 'pessoas_telefones', `id=${req.query.id_telefone}`);
      telefoneAlterado = Object.values( telefoneAlterado[0])[0];
      var dddAlterado = await buscaValorDoAtributo(credenciais, 'ddd', 'pessoas_telefones', `id=${req.query.id_telefone}`);
      dddAlterado = Object.values( dddAlterado[0])[0];

      var dadosAtuais = {
        telefone: '',
        ddd: '',
        principal: ''
      };
      var dadosAnteriores  = {
        telefone: telefoneAlterado,
        ddd: dddAlterado,
        principal: true
      };
      auditoria(credenciais,'pessoas_telefones','D',req.query.id_telefone,req.query.id_pessoa,dadosAnteriores,dadosAtuais)

  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let del;
      client.query('BEGIN').then((res1) => {
        if (!req.query.id_telefone) return reject('Não tem telefone selecionado')
        del = `DELETE FROM pessoas_telefones
                      WHERE pessoas_telefones.id=${req.query.id_telefone}`;

        client.query(del).then((res) => {
          client.query('COMMIT').then((resposta) => {
            client.end();
            resolve(resposta)
          }).catch(err => {
            client.end();
            reject(err)
          })
        }).catch(e => {
          client.query('ROLLBACK').then((resposta) => {
            client.end();
            reject(e)
          }).catch(err => {
            client.end();
            reject(err)
          })
        })
      }).catch(err => {
        client.end();
        reject(err)
      })
    }).catch(e => {
      reject(e);
    });
  })
}


function salvarEnderecoPessoa(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };      
      let operacao ='I';
      let idTabela = 0;
      // divide o objeto em atuais e anteriores 
      const dadosAtuais = JSON.parse(req.query.dadosAtuais);
      const dadosAnteriores =  JSON.parse(req.query.dadosAnteriores);

      req.query = {...dadosAtuais}    

      let update;
      client.query('BEGIN').then((res1) => {
        const queryCidade = `SELECT * from cidades 
                             WHERE cidades.nome='${req.query.cidade}' AND cidades.uf_cidade='${req.query.uf_cidade.toUpperCase()}'`
        client.query(queryCidade).then((cidade) => {
          if (cidade.rowCount) {
            req.query.id_cidade = cidade.rows[0].id;
            salvaEndereco();
          }
          else {
            insereCidade()
          }
          function insereCidade() {
            insert = `INSERT INTO cidades(
              nome, uf_cidade, status)
              VALUES('${req.query.cidade}',
                    '${req.query.uf_cidade.toUpperCase()}',
                    TRUE
                    ) RETURNING id`;

            client.query(insert).then((res) => {
              req.query.id_cidade = res.rows[0].id
              // para auditoria 
              let atuais = {
                cidade: req.query.cidade,
                uf: req.query.uf_cidade
              };
              let anteriores = {
                cidade: '',
                uf: ''
              }
              auditoria(credenciais,'cidades','C',req.query.id_cidade, req.query.id_pessoa, anteriores,atuais)
              salvaEndereco()
            }).catch(e => {
              reject(e);
            })
          }
          function salvaEndereco() {
            let selectEnderecos = `SELECT * FROM pessoas_enderecos 
                                   WHERE pessoas_enderecos.id_pessoa=${req.query.id_pessoa}`
            client.query(selectEnderecos).then((enderecosPessoas) => {
              let recebe_correspondencia = false;
              if (!enderecosPessoas.rowCount) recebe_correspondencia = true;
              if (req.query.id)
                {
                operacao = 'U';
                idTabela = req.query.id
                update = `UPDATE pessoas_enderecos SET
                      id_cidade=${req.query.id_cidade},
                      cep=${req.query.cep},
                      logradouro='${req.query.logradouro}',
                      bairro='${req.query.bairro}',
                      complemento='${req.query.complemento}',
                      recebe_correspondencia=${req.query.recebe_correspondencia},
                      dtalteracao=now()
                      WHERE pessoas_enderecos.id=${req.query.id}`;
                }
              else
                {update = `INSERT INTO pessoas_enderecos(
                      id_pessoa, id_cidade, cep, logradouro, bairro, complemento, recebe_correspondencia,dtalteracao)
                      VALUES(${req.query.id_pessoa},
                            ${req.query.id_cidade},
                            ${req.query.cep},
                            '${req.query.logradouro}',
                            '${req.query.bairro}',
                            '${req.query.complemento}',
                            '${recebe_correspondencia}',
                            now()
                            ) RETURNING id`;}
              client.query(update).then((res) => {
                if (operacao == 'I') idTabela = res.rows[0].id;
                client.query('COMMIT').then((resposta) => {
                  client.end();
                  auditoria(credenciais,'pessoas_enderecos',operacao,idTabela,req.query.id_pessoa,dadosAnteriores,dadosAtuais)
                  resolve(resposta)
                }).catch(err => {
                  client.end();
                  reject(err)
                })
              }).catch(e => {
                client.query('ROLLBACK').then((resposta) => {
                  client.end();
                  reject(e)
                }).catch(err => {
                  client.end();
                  reject(err)
                })
              })
            })
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
      reject(e);
    });
  })
}

function excluirEnderecoPessoa(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let del;
      client.query('BEGIN').then((res1) => {
        if (!req.query.id_endereco) return reject('Não tem endereço selecionado')
        del = `DELETE FROM pessoas_enderecos
                      WHERE pessoas_enderecos.id=${req.query.id_endereco}`;

        client.query(del).then((res) => {
          client.query('COMMIT').then((resposta) => {
            client.end();
            resolve(resposta)
          }).catch(err => {
            client.end();
            reject(err)
          })
        }).catch(e => {
          client.query('ROLLBACK').then((resposta) => {
            client.end();
            reject(e)
          }).catch(err => {
            client.end();
            reject(err)
          })
        })
      }).catch(err => {
        client.end();
        reject(err)
      })
    }).catch(e => {
      reject(e);
    });
  })
}

async function pesquisaPessoas(req, res) {
  let credenciais = {
    token: req.query.token,
    idUsuario: req.query.id_usuario
  };
  var possui_carteira_cli = await buscaValorDoAtributo(credenciais, 'possui_carteira_cli', 'usuarios', `id = ${req.query.id_usuario}` )
  possui_carteira_cli = Object.values( possui_carteira_cli[0])[0];

  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {

      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      var pesquisaTexto = req.query.searchText.toLowerCase();
      let pesquisaId = pesquisaTexto.substring(3);
      let pesquisa = '';
      if (pesquisaTexto.substring(0,3) == 'id=' ) {
          pesquisa = 'id';
      }
      if (pesquisaTexto.substring(0,4) == 'tel=' ) {
        pesquisaId = pesquisaTexto.substring(4)
        pesquisa = 'tel';
      }
      if (pesquisaTexto.substring(0,4).toUpperCase() == 'DTN=' ) {
        pesquisaId = pesquisaTexto.substring(4)
        pesquisa = 'dtN';
      }
      if (pesquisa == '') {
        //pesquisaTexto = pesquisaTexto.replace(/\W/gi, '');
        pesquisa = `SELECT p.*, up.apelido_fantasia as carteira FROM pessoas p
            left join usuarios u on p.id_usuario_carteira = u.id
            left join pessoas up on u.id_pessoa = up.id 
            WHERE (lower(p.nome) LIKE '%${pesquisaTexto}%' OR
            lower(p.apelido_fantasia)
            LIKE '%${pesquisaTexto}%' OR
            lower(p.cpf_cnpj) LIKE '%${pesquisaTexto}%'  )`
      } else if  (pesquisa == 'id') {
        pesquisa = `SELECT p.*, up.apelido_fantasia as carteira FROM pessoas p
            left join usuarios u on p.id_usuario_carteira = u.id
            left join pessoas up on u.id_pessoa = up.id 
            WHERE p.id=${pesquisaId}
            `
      } else if  (pesquisa == 'tel') {
        pesquisa = `SELECT p.*, up.apelido_fantasia as carteira FROM pessoas p
            inner join pessoas_telefones pt on p.id = pt.id_pessoa
            left join usuarios u on p.id_usuario_carteira = u.id
            left join pessoas up on u.id_pessoa = up.id 
            WHERE cast(pt.telefone as text ) like  '%${pesquisaId}%'
          `
      } else if  (pesquisa == 'dtN') {
        pesquisa = `SELECT p.*, up.apelido_fantasia as carteira FROM pessoas p
            left join usuarios u on p.id_usuario_carteira = u.id
            left join pessoas up on u.id_pessoa = up.id 
            WHERE p.datanascimento = date('${pesquisaId}')
            `
      }

          pesquisa = pesquisa + ` limit 100`
      client.query(pesquisa).then((res) => {
        client.end()
        if (res.rowCount > 0) {
          resolve(res.rows);
        }
        else reject(`Não há pessoas com o texto: ${req.query.searchText}`)
      }).catch(err => {
        client.end();
        reject(`Não há pessoas com o texto: ${req.query.searchText}`)
      })
    }).catch(e => {
      reject(e);
    });
  })
}

function getTratamentoPessoaFisica(req, res) {
  return new Promise(function (resolve, reject) {

    checkTokenAccess(req).then(historico => {
      const dbconnection = require('../config/dbConnection')
      const { Client } = require('pg')

      const client = new Client(dbconnection)

      client.connect()

      let sql = `SELECT * FROM pronome_tratamento WHERE pronome_tratamento.status=true`

      client.query(sql)
        .then(res => {
          let pronome_tratamento = res.rows;

          client.end();
          resolve(pronome_tratamento)
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

function getQuestariosPessoaId(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `
        select * from view_quest_resp_analitica
          where id_receptor = ${req.query.idPessoa}
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

function getQuestRespAnaliticaPessoaId(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `
        select * from view_quest_resp_analitica
          where id_receptor in (${req.query.idPessoa})`
    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err)
      })
  })
}

function getPessoaDadosPrincipais(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `
            select   (select to_char(ddd, 'FM"("99")"') || to_char(telefone,'FM9 0000"-"0000')  from pessoas_telefones pt where p.id = pt.id_pessoa and  principal):: character varying(15) as tel_1
        , (select to_char(ddd, 'FM"("99")"') || to_char(telefone,'FM9 0000"-"0000')  from pessoas_telefones pt where p.id = pt.id_pessoa and not principal order by id desc limit 1 ):: character varying(15) as tel_2
        , p.*
        , to_char(pe.cep , 'FM99"."999"-"999') as cep,pe.logradouro,pe.bairro,pe.complemento
        , ci.nome as cidade, ci.uf_cidade as uf
        , case when p.tipo = 'F' 
              then to_char(TO_NUMBER(cpf_cnpj, '99999999999999999') , 'FM000"."000"."000"-"00')
              else to_char(TO_NUMBER(cpf_cnpj, '99999999999999999'), 'FM00"."000"."000"/"0000"-"00') end as cpf_cnpj_format
        from pessoas p
        inner join pessoas_enderecos pe  on  p.id = pe.id_pessoa and  recebe_correspondencia
        inner join cidades ci on pe.id_cidade = ci.id
        where p.id =  ${req.query.id_pessoa}
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

module.exports = {
  getPessoa,
  salvarPessoa,
  getTipoTelefone,
  salvarTelefonePessoa,
  excluirTelefonePessoa,
  excluirEnderecoPessoa,
  salvarEnderecoPessoa,
  pesquisaPessoas,
  adicionarPessoa,
  editaTelefonePrincipal,
  editaEnderecoDeCorrespondencia,
  getTratamentoPessoaFisica,
  getPessoaPorCPFCNPJ,
  getTipoRelacionamentos,
  crudRelacionamento,
  getQuestariosPessoaId,
  getQuestRespAnaliticaPessoaId,
  getPessoaDadosPrincipais,
}