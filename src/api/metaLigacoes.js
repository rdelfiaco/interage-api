const { checkTokenAccess } = require('./checkTokenAccess');

function getMetaPessoa(req, res) {
    return new Promise(function (resolve, reject) {

        checkTokenAccess(req).then(historico => {
            const dbconnection = require('../config/dbConnection')
            const { Client } = require('pg')

            const client = new Client(dbconnection)

            client.connect()

            let sql = `select me.meta,
                            l.ligacoes_realizadas,
                            l.ligacoes_realizadas as chd,
                            (me.meta / 480 *
                            (extract (hour from horas_trabalhadas) * 60) +
                            extract (minute from horas_trabalhadas) )
                            as chds
                            from
                            (select meta
                            from indicador_meta
                            where id_indicador = 1 ) me,
                            
                            (select count(*) as ligacoes_realizadas
                            from eventos
                            where id_status_evento in (3,7)
                            and id_canal = 3
                            and id_pessoa_resolveu = ${req.query.id_pessoa}
                            and date(dt_resolvido) = date(now())) l,
                            (select current_time - hora_entrada -
                            case when current_time > hora_saida_lanche
                            then (hora_saida_lanche - hora_entrada_lanche)
                            else '00:00:00'
                            end as horas_trabalhadas
                            from usuarios
                            where id_pessoa = ${req.query.id_pessoa} ) ht`

            client.query(sql)
                .then(res => {
                    if (res.rowCount > 0) {
                        let metaLigacoes = res.rows;

                        client.end();
                        resolve(metaLigacoes)
                    }
                    else {
                        client.end();
                        reject('Meta de ligações não encontrada')
                    }
                }
                )
                .catch(err => {
                    client.end();
                    console.log(err)
                })
        }).catch(e => {
            reject(e)
        })
    })
}

module.exports = { getMetaPessoa }