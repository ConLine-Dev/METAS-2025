const express = require('express');
const http = require('http'); // Add this line
const path = require('path');
const socketIO = require('socket.io');

// Middlewares
const app = express();
app.use(express.json());

// Create an HTTP server using the Express app
const server = http.createServer(app); 

// Import routes pages
const WebSocket = require('./server/routes/socketIO');
const listApp = require('./server/routes/app');
const listApi = require('./server/routes/api');

// Configuração do Socket.IO
const io = socketIO(server);
WebSocket.Init(io)
WebSocket.InitNewProcessMetrics(io);

// Serve arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, './public')));

// Rotas para APIs e aplicação
app.use('/api', listApi());
app.use('/app', listApp);

// Redirecionar '/' para '/app/login'
app.get('/', (req, res) => {
  res.redirect('/app/login');
});


// connection
const port = process.env.PORT || 9437;
server.listen(port, () =>
  console.log(`Listening to port http://localhost:${port} Node.js v${process.versions.node}!`)
);