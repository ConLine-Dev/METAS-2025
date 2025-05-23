const { executeQuerySQL } = require('../connect/sqlServer');

const WebSocket = {
  lastId: 0,
  lastIdMetrics: 0, // Novo lastId para métricas

  Init: async function(io) {
    // Verifica o ultimo processo gerado e salva no lastId
    const newResult = await WebSocket.listLastProcess();
    this.lastId = newResult.IdLogistica_House;

    io.on('connection', (socket) => {
    
      
      // A cada 1 segundo verifica o socket io
      setInterval(async () => {
        const result = await WebSocket.listLastProcess();
        const id = result.IdLogistica_House;
        
        // Se o id da nova consulta for diferente do ultimo lastId, irá emitir o io
        if (id !== WebSocket.lastId) {
          WebSocket.lastId = id; // O lastId será atualizado com o novo valor consultado
          io.emit('newProcess');
        }
      }, 120000); /* 2 minutos */
    })
  },

  InitNewProcessMetrics: async function(io) {
    // Busca o último processo ao iniciar
    const newResult = await WebSocket.listLastProcess();
    this.lastIdMetrics = newResult.IdLogistica_House;
    console.log('lastIdMetrics', this.lastIdMetrics);
    setTimeout(async () => {
      if(this.lastIdMetrics > 0){
        this.lastIdMetrics = this.lastIdMetrics - 1;
        console.log('lastIdMetrics', this.lastIdMetrics);
      }
    }, 1000);




    setInterval(async () => {
      
      // Busca todos os processos fechados após o lastIdMetrics

      const results = await WebSocket.listNewProcesses(this.lastIdMetrics);
      console.log('verificando processos fechados', results, this.lastIdMetrics)
      if (results && results.length > 0) {
        // Atualiza o lastIdMetrics para o maior ID retornado
        this.lastIdMetrics = Math.max(...results.map(r => r.IdLogistica_House));
        console.log('lastIdMetrics', this.lastIdMetrics);
        // Emite todos os novos processos para os clientes
        io.emit('newProcess_metrics', results);
        console.log('enviou', results);
        console.log('Novo processo encontrado');
      }
    }, 5000); // 30 segundos

    io.on('connection', (socket) => {
      
    });
  },

  listLastProcess: async function() {
    const result = await executeQuerySQL(`
      SELECT TOP 1 
      IdLogistica_House FROM mov_Logistica_House 
      WHERE 
      Situacao_Agenciamento NOT IN (7 /*CANCELADO*/) 
      AND Numero_Processo NOT LIKE '%test%' 
      AND Numero_Processo NOT LIKE '%demu%'
      ORDER BY IdLogistica_House DESC`);
    return result[0];
  },

  listNewProcesses: async function(lastId) {
    if (isNaN(lastId) || lastId === null || lastId === undefined) {
      return false;
    }
    const result = await executeQuerySQL(`
      SELECT
Lhs.Numero_Processo,
Lhs.IdLogistica_House,
CASE Lhs.Situacao_Agenciamento
    WHEN '2' THEN 'Em andamento'
    WHEN '3' THEN 'Liberado faturamento'
    WHEN '4' THEN 'Faturado'
    WHEN '5' THEN 'Finalizado'
    WHEN '6' THEN 'Auditado'
    WHEN '7' THEN 'Cancelado'
    WHEN '1' THEN 'Processo aberto'
    ELSE 'Desconhecido'
END AS Situacao_Agenciamento,

FORMAT(Lhs.Data_Abertura_Processo, 'dd/MM/yyyy HH:mm:ss') AS Data_Abertura_Processo,
Psa.IdPessoa AS Id_Responsavel,
Psa.nome AS Responsavel,
Ppr.Nome AS Papel_Responsavel,
Psa.EMail AS EMail_Responsavel,
Org.Nome AS Origem,
Dto.Nome AS Destino,
Clt.Nome AS Cliente,

CASE Lvm.Modalidade_Transporte
    WHEN '1' THEN 'Aéreo'
    WHEN '2' THEN 'Marítimo'
    WHEN '3' THEN 'Rodoviário'
    WHEN '4' THEN 'Ferroviário'
END AS Modalidade

FROM 
mov_logistica_house Lhs
LEFT OUTER JOIN 
mov_logistica_master Lmr ON Lmr.IdLogistica_Master = Lhs.IdLogistica_Master
LEFT OUTER JOIN 
mov_Projeto_Atividade_Responsavel Res ON Res.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
LEFT OUTER JOIN
cad_Pessoa Psa ON Psa.IdPessoa = Res.IdResponsavel
LEFT OUTER JOIN
cad_Papel_Projeto Ppr ON Ppr.IdPapel_Projeto = Res.IdPapel_Projeto
LEFT OUTER JOIN
cad_Agente_Carga Ori ON Ori.IdPessoa = lmr.IdAgente_Origem
LEFT OUTER JOIN
cad_Agente_Carga Dst ON Dst.IdPessoa = lmr.IdAgente_Destino
LEFT OUTER JOIN
cad_Cliente Cli ON Cli.IdPessoa = Lhs.IdCliente
LEFT OUTER JOIN
cad_pessoa Clt ON Clt.IdPessoa = Cli.IdPessoa
LEFT OUTER JOIN 
mov_Logistica_Viagem Lvm ON Lvm.IdLogistica_House = Lhs.IdLogistica_House
LEFT OUTER JOIN
cad_Origem_Destino Org ON Org.IdOrigem_Destino = Lvm.IdOrigem
LEFT OUTER JOIN
cad_Origem_Destino Dto ON Dto.IdOrigem_Destino = Lvm.IdDestino

WHERE 
Lhs.IdLogistica_House > ${lastId}
AND Lhs.Numero_Processo NOT LIKE '%test%'
AND Lhs.Numero_Processo NOT LIKE '%demu%'
AND Lhs.Situacao_Agenciamento NOT IN (7)
    `);
    // Agrupamento por processo
    const processosMap = {};
    result.forEach(item => {
      const numero = item.Numero_Processo;
      if (!processosMap[numero]) {
        processosMap[numero] = {
          IdLogistica_House: item.IdLogistica_House,
          Numero_Processo: item.Numero_Processo,
          Situacao_Agenciamento: item.Situacao_Agenciamento,
          DataAbertura: item.Data_Abertura_Processo,
          Modalidade: item.Modalidade,
          Origem: item.Origem,
          Destino: item.Destino,
          Cliente: item.Cliente,
          Responsaveis: {}
        };
      }
      // Papel dinâmico
      const papel = item.Papel_Responsavel || 'Outro';
      processosMap[numero].Responsaveis[papel] = {
        nome: item.Responsavel,
        email: item.EMail_Responsavel,
        id: item.Id_Responsavel,
        foto: `https://cdn.conlinebr.com.br/colaboradores/${item.Id_Responsavel}`
      };
    });
    return Object.values(processosMap);
  }
}

module.exports = WebSocket;