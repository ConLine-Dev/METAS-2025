const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');

const actualYear = new Date().getFullYear();

const Financial = {
   // Lista os recebimentos do ano atual
   listReceiptActualYear: async function(idcompany){

      let result = await executeQuerySQL(`SELECT
         Lhs.IdLogistica_House,
         Lhs.Numero_Processo,
         DATEPART(MONTH, Lhs.Data_Abertura_Processo) AS Mes,
         DATEPART(YEAR, Lhs.Data_Abertura_Processo) AS Ano,
         Lmo.Total_Recebimento
      FROM
         mov_Logistica_House Lhs
      JOIN
         mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House
      WHERE
         Lmo.IdMoeda = 110 -- BRL
         AND Lhs.Situacao_Agenciamento NOT IN (7 /* CANCELADO */)
         AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) = ${actualYear}
         AND Lhs.IdEmpresa_Sistema = ${idcompany}
      `);
   
      return result;
   },

   // Lista as metas do ano atual
   listGoalActualYear: async function(companie_id){

      let result = await executeQuery(`SELECT
            companie_id,
            value,
            month,
            year
         FROM 
            goal_financial
         WHERE
            year = ${actualYear}
            AND companie_id = ${companie_id}
      `);
   
      return result;
   },
}

module.exports = {
   Financial,
};