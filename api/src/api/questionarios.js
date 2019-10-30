const {
  executaSQL
} = require('./executaSQL');


function getQuestionarios(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `SELECT q.id, q.nome, q.status, count(perg.*) as qtde_perguntas FROM questionarios q
               left join quest_perguntas perg on q.id = perg.id_questionario
               group by q.id, q.nome, q.status`

    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  });
};


function getQuestionarioById(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    let sql = `SELECT * FROM questionarios where questionarios.id=${req.query.id}`
    executaSQL(credenciais, sql)
      .then(questionario => {
        sql = `select * from quest_perguntas where quest_perguntas.id_questionario=${req.query.id}`;
        executaSQL(credenciais, sql)
          .then(perguntas => {
            resolve({
              questionario,
              perguntas
            });
          })
          .catch(_err => {
            reject(_err)
          })
      })
      .catch(err => {
        reject(err)
      })
  });
};

function getPerguntasByIdUqestionario(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `select * from quest_perguntas where quest_perguntas.id_questionario=${req.query.id}`;
    // let resultado = null;
    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err)
      })
  });
};

function addQuestionario(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    req.query.q = JSON.parse(req.query.data);

    let sql = `INSERT INTO questionarios(nome, status) VALUES('${req.query.q.nome}', '${req.query.q.status}') RETURNING id;`
    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  });
};

function updateStatusQuestionario(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    req.query.q = JSON.parse(req.query.data);

    let sql = `UPDATE questionarios SET status=${req.query.q.status} WHERE questionarios.id=${req.query.q.id}`;

    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  });
};

function updateQuestionario(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    req.query.q = JSON.parse(req.query.data);
    let sql = `UPDATE questionarios SET nome='${req.query.q.nome}' WHERE questionarios.id=${req.query.q.id}`;
    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  });
};

function deleteQuestionario(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `DELETE FROM questionarios
      WHERE questionarios.id=${req.query.id}`;

    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  });
};

function getQuestionarioCompletoById(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `select * FROM view_questionario_alt_perg
      WHERE id_questionario=${req.query.id}`;

    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  });
};

function gravaRespostaQuestionario(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    console.log(req.query.data);
    req.query.q = JSON.parse(req.query.data);
    console.log(req.query.q);
    let sql = `insert into quest_respostas(
      id_alternativa,
      id_usuario,
      id_receptor,
      dt_resposta,
      observacao,
      id_evento, 
      id_pergunta) 
      VALUES( ${req.query.q.id_alternativa},
        ${req.query.q.id_usuario}, 
        ${req.query.q.id_receptor}, now(), '${req.query.q.observacao}',
        ${req.query.q.id_evento}, ${req.query.q.id_pergunta} ) RETURNING id;`
    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  });
};


module.exports = {
  getQuestionarios,
  addQuestionario,
  updateQuestionario,
  deleteQuestionario,
  updateStatusQuestionario,
  getQuestionarioById,
  getPerguntasByIdUqestionario,
  getQuestionarioCompletoById,
  gravaRespostaQuestionario
};