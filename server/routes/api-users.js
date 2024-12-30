const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const { Users } = require('../controllers/users');

router.post('/ListUserByEmail', async (req, res, next) => {
    const {email} = req.body;
    
    try {

        const result = await Users.ListUserByEmail(email);

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')   
    }
});

router.post('/listDataUser', async (req, res, next) => {
    const {hash} = req.body;
    
    try {

        const result = await Users.listDataUser(hash);

        res.status(200).json(result)
    } catch (error) {

        res.status(404).json('Erro')   
    }
});


module.exports = router;