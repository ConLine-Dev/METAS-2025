const { executeQuerySQL } = require('../connect/sqlServer');

const WebSocket = {
  lastId: 0,

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
      }, 1000);
    })
  },

  listLastProcess: async function() {
    const result = await executeQuerySQL(`SELECT TOP 1 IdLogistica_House FROM mov_Logistica_House ORDER BY IdLogistica_House DESC`);
    return result[0];
  }
}

module.exports = WebSocket;