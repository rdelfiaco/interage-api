const {
  executaSQL
} = require('./executaSQL');


function getPerguntas(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `select p.id, p.nome, p.sequencia_pergunta, p.sequencia_pergunta, p.status, count(a.*) as qtde_alternativas
              from quest_perguntas p
              left join quest_alternativas a on p.id = a.id_pergunta
              group by p.id, p.nome, p.sequencia_pergunta, p.sequencia_pergunta, p.status`

    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  });
};

function getPerguntaById(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `SELECT * FROM quest_perguntas where quest_perguntas.id=${req.query.id}`
    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err)
      })
  });
};

function getAlternativasByIdPerguntas(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `select * from quest_alternativas where quest_alternativas.id_pergunta=${req.query.id}`;
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

function addPergunta(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    req.query.p = JSON.parse(req.query.data);

    let sql = `INSERT INTO quest_perguntas(
      nome,
      status,
      id_questionario,
      sequencia_pergunta,
      descricao_pergunta,
      multipla_escolha,
      tipo_pergunta
      ) VALUES(
        '${req.query.p.nome}',
        '${req.query.p.status}',
        '${req.query.p.questionarioId}',
        '${req.query.p.sequencia}',
        '${req.query.p.descricao}',
        '${req.query.p.multipla_escolha}',
         ${req.query.p.tipo_pergunta}
        ) RETURNING id;`

    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  });
};

function updateStatusPergunta(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    req.query.p = JSON.parse(req.query.data);

    let sql = `UPDATE quest_perguntas SET status=${req.query.p.status} WHERE quest_perguntas.id=${req.query.p.id}`;

    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  });
};

function updateMultiEscolhaPergunta(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    req.query.p = JSON.parse(req.query.data);

    let sql = `UPDATE quest_perguntas SET multipla_escolha=${req.query.p.multi_escolha} WHERE quest_perguntas.id=${req.query.p.id}`;

    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  });
};

function updatePergunta(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    req.query.p = JSON.parse(req.query.data);
    
    let sql = `UPDATE quest_perguntas SET 
      nome='${req.query.p.nome}',
      sequencia_pergunta=${req.query.p.sequencia_pergunta},
      descricao_pergunta='${req.query.p.descricao_pergunta}',
      tipo_pergunta=${req.query.p.tipo_pergunta} WHERE quest_perguntas.id=${req.query.p.id}`;
      
    executaSQL(credenciais, sql)
      .then(res => {
        resolve(res)
      })
      .catch(err => {
        reject(err)
      })
  });
};

function deletePergunta(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    let sql = `DELETE FROM quest_perguntas
      WHERE quest_perguntas.id=${JSON.parse(req.query.id)}`;

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
  getPerguntas,
  addPergunta,
  updateStatusPergunta,
  updatePergunta,
  deletePergunta,
  updateMultiEscolhaPergunta,
  getPerguntaById,
  getAlternativasByIdPerguntas
};