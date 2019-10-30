const { executaSQL } = require('./executaSQL');
const { getUsuarios } = require('./usuario');
const { getPermissoes } = require('./permissao');
const { executaSQLComTransacao }  = require('./executaSQL');


function getDepartamentos(req, res) {
    return new Promise(function (resolve, reject) {
  
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };
      let sql = `
            select o.*, s.nome as superior
            from organograma o
            left join organograma s on o.id_pai = s.id
            order by s.nome, o.nome 
      `
      executaSQL(credenciais, sql).then(departamentos => {
          resolve(departamentos )
        }).catch(e => {
        reject('getDepartamentos',e);
      });

    });
  };


function getDepartamentosUsuarios(req, res) {
  return new Promise(function (resolve, reject) {

    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    getDepartamentos(req, res).then(departamentos => {
      getUsuarios(req, res).then(usuarios => {
        resolve({departamentos, usuarios} )
      }).catch(e => {
      reject('getDepartamentosUsuarios',e);
    });
    }).catch(e => {
      reject('getDepartamentosUsuarios',e);
    });
  })
};


function getPermissoesDepartamentoSeleconado(req, res){
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
       
    let sql = `select id_recursos::integer, pr.nome
    from permissoes_organograma po
    inner join permissoes_recursos pr on po.id_recursos = pr.id  
    where po.id_organograma = ${req.query.id} ` 
        
    executaSQL(credenciais, sql)
      .then(resPermissoesDepartamento => {
        getPermissoes(req, res) .then(permissoes => {
          resolve({permissoesDepartamento: resPermissoesDepartamento, permissoes: permissoes});
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

  
 
function salvarPermissoesDoDepartamento(req, res){
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let departamentoIdSelecionado = req.query.departamentoIdSelecionado;
    let permissoesDoDepartamento = JSON.parse( req.query.permissoesDoDepartamento );

    let sqlDelet = `DELETE FROM permissoes_organograma
    WHERE permissoes_organograma.id_organograma=  ${departamentoIdSelecionado} ` 

    let sqlInsert = ` INSERT INTO public.permissoes_organograma(
                        id_organograma, id_recursos)
            VALUES  `
    for (i = 0; i <= permissoesDoDepartamento.length -1 ;  i++ ){
      sqlInsert =  sqlInsert  + `(${departamentoIdSelecionado}, ${permissoesDoDepartamento[i]._id}),`
    }
    sqlInsert = sqlInsert.substr(0,  sqlInsert.length -1 ) 
    if (!permissoesDoDepartamento.length) { sqlInsert = "Select now()" }


    const dbconnection = require('../config/dbConnection');
    const { Client } = require('pg');
    const client = new Client(dbconnection);
    client.connect();

    client.query('BEGIN').then((res1) => {
        executaSQLComTransacao(credenciais, client, sqlDelet ).then(resDel => {
          executaSQLComTransacao(credenciais, client, sqlInsert). then( resInsert => {
            client.query('COMMIT')
            .then((resp) => { resolve('Permissões do departamento atualizadas ') })
            .catch(err => {  reject(err) });
          });
          });
        });
    })
  }
 
  
  function salvarUsuariosDoDepartamento(req, res){
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };
  
      let departamentoIdSelecionado = req.query.departamentoIdSelecionado;
      let usuariosDoDepartamento = JSON.parse( req.query.usuariosDoDepartamento );
  
      let sqlDelet = `UPDATE usuarios set id_organograma = 0
      WHERE  id_organograma =  ${departamentoIdSelecionado} ` 
  
      let sqlInsert = `UPDATE usuarios set id_organograma =  ${departamentoIdSelecionado}  WHERE  id in (`
      for (i = 0; i <= usuariosDoDepartamento.length -1 ;  i++ ){
        sqlInsert =  sqlInsert  + `${usuariosDoDepartamento[i]._id},`
      }
      sqlInsert = sqlInsert.substr(0,  sqlInsert.length -1 ) 
      sqlInsert =  sqlInsert  + `)`;

      if (!usuariosDoDepartamento.length) { sqlInsert = "Select now()" }
  
      const dbconnection = require('../config/dbConnection');
      const { Client } = require('pg');
      const client = new Client(dbconnection);
      client.connect();
  
      client.query('BEGIN').then((res1) => {
          executaSQLComTransacao(credenciais, client, sqlDelet ).then(resDel => {
            executaSQLComTransacao(credenciais, client, sqlInsert). then( resInsert => {
              client.query('COMMIT')
              .then((resp) => { resolve('Usuários do departamento atualizadas ') })
              .catch(err => {  reject(err) });
            });
            });
          });
      })
    }
  
  module.exports = { getDepartamentos, 
                    getDepartamentosUsuarios, 
                    getPermissoesDepartamentoSeleconado, 
                    salvarPermissoesDoDepartamento,
                    salvarUsuariosDoDepartamento }