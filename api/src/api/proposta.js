const { executaSQL } = require('./executaSQL')
const { getUsuarios } = require('./usuario')

function salvarProposta(req, res) {
  return new Promise(function (resolve, reject) {

    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    req.query.proposta = JSON.parse(req.query.proposta);

    req.query.proposta.placa = req.query.proposta.placa ? req.query.proposta.placa : ''


    let sql = `INSERT INTO propostas(
                    id_tipo_veiculo, codigofipe, marca, modelo, ano_modelo, data_consulta 
                    , preco_medio, adesao, mensalidade , participacao, cota, id_fundo_terceiros
                    , id_carro_reserva, id_app, id_rastreador, id_protecao_vidros, proposta_json
                    , id_usuario, id_pessoa_cliente, placa, cota_alterada
                    , id_status_proposta
                    , veiculo_comercial
                    , leilao_sinistrado
                    , portabilidade
                    , parcelas_adesao
                    , parcelas_rastreador
                    , rastreador_instalacao
                    , entrada
                    , mensalidade_alterada
                    , dtsalvou
                    , reboque)
                VALUES (  ${req.query.proposta.idTipoVeiculo},
                          '${req.query.proposta.codigoFipe}',
                          '${req.query.proposta.marca}',
                          '${req.query.proposta.modelo}',
                          '${req.query.proposta.anoModelo}',
                          '${req.query.proposta.dataConsulta}',
                          '${req.query.proposta.precoMedio}',
                          '${req.query.proposta.adesao}',
                          '${req.query.proposta.mensalidade}',
                          '${req.query.proposta.participacao}',
                          ${req.query.proposta.cota},
                          ${req.query.proposta.idFundoTerceiros},
                          ${req.query.proposta.idCarroReserva},
                          ${req.query.proposta.idApp},
                          ${req.query.proposta.idRastreador},
                          ${req.query.proposta.idProtecaoVidros},
                          '${req.query.propostaJSON}',    
                          ${req.query.proposta.idUsuario},
                          ${req.query.proposta.idPessoaCliente},
                          '${req.query.proposta.placa}',
                          ${req.query.proposta.cotaAlterada},
                          ${req.query.proposta.idStatusProposta},
                          ${req.query.proposta.veiculoComercial},
                          ${req.query.proposta.leilaoSinistrado},
                          ${req.query.proposta.portabilidade},
                          ${req.query.proposta.parcelas},
                          ${req.query.proposta.parcelasRastreador},
                          ${req.query.proposta.rastreadorInstalacao},
                          ${req.query.proposta.entrada},
                          ${req.query.proposta.mensalidadeAlterada},
                          now(),
                          ${req.query.proposta.reboque}) RETURNING id`

    //console.log('proposta inserir', sql)


    executaSQL(credenciais, sql).then(registros => {

      //criar evento para acompanhar poposta ou pedir autorização para uso de conta alterada
      let id_proposta = registros[0].id;
      let idProposta = registros;



      sql = `INSERT INTO public.eventos(
              id_motivo,  
              id_status_evento, 
              id_pessoa_criou, 
              dt_criou, 
              dt_prevista_resolucao, 
              dt_para_exibir, 
              tipodestino, 
              id_pessoa_organograma, 
              id_pessoa_receptor, 
              id_prioridade,
              observacao_origem,  
              id_canal,
              id_proposta)
              VALUES (${req.query.proposta.idMotivo},
                      1, 
                      ${req.query.proposta.idPessoaUsuario},
                      now(),
                      func_dt_expira(2),
                      now(),
                      'P',
                      ${req.query.proposta.idPessoaDestinatario},
                      ${req.query.proposta.idPessoaCliente},
                      2,
                      '${req.query.proposta.observacao}',
                      7,
                      ${id_proposta})`
      //console.log('evento', sql)
      executaSQL(credenciais, sql).then(registros => {
        resolve(idProposta)
      }).catch(e => {
        reject('Erro ao salvar evento de proposta: ', e);
      });
    }).catch(e => {
      reject('Erro ao salvar proposta: ',e);
    });
  })
};

function getPropostasDoUsuario(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.idUsuarioLogado
    };
    let sql = `select * from view_proposta where id_usuario = ${req.query.idUsuarioSelect} 
               and id_status_proposta = ${req.query.id_statusProposta}
               and date(dtsalvou) between date('${req.query.dataInicial}') and date('${req.query.dataFinal}') 
              order by id desc `
    executaSQL(credenciais, sql)
      .then(res => {
        if (res) {
          let propostas = res;
          resolve(propostas)
        }
        else reject('Não há propostas!')
      })
      .catch(err => {
        reject(err)
      })
  })
}

function getPropostaPorId(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `select * from view_proposta where id=${req.query.id} `
    executaSQL(credenciais, sql)
      .then(res => {
        if (res.length > 0) {
          let propostas = res;
          resolve(propostas)
        }
        else reject('Proposta não encontrada!')
      })
      .catch(err => {
        reject(err)
      })
  })
}

function getPropostasPorPeriodoSintetico(req, res) {
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };

    let sql = `select us.id_pessoa, 
                sum(iif(id_status_proposta = 6, '1','0')::numeric) as ativas,
                sum(iif(id_status_proposta in(3,5), '1','0')::numeric) as negociando,
                sum(iif(id_status_proposta = 2, '1','0')::numeric) as recusadas,
                sum(iif(id_status_proposta in (4,7,8,9,10), '1','0')::numeric) as canceladas,
                sum(iif(id_status_proposta not in (2,3,4,5,6,7,8,9,10), '1','0')::numeric) as tramitando
                from propostas pp
                inner join status_proposta sp on pp.id_status_proposta = sp.id
                inner join usuarios us on pp.id_usuario = us.id 
                where date(dtsalvou) between date('${req.query.dataInicial}') and date('${req.query.dataFinal}') 
                group by us.id_pessoa
                union 
                select 9999999 as id_pessoa, 
                sum(iif(id_status_proposta = 6, '1','0')::numeric) as ativas,
                sum(iif(id_status_proposta in(3,5), '1','0')::numeric) as negociando,
                sum(iif(id_status_proposta = 2, '1','0')::numeric) as recusadas,
                sum(iif(id_status_proposta in (4,7,8,9,10), '1','0')::numeric) as canceladas,
                sum(iif(id_status_proposta not in (2,3,4,5,6,7,8,9,10), '1','0')::numeric) as tramitando
                from propostas 
                where date(dtsalvou) between date('${req.query.dataInicial}') and date('${req.query.dataFinal}')   `
    executaSQL(credenciais, sql)
      .then(res => {
        if (res.length > 0) {
          let propostas = res;
          resolve(propostas)
        }
        else reject('Proposta não encontrada!')
      })
      .catch(err => {
        reject(err)
      })
  })
}

function getPropostaFiltros(req, res){
  return new Promise(function (resolve, reject) {
    getUsuarios(req).then(Usuarios => {
      getStatusProposta(req).then(StatusProposta => {
        if (!Usuarios || !StatusProposta)
          reject('Filtro não pode ser elaborado ');

        resolve({ Usuarios, StatusProposta });
        
      }).catch(e => {
        reject(e);
      });
    }).catch(e => {
      reject(e);
    });
  });
}

function getStatusProposta(req, res){
  return new Promise(function (resolve, reject) {
    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    let sql = `select * from status_proposta where status order by nome`
    executaSQL(credenciais, sql)
      .then(res => {
        if (res.length > 0) {
          let status = res;
          resolve(status )
        }
        else reject('Status não encontrado!')
      })
      .catch(err => {
        reject(err)
      })
  })
}

function salvarDadosVeiculoDaProposta(req, res) {
  return new Promise(function (resolve, reject) {

    let credenciais = {
      token: req.query.token,
      idUsuario: req.query.id_usuario
    };
    
    let sql = `UPDATE propostas set placa = '${req.query.placa}',
    renavam = '${req.query.renavam}',
    chassi = '${req.query.chassi}',
    n_do_motor = '${req.query.n_do_motor}',
    cor_veiculo = '${req.query.cor_veiculo}',
    ano_modelo = '${req.query.ano_modelo}'
    where id = ${req.query.id}`

    //console.log(sql)

    executaSQL(credenciais, sql).then(registros => {

     resolve('Dados veículo salva com sucesso')
      
    }).catch(e => {
      reject('Salvar dados do veículo da proposta: ',e);
    });
  })
};



module.exports = { salvarProposta, getPropostasDoUsuario, getPropostaPorId, 
                  getPropostaFiltros, salvarDadosVeiculoDaProposta, getPropostasPorPeriodoSintetico }
