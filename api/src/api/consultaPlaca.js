const { checkTokenAccess } = require('./checkTokenAccess');
const sinesp = require('sinesp-nodejs')

function consultarPlaca(req, res) {

    return new Promise(function (resolve, reject) {

        /* Realizar uma consulta contra a placa AAA-0001 */
        sinesp.consultaPlaca(req.query.placa).then(dados => {
            resolve(dados);
        }).catch(err => {
            reject(err);

        })

    })
}

module.exports = { consultarPlaca }