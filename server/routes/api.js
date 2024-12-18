const express = require('express');
const router = express.Router();

const Users = require('./api-users');

// Function to set io instance
const setIO = (io) => {
  // Use as rotas do arquivo api-users.js
  router.use('/users', Users);

  return router;
};

module.exports = setIO;