const { checkToken} = require('./checkToken');

 async function executaSQL(credenciais, sql) {
    return new Promise(function (resolve, reject) {
        checkToken(credenciais.token, credenciais.idUsuario).then(historico => {
            const dbconnection = require('../config/dbConnection')
            const { Client } = require('pg')
            const client = new Client(dbconnection)
            client.connect()
            client.query(sql).then(res => {
                    let registros 
                    if (res.rowCount > 0) {
                        registros = res.rows;
                        
                    } else {
                        registros = res.fields
                        if (res.fields) {
                            let registros_ = '{ '
                            for (i= 0; i < registros.length; i++ ) {
                                registros_ = registros_ + `"${registros[i].name}": null, `;
                            }
                            registros_ = registros_.substr(0, registros_.length - 2) 
                            registros_ = registros_ +  '}';
                            registros_ =  JSON.parse(registros_)
                            registros = [];
                            registros.push(registros_)
                        };
                    };
                    client.end();
                    // const ret = [
                    //     registros,
                    //     {'count':res.rowCount }
                    // ];
                    resolve(registros);
                }).catch(err => {
                    client.end();
                    if (JSON.stringify(err).indexOf('duplicate key') != -1) err = 'Registro já existe';
                    reject(err);
                });
        }).catch(e => {
            reject(e);
          });
    });
}

async function executaSQLComTransacao(credenciais, client,  sql) {
    return new Promise(function (resolve, reject) {
        checkToken(credenciais.token, credenciais.idUsuario).then(historico => {
            client.query(sql).then(res => {
                    let registros 
                    if (res.rowCount > 0) {
                        registros = res.rows;
                    } else {
                        registros = res.fields
                        if (res.fields) {
                            if (registros.length > 0 ){
                                let registros_ = '{ '
                                for (i= 0; i < registros.length; i++ ) {
                                    registros_ = registros_ + `"${registros[i].name}": null, `;
                                }
                                registros_ = registros_.substr(0, registros_.length - 2) 
                                registros_ = registros_ +  '}';
                                registros_ =  JSON.parse(registros_)
                                registros = [];
                                registros.push(registros_)
                            };
                        };
                    };
                    resolve(registros);
                }).catch(err => {
                    if (JSON.stringify(err).indexOf('duplicate key') != -1) err = 'Registro já existe';
                    reject(err);
                });
        }).catch(e => {
            reject(e);
          });
    });
}


module.exports = { executaSQL, executaSQLComTransacao  }