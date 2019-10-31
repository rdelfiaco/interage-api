const { executaSQL } = require('./executaSQL')
const { iniciaTransacao } = require('./executaSQL')
const { executaSQLComTransacao } = require('./executaSQL')
const { zeroEsquerda, isNumber } = require('./shared')


function importaLead(req, res){
  return new Promise(function (resolve, reject) {

    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let arquivoCSV = JSON.parse( req.query.arquivo);

    const dbconnection = require('../config/dbConnection');
    const { Client } = require('pg');
    const client = new Client(dbconnection);
    client.connect();
    //inicio da transação 
   client.query('BEGIN').then((res1) => {
    // deleta a tabela lead_a_importar
     deletaTabLeadAImportar (credenciais, client).then((resp) => {
      // inseri o lead recebido na tabela lead_a_importar
      insertTabLeadAImportar(credenciais, client, arquivoCSV).then((resp) => {
       // Verificar se o lead existente com cpf_cnpj na tabela de pessoas 
       existeCpfCnpjEmPessoas(credenciais, client).then((resp) => {
        // Incluir os lead não encontrados na tabela de pessoas 
        insertLeadEmPessoas(credenciais, client).then((resp) => {
        // Incluir o nome do lead na tabela de leads_mailing 
          insertLeadsMailing(credenciais, client, arquivoCSV).then((resp) => {
          let id_leads_mailing = Number(resp[0].id)
          // cria  campanha com o mesmo nome do lead 
            insertCampanha(credenciais, client, arquivoCSV).then((resp) => {
              let id_campanha = Number(resp[0].id)
              // alterar o id_leads_mailing e o id_campanha na tabela lead_a_importar
              updateTabLeadAImportar(credenciais, client, id_leads_mailing, id_campanha).then((resp) => {
                // inserir pessoas sem cpf_cnpj 
                insertLeadEmPessoasSemCpfCnpj(credenciais, client).then((resp) => {
                  // inserir dados na tabela pessoas_leads_mailing 
                  insertPessoasLeadsMailing(credenciais, client).then((resp) => {
                    // inserir cidade 
                    insertCidadeEEnderecao(credenciais, client).then((resp) => {
                      // inserir telefone
                      insertTelefone(credenciais, client).then((resp) => {
                        // inserir os usuarios do call center na campanha 
                        //inserirUsuariosCampanha(credenciais, client, id_campanha).then((resp) => {
                          // inserir destinatarios na campanha 
                          inserirDestinatariosCampanha(credenciais, client,id_leads_mailing, id_campanha).then((resp) => {

                          // commit da transação 

                            client.query('COMMIT')
                              .then((resp) => { resolve('Dados importados ') })
                              .catch(err => {  reject(err) });
                            });
                          //});
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });


    }).catch(err => {
      client.query('ROLLBACK').then((resp) => {
        client.end();
        reject('Erro na importação')
        });
    });
});
}

function inserirDestinatariosCampanha(credenciais, client,id_leads_mailing, id_campanha) {
  return new Promise(function (resolve, reject) {

  let sql = `
	INSERT INTO public.eventos(
    id_campanha, id_motivo,id_status_evento, id_pessoa_criou, dt_criou, dt_prevista_resolucao, dt_para_exibir, tipodestino, id_pessoa_organograma, 	id_pessoa_receptor, id_prioridade,  observacao_origem, id_canal)

 select ${id_campanha}, camp.id_motivo,1,1, now(),date(now())+180,now(), 'O', 4, pe.id, 2, li.observacoes, camp.id_canal
 from pessoas pe
 inner join pessoas_leads_mailing plem on pe.id = plem.id_pessoa and id_leads_mailing = ${id_leads_mailing}
 inner join lead_a_importar li on pe.id = li.id_pessoa  
 inner join campanhas camp on camp.id = ${id_campanha}
 `
 console.log(123, sql)
  executaSQLComTransacao (credenciais, client, sql)
  .then(res => { resolve( res ) })
  .catch(err => { reject( err ) })
});
}


function inserirUsuariosCampanha(credenciais, client, id_campanha) {
  return new Promise(function (resolve, reject) {

  let sql = `
            INSERT INTO public.campanhas_usuarios(id_usuario, id_campanha)
            select id, ${id_campanha}
            from usuarios
            where status and id_organograma = 4 
      `
  executaSQLComTransacao (credenciais, client, sql)
  .then(res => { resolve( res ) })
  .catch(err => { reject( err ) })
});
}


function insertTelefone(credenciais, client) {
  return new Promise(function (resolve, reject) {

  let sql = `
        INSERT INTO public.pessoas_telefones(
          id_pessoa, ddd, telefone,  principal, id_tipo_telefone, contato, ddi, dtalteracao)	
          select tpi.id_pessoa, tpi.ddd1, tpi.fone1,
          iif((select count(ptel.*) from pessoas_telefones ptel where ptel.id_pessoa = tpi.id_pessoa and ptel.principal) = 0, 'true', 'false' )::boolean as principal 
          ,  CAST( iif( CAST(SUBSTRING(CAST (fone1 AS text) FROM 1 FOR 1) as integer) < 8, '1', '3') as numeric(1))  as  tipo1, 
        null as contato, 55 as ddi, now()
        from lead_a_importar tpi where tpi.ddd1 <> 0 and ddd1 is not null  
        and fone1 <> 0 and fone1 is not null 
        and not existe_pessoa_telefone(id_pessoa, ddd1, fone1);
      INSERT INTO public.pessoas_telefones(
          id_pessoa, ddd, telefone,  principal, id_tipo_telefone, contato, ddi, dtalteracao)		
        select id_pessoa, ddd2, fone2, false
        , CAST( iif( CAST(SUBSTRING(CAST (fone2 AS text) FROM 1 FOR 1) as integer) < 8, '1', '3') as numeric(1))  as  tipo2
        , null, 55,  now()
        from lead_a_importar where ddd2 <> 0  and ddd2 is not null  
        and fone2 <> 0 and fone2 is not null 
                and not existe_pessoa_telefone(id_pessoa, ddd2, fone2);
      INSERT INTO public.pessoas_telefones(
          id_pessoa, ddd, telefone,  principal, id_tipo_telefone, contato, ddi, dtalteracao)		 
        select id_pessoa, ddd3, fone3,  false
        ,  CAST( iif( CAST(SUBSTRING(CAST (fone3 AS text) FROM 1 FOR 1) as integer) < 8, '1', '3') as numeric(1))  as  tipo3
        , null, 55,  now()
        from lead_a_importar where ddd3 <> 0 and ddd3 is not null  
        and fone3 <> 0 and fone3 is not null 
        and not existe_pessoa_telefone(id_pessoa, ddd3, fone3);
      INSERT INTO public.pessoas_telefones(
          id_pessoa, ddd, telefone,  principal, id_tipo_telefone, contato, ddi, dtalteracao)		
        select id_pessoa, ddd4, fone4, false
        , CAST( iif( CAST(SUBSTRING(CAST (fone4 AS text) FROM 1 FOR 1) as integer) < 8, '1', '3') as numeric(1))  as  tipo4
        , null, 55,  now()
        from lead_a_importar where ddd4 <> 0 and ddd4 is not null 
        and fone4 <> 0 and fone4 is not null 
        and not existe_pessoa_telefone(id_pessoa, ddd4, fone4);
      INSERT INTO public.pessoas_telefones(
          id_pessoa, ddd, telefone,  principal, id_tipo_telefone, contato, ddi, dtalteracao)		
        select id_pessoa, ddd5, fone5,  false
        , CAST( iif( CAST(SUBSTRING(CAST (fone5 AS text) FROM 1 FOR 1) as integer) < 8, '1', '3') as numeric(1))  as  tipo5
        , null, 55,  now()
        from lead_a_importar where ddd5 <> 0 and ddd5 is not null 
        and fone5 <> 0 and fone5 is not null 
        and not existe_pessoa_telefone(id_pessoa, ddd5, fone5);
      `
  executaSQLComTransacao (credenciais, client, sql)
  .then(res => { resolve( res ) })
  .catch(err => { reject( err ) })
});
}


function insertCidadeEEnderecao(credenciais, client) {
  return new Promise(function (resolve, reject) {

  let sql = `

        update lead_a_importar set id_cidade = id  
        from (select * from cidades  ) as cid
        where   upper(retira_acentuacao(lead_a_importar.cidade)) = upper(retira_acentuacao(cid.nome)) 
        and upper(retira_acentuacao(lead_a_importar.uf)) = upper(retira_acentuacao(cid.uf_cidade));
        
        -- Verificar se possui endereço para correspondência 
        update lead_a_importar set  possui_endereco_correspondencia = true  
        from (select id_pessoa as id_pessoa_ from pessoas_enderecos where recebe_correspondencia ) pend 
        where id_pessoa = pend.id_pessoa_ ;
      
        update lead_a_importar set possui_endereco_correspondencia = false 
        where not possui_endereco_correspondencia or possui_endereco_correspondencia is null;


        --Inserir endereço

        INSERT INTO public.pessoas_enderecos(
          id_pessoa, id_cidade, cep, logradouro, bairro, complemento, recebe_correspondencia, status, dtalteracao)
        select tpi.id_pessoa, tpi.id_cidade, tpi.cep, tpi.logradouro, tpi.bairro, numero|| ' - ' || tpi.complemento, not possui_endereco_correspondencia ,true,now() 
        from lead_a_importar tpi
        left join pessoas_enderecos pend on tpi.id_pessoa = pend.id_pessoa
        where (tpi.id_cidade is not null or tpi.id_cidade <> 0)
        and (tpi.id_cidade <> pend.id_cidade  or tpi.id_cidade is not null )
        and (tpi.logradouro <> pend.logradouro or tpi.logradouro is not null)

      `
  executaSQLComTransacao (credenciais, client, sql)
  .then(res => { resolve( res ) })
  .catch(err => { reject( err ) })
});
}

function insertPessoasLeadsMailing(credenciais, client) {
  return new Promise(function (resolve, reject) {

  let sql = `
        INSERT INTO public.pessoas_leads_mailing( id_leads_mailing, id_pessoa, id_origem_lead)
        select id_leads_mailing, id_pessoa, id_origem_lead
        from lead_a_importar 
      `
  executaSQLComTransacao (credenciais, client, sql)
  .then(res => { resolve( res ) })
  .catch(err => { reject( err ) })
});
}

function insertLeadEmPessoasSemCpfCnpj(credenciais, client) {
  return new Promise(function (resolve, reject) {

  let sql = `
      INSERT INTO public.pessoas(
      tipo,  nome, apelido_fantasia, email, cpf_cnpj, datanascimento, observacoes, sexo,  dtinclusao, dtalteracao, id_leads_mailing_tmp , id_mailing_origem )	
      select tipo_pessoa, upper(nome), upper(nome), lower(email), cpf_cnpj, to_data(lpad(cast(dt_nascimento as text), 8, '0'), 'yyyymmdd'), observacoes , upper(sexo), now(), now()   
      , id_leads_mailing, id_origem_lead
      from lead_a_importar 
      where  id_pessoa is null;
     	

      update lead_a_importar tp set id_pessoa = pe.id 
      from (select * from pessoas ) as pe    
      where tp.id_leads_mailing  = pe.id_leads_mailing_tmp and tp.id_origem_lead = pe.id_mailing_origem
      and  (not possui_cadastro_anterior or possui_cadastro_anterior is null) 
  `

  executaSQLComTransacao (credenciais, client, sql)
  .then(res => { resolve( res ) })
  .catch(err => { reject( err ) })
});
}

function updateTabLeadAImportar(credenciais, client, id_leads_mailing, id_campanha) {
  return new Promise(function (resolve, reject) {

  let sql = `
      update lead_a_importar set id_leads_mailing = ${id_leads_mailing} , id_campanha = ${id_campanha}
  `
  executaSQLComTransacao (credenciais, client, sql)
  .then(res => { resolve( res ) })
  .catch(err => { reject( err ) })
});
}


function insertCampanha(credenciais, client, arquivoCSV) {
  return new Promise(function (resolve, reject) {
  let linha = arquivoCSV.csvLinhas[0];
  if (linha.id_campanha) {
    let res = [];
    //res[0].id = linha.id_campanha;
    res.push({id: linha.id_campanha})
    resolve( res )
  }
  else{

    let sql = `
    INSERT INTO public.campanhas(
      id_canal, nome, descricao, dt_inicio, dt_fim, id_motivo)
      VALUES (3, '${linha['nome_lead']}' || ' ' || to_char(now(), 'dd/mm/yyyy')  , '${linha['nome_lead']}' , date(now()), date(now()) + 360, 1)
      RETURNING id;
    `
    executaSQLComTransacao (credenciais, client, sql)
    .then(res => { resolve( res ) })
    .catch(err => { reject( err ) })
  }

});
}


function insertLeadsMailing(credenciais, client, arquivoCSV) {
  return new Promise(function (resolve, reject) {
  let linha = arquivoCSV.csvLinhas[0];
  let sql = `
  INSERT INTO public.leads_mailing(
     nome,  data_importacao, origem)
    VALUES ( '${linha['nome_lead']}' , now(),  '${linha['nome_lead']}' )
    RETURNING id;
  `
    executaSQLComTransacao (credenciais, client, sql)
  .then(res => { resolve( res ) })
  .catch(err => { reject( err ) })
});
}


function insertLeadEmPessoas(credenciais, client) {
  return new Promise(function (resolve, reject) {

  let sql = `
      INSERT INTO public.pessoas(
      tipo,  nome, apelido_fantasia, email, cpf_cnpj, datanascimento, observacoes, sexo,  dtinclusao, dtalteracao)	
      select tipo_pessoa, upper(nome), upper(nome), lower(email), cpf_cnpj, to_data(lpad(cast(dt_nascimento as text), 8, '0'), 'yyyymmdd'), observacoes , upper(sexo), now(), now()   
      from lead_a_importar 
      where   not possui_cadastro_anterior or possui_cadastro_anterior is null;
     	
      update lead_a_importar tp set id_pessoa = pe.id 
      from (select * from pessoas ) as pe    
      where tp.cpf_cnpj  = pe.cpf_cnpj 
      and  (not possui_cadastro_anterior or possui_cadastro_anterior is null) 
  `

  executaSQLComTransacao (credenciais, client, sql)
  .then(res => { resolve( res ) })
  .catch(err => { reject( err ) })
});
}



function existeCpfCnpjEmPessoas(credenciais, client) {
  return new Promise(function (resolve, reject) {

  let sql = `
  update lead_a_importar li set possui_cadastro_anterior = true, id_pessoa = pe.id 
  from (select * from pessoas ) as pe where TO_NUMBER( li.cpf_cnpj, '999999999999999')  = TO_NUMBER( pe.cpf_cnpj, '999999999999999')
  `

  executaSQLComTransacao (credenciais, client, sql)
  .then(res => { resolve( res ) })
  .catch(err => { reject( err ) })
});
}

function insertTabLeadAImportar(credenciais, client, arquivoCSV) {
  return new Promise(function (resolve, reject) {
    // monta a sql de inserção na tabela lead_a_importar
    sql = 'INSERT INTO public.lead_a_importar( '
    for (let i = 0; i < arquivoCSV.csvHeader.length; i++) {
      sql = sql + arquivoCSV.csvHeader[i] + ', '
    }
    sql = sql.substr(0, sql.length - 2) 

    sql = sql + ') VALUES ';
    let linhaSQL = String; 
    let linha = arquivoCSV.csvLinhas[0];
    let tipPessoa = '';
    for (let j = 0; j < arquivoCSV.csvLinhas.length; j++) {
      linhaSQL = '(';
      linha = arquivoCSV.csvLinhas[j]
      for (let i = 0; i < arquivoCSV.csvHeader.length; i++) {
        if (arquivoCSV.csvHeader[i] == 'tipo_pessoa'){
          tipPessoa = linha[arquivoCSV.csvHeader[i]]
        }
        if (isNumber(linha[arquivoCSV.csvHeader[i]])) {
          if (arquivoCSV.csvHeader[i] == 'cpf_cnpj'){
            if (tipPessoa = 'J') {
              linhaSQL = linhaSQL + `'${zeroEsquerda(linha[arquivoCSV.csvHeader[i]],14)}', `
            } else {
              linhaSQL = linhaSQL + `'${zeroEsquerda(linha[arquivoCSV.csvHeader[i]],11)}', `
            }
          } else {
          linhaSQL = linhaSQL + linha[arquivoCSV.csvHeader[i]] + ', ' 
          } 
        } else {
          if(linha[arquivoCSV.csvHeader[i]] == '') {
            linhaSQL = linhaSQL + `null, `
          } else {
            linhaSQL = linhaSQL + `'${linha[arquivoCSV.csvHeader[i]]}', `
        }
      }

      }
      linhaSQL = linhaSQL.substr(0, linhaSQL.length - 2) 
      linhaSQL = linhaSQL  + '), '  
      sql = sql + linhaSQL
    }
    sql = sql.substr(0, sql.length - 2) 
    executaSQLComTransacao (credenciais, client, sql)
    .then(res => {  resolve( res ) })
    .catch(err => { reject( err ) })
});
}


function deletaTabLeadAImportar(credenciais, client) {
  return new Promise(function (resolve, reject) {
  let sql = `delete from lead_a_importar`
  executaSQLComTransacao (credenciais, client, sql)
  .then(res => { resolve( res ) })
  .catch(err => { reject( err ) })
});
}



module.exports = { importaLead }