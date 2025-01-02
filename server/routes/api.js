const express = require('express');
const router = express.Router();

const Users = require('./api-users');
const Financial = require('./api-financial');

// Function to set io instance
const setIO = () => {
  // Use as rotas do arquivo api-users.js
  router.use('/users', Users);
  // Use as rotas do arquivo api-financial.js
  router.use('/financial', Financial);

  return router;
};

module.exports = setIO;