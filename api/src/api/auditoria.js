const { executaSQL } = require('./executaSQL');

function  auditoria(credenciais, tabela, operacao, idTabela, idPessoa, dadosAnteriores, dadosAtuais )
{
    sql = `INSERT INTO public.auditoria(
         id_usuario, data_hora, operacao, tabela_nome, tabela_id, id_pessoa)
        VALUES (${credenciais.idUsuario}
            , now()
            , '${operacao}' 
            , '${tabela}'
            , ${idTabela ? idTabela: null}
            , ${idPessoa} ) RETURNING id;`
            // console.log(1, sql)
    executaSQL(credenciais, sql).then(res => {
        let id_auditoria = res[0].id;
        for (var [key, value] of Object.entries(dadosAtuais)) {
            if ((dadosAnteriores[key] != value ) || (operacao != 'U')){
                sql = `INSERT INTO public.auditoria_detalhe(
                    id_auditoria, campo, conteudo_anterior, conteudo_novo)
                    VALUES ( ${id_auditoria}
                        , '${key}'
                        , '${dadosAnteriores[key]}'
                        , '${ key == 'id' ? idTabela: value}');`
                // console.log(2, sql)
                executaSQL(credenciais, sql).then(res1 => {
                }).catch(e => {client.end(); reject(e)})
            }
        }
    }).catch(e => { client.end(); reject(e)})
};

module.exports = { auditoria};