const { checkTokenAccess } = require('./checkTokenAccess');

function getTabelaPrecos(req, res) {
    return new Promise(function (resolve, reject) {
  
        checkTokenAccess(req).then(historico => {
            getTipoVeiculos(req).then(TipoVeiculos => {
                getRastreador(req).then(Rastreador => {
                    getProtecaoVidros(req).then(ProtecaoVidros => {
                        getFundoTerceiros(req).then(FundoTerceiros => {
                            getApp(req).then(App => {
                                getCarroReserva(req).then(CarroReserva => {
                                    getTabelaValores(req).then(TabelaValores => {
                                        getTabelaCombos(req).then(TabelaCombos => {
                                            if (!TipoVeiculos || !Rastreador
                                                || !ProtecaoVidros || !FundoTerceiros || !App
                                                || !CarroReserva || !TabelaValores || !TabelaCombos) 
                                                reject('não encontrado');
            
                                            resolve({
                                                TipoVeiculos, Rastreador,  ProtecaoVidros, 
                                            FundoTerceiros, App, CarroReserva, TabelaValores, TabelaCombos
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

function getCarroReserva(req, res) {
    return new Promise(function (resolve, reject) {
  
      checkTokenAccess(req).then(historico => {
        const dbconnection = require('../config/dbConnection')
        const { Client } = require('pg')
  
        const client = new Client(dbconnection)
  
        client.connect()
  
        let sql = 'SELECT * FROM carro_reserva where status  order by valor'

        client.query(sql)
          .then(res => {
            let registros = res.rows;
  
            client.end();
            resolve(registros)
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

  function getTabelaValores(req, res) {
    return new Promise(function (resolve, reject) {
  
      checkTokenAccess(req).then(historico => {
        const dbconnection = require('../config/dbConnection')
        const { Client } = require('pg')
  
        const client = new Client(dbconnection)
  
        client.connect()
  
        let sql = 'SELECT * FROM tabela_valores where status order by id_tipo_veiculo, cota'

        client.query(sql)
          .then(res => {
            let registros = res.rows;
  
            client.end();
            resolve(registros)
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



function getTabelaCombos(req, res) {
    return new Promise(function (resolve, reject) {
  
      checkTokenAccess(req).then(historico => {
        const dbconnection = require('../config/dbConnection')
        const { Client } = require('pg')
  
        const client = new Client(dbconnection)
  
        client.connect()
  
        let sql = 'SELECT * FROM view_tabela_combos'

        client.query(sql)
          .then(res => {
            let registros = res.rows;
  
            client.end();
            resolve(registros)
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


function getTipoVeiculos(req, res) {
    return new Promise(function (resolve, reject) {
  
      checkTokenAccess(req).then(historico => {
        const dbconnection = require('../config/dbConnection')
        const { Client } = require('pg')
  
        const client = new Client(dbconnection)
  
        client.connect()
  
        let sql = 'SELECT * FROM public.tipo_veiculo where status'

        client.query(sql)
          .then(res => {
            let registros = res.rows;
  
            client.end();
            resolve(registros)
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

  function getRastreador(req, res) {
    return new Promise(function (resolve, reject) {
  
      checkTokenAccess(req).then(historico => {
        const dbconnection = require('../config/dbConnection')
        const { Client } = require('pg')
  
        const client = new Client(dbconnection)
  
        client.connect()
  
        let sql = 'select * from rastreador where status order by valor, valor_instalacao'

        client.query(sql)
          .then(res => {
            let registros = res.rows;
  
            client.end();
            resolve(registros)
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

  function getProtecaoVidros(req, res) {
    return new Promise(function (resolve, reject) {
  
      checkTokenAccess(req).then(historico => {
        const dbconnection = require('../config/dbConnection')
        const { Client } = require('pg')
  
        const client = new Client(dbconnection)
  
        client.connect()
  
        let sql = 'select * from protecao_vidros where status order by valor'

        client.query(sql)
          .then(res => {
            let registros = res.rows;
  
            client.end();
            resolve(registros)
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
  function getFundoTerceiros(req, res) {
    return new Promise(function (resolve, reject) {
  
      checkTokenAccess(req).then(historico => {
        const dbconnection = require('../config/dbConnection')
        const { Client } = require('pg')
  
        const client = new Client(dbconnection)
  
        client.connect()
  
        let sql = 'select * from fundo_terceiros where status order by valor'

        client.query(sql)
          .then(res => {
            let registros = res.rows;
  
            client.end();
            resolve(registros)
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

  function getApp(req, res) {
    return new Promise(function (resolve, reject) {
  
      checkTokenAccess(req).then(historico => {
        const dbconnection = require('../config/dbConnection')
        const { Client } = require('pg')
  
        const client = new Client(dbconnection)
  
        client.connect()
  
        let sql = 'select * from app where status order by valor'

        client.query(sql)
          .then(res => {
            let registros = res.rows;
  
            client.end();
            resolve(registros)
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
  
  module.exports = {getTabelaPrecos}

