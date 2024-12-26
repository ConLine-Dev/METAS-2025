const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { Financial } = require('../controllers/financial');

// Lista os recebimentos do ano atual
router.post('/listReceiptActualYear', async (req, res, next) => {
   const { idcompany } = req.body;

   try {
      const result = await Financial.listReceiptActualYear(idcompany);

      res.status(200).json(result)
   } catch (error) {

      res.status(404).json('Erro')   
   }
});

// Lista as metas do ano atual
router.post('/listGoalActualYear', async (req, res, next) => {
   const { companie_id } = req.body;

   try {
      const result = await Financial.listGoalActualYear(companie_id);

      res.status(200).json(result)
   } catch (error) {

      res.status(404).json('Erro')   
   }
});

module.exports = router;