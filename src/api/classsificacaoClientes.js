const { executaSQL } = require('./executaSQL');
const { auditoria } = require('./auditoria');


function getClassificacaoClientes(req, res) {
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.headers.token,
        idUsuario: req.query.id_usuario
      };
  
      let sql = `select * from classificacao_clientes  `
      executaSQL(credenciais, sql)
        .then(res => {
          if (res.length > 0) {
            let propostas = res;
            resolve(propostas)
          }
          else reject('classificacao_clientes não encontrada!')
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  function crudClassificacaoClientes(req, res){
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.headers.token,
        idUsuario: req.query.id_usuario
      };
  
// divide o objeto em atuais e anteriores 
    let dadosAtuais = JSON.parse(req.query.dadosAtuais);
    const dadosAnteriores =  JSON.parse(req.query.dadosAnteriores);
    const crud = req.query.crud;
    req.query = dadosAtuais;
    //req.query.id_usuario = credenciais.idUsuario;
    let tabela = 'classificacao_clientes';
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
      let sql = `INSERT INTO classificacao_clientes(
                 status,  nome)
                VALUES ( ${req.query.status},  '${req.query.nome}') RETURNING id;`;
      return sql;
    };
    function sqlDelete(){
      let sql = `DELETE FROM classificacao_clientes
                  WHERE id= ${req.query.id};`;
      return sql;
    };
    function sqlUpdate(){
      let sql = `UPDATE classificacao_clientes
                 SET  status=${req.query.status}, 
                      nome='${req.query.nome}'
                WHERE id= ${req.query.id};`;
      return sql;
    };


  });
};

module.exports = {getClassificacaoClientes, crudClassificacaoClientes}