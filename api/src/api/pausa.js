const { executaSQL } = require('./executaSQL');
const { auditoria } = require('./auditoria');


function getPausas(req, res) {
    return new Promise(function (resolve, reject) {
      let credenciais = {
        token: req.query.token,
        idUsuario: req.query.id_usuario
      };
  
      let sql = `select * from pausa  `
      executaSQL(credenciais, sql)
        .then(res => {
          if (res.length > 0) {
            let propostas = res;
            resolve(propostas)
          }
          else reject('Pausa não encontrada!')
        })
        .catch(err => {
          reject(err)
        })
    })
  }

  function crudPausa(req, res){
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
    let tabela = 'pausa';
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
      let sql = `INSERT INTO pausa(
                 status, tempo, nome)
                VALUES ( ${req.query.status}, ${req.query.tempo}, '${req.query.nome}') RETURNING id;`;
      return sql;
    };
    function sqlDelete(){
      let sql = `DELETE FROM pausa
                  WHERE id= ${req.query.id};`;
      return sql;
    };
    function sqlUpdate(){
      let sql = `UPDATE pausa
                 SET  status=${req.query.status}, 
                      tempo=${req.query.tempo}, 
                      nome='${req.query.nome}'
                WHERE id= ${req.query.id};`;
      return sql;
    };


  });
};

function registrarInicioPausa(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `INSERT INTO public.pausas_usuarios(
       id_usuario, inicio,  id_pausa)
      VALUES (${req.query.id_usuario},
              now(),  ${req.query.id_pausa}) RETURNING id;  `

    executaSQL(credenciais, sql)
      .then(res => {
        if (res.length > 0) {
          let propostas = res;
          resolve(propostas)
        }
        else reject('Pausa não encontrada!')
      })
      .catch(err => {
        reject(err)
      })
  })
}
 
function registrarFimPausa(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `UPDATE public.pausas_usuarios
    SET  fim = now()
    WHERE id = ${req.query.id_pausa_usuario} ;  `
    executaSQL(credenciais, sql)
      .then(res => {
          resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  })
}

module.exports = {getPausas, crudPausa, registrarInicioPausa, registrarFimPausa}