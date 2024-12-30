const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');

const actualYear = new Date().getFullYear();

const Financial = {
   // Lista os recebimentos do ano atual
   listReceiptActualYear: async function(hash){
      
      let resultByUser = await executeQuery(`SELECT
            c.id_headcargo,
            com.companie_id_headcargo,
            c.name,
            c.family_name
         FROM
            users u
         JOIN
            collaborators c ON c.id = u.collaborator_id
         LEFT OUTER JOIN
            companies com ON com.id = c.companie_id
         WHERE
            c.hash_code = '${hash}'
         ORDER BY
            c.name ASC`
      );

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
         AND Lhs.IdEmpresa_Sistema = ${resultByUser[0].companie_id_headcargo}
      `);
   
      return result;
   },

   // Lista as metas do ano atual
   listGoalActualYear: async function(hash){
      let resultByUser = await executeQuery(`SELECT
            c.id_headcargo,
            com.companie_id_headcargo,
            c.name,
            c.family_name
         FROM
            users u
         JOIN
            collaborators c ON c.id = u.collaborator_id
         LEFT OUTER JOIN
            companies com ON com.id = c.companie_id
         WHERE
            c.hash_code = '${hash}'
         ORDER BY
            c.name ASC`
      );

      let result = await executeQuery(`SELECT
            companie_id_headcargo,
            value,
            month,
            year
         FROM 
            goal_financial
         WHERE
            year = ${actualYear}
            AND companie_id_headcargo = ${resultByUser[0].companie_id_headcargo}
      `);
   
      return result;
   },
}

module.exports = {
   Financial,
};