const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { Importation } = require('../controllers/importation');

// Lista os recebimentos do ano atual
router.post('/listAllProcesses', async (req, res, next) => {
   const { hash } = req.body;

   try {
      const result = await Importation.listAllProcesses(hash);

      res.status(200).json(result)
   } catch (error) {

      res.status(404).json('Erro')   
   }
});

// Lista as metas do ano atual
router.post('/listGoalActualYear', async (req, res, next) => {
   const { hash } = req.body;

   try {
      const result = await Importation.listGoalActualYear(hash);

      res.status(200).json(result)
   } catch (error) {

      res.status(404).json('Erro')   
   }
});

module.exports = router;