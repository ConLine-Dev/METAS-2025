const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');

const actualYear = new Date().getFullYear();

const Importation = {
   // Lista os processos do ano atual
   listAllProcesses: async function(hash){
      
      let resultByUser = await executeQuery(`
         SELECT
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
            AND c.resignation_date IS NULL
         ORDER BY
            c.name ASC`
      );

      // Verifica se a empresa é ADM, se for retorna tudo da empresa 1 ITJ, 2 MVLOG e 4 SP
      const filterCompanie = resultByUser[0].companie_id_headcargo === 7 /* ADM */ || resultByUser[0].companie_id_headcargo === 8 /* TV */ ? `AND Lhs.IdEmpresa_Sistema IN (1 /*ITJ*/, 2 /*MVLOG*/, 4 /*SP*/)` : `AND Lhs.IdEmpresa_Sistema = ${resultByUser[0].companie_id_headcargo}`

      let result = await executeQuerySQL(`
         SELECT
            Lhs.IdLogistica_House,
            DATEPART(MONTH, Lhs.Data_Abertura_Processo) AS Mes,
            DATEPART(YEAR, Lhs.Data_Abertura_Processo) AS Ano,
            COALESCE(Lmh.Total_TEUS,0) AS Teus,
            Lhs.IdEmpresa_Sistema,
            Lhs.Numero_Processo,
            CASE 
               WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-COURIER'
               WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-NORMAL'
               WHEN Lhs.Tipo_Carga = 3 /* FCL */ THEN 'IM-FCL'
               WHEN Lhs.Tipo_Carga = 4 /* LCL */ THEN 'IM-LCL'
            END AS Tipo_Processo
         FROM
            mov_Logistica_House Lhs
         JOIN
            mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
         LEFT OUTER JOIN
            mov_Logistica_Maritima_House Lmh on Lmh.IdLogistica_House = Lhs.IdLogistica_House
         WHERE
            DATEPART(YEAR, Lhs.Data_Abertura_Processo) = ${actualYear}
            AND Lhs.Situacao_Agenciamento NOT IN (7 /* CANCELADO */)
            AND Lms.Situacao_Embarque NOT IN (4 /* CANCELADO */)
            AND Lhs.Numero_Processo NOT LIKE '%test%'
            AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
            AND Lms.Tipo_Operacao = 2 /* IMPORTACAO */
            ${filterCompanie}
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
            AND c.resignation_date IS NULL
         ORDER BY
            c.name ASC`
      );

      // Verifica se a empresa é ADM, se for retorna tudo da empresa 1 ITJ, 2 MVLOG e 4 SP
      const filterCompanie = resultByUser[0].companie_id_headcargo === 7 /* ADM */ || resultByUser[0].companie_id_headcargo === 8 /* TV */ ? `` : `AND companie_id_headcargo = ${resultByUser[0].companie_id_headcargo}`

      let result = await executeQuery(`SELECT
            companie_id_headcargo,
            value,
            month,
            year,
            type
         FROM 
            goal_commercial
         WHERE
            year = ${actualYear}
            ${filterCompanie}
      `);
   
      return result;
   },
}

module.exports = {
   Importation,
};