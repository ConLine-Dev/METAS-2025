const express = require('express');
const router = express.Router();

const Users = require('./api-users');
const Financial = require('./api-financial');
const Importation = require('./api-importation');
const Exportation = require('./api-exportation');

// Function to set io instance
const setIO = () => {
  // Use as rotas do arquivo api-users.js
  router.use('/users', Users);
  // Use as rotas do arquivo api-financial.js
  router.use('/financial', Financial);
  // Use as rotas do arquivo api-importation.js
  router.use('/importation', Importation);
  // Use as rotas do arquivo api-exportation.js
  router.use('/exportation', Exportation);

  return router;
};

module.exports = setIO;