const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');

const actualYear = new Date().getFullYear();

const Analytics = {
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

   getProcess: async function(hash, idLogisticaHouse){

      let result = await executeQuerySQL(`SELECT
    Psa.IdPessoa AS Id_Comercial,
    Psa.Nome AS Nome_Comercial,
    Psa.EMail AS Email_Comercial,

    -- Modalidade e Operação agrupadas
    CASE 
        WHEN Lmr.Modalidade_processo = '1' AND Lmr.Tipo_Operacao = 1 THEN 'Exportação Aérea'
        WHEN Lmr.Modalidade_processo = '1' AND Lmr.Tipo_Operacao = 2 THEN 'Importação Aérea'
        WHEN Lmr.Modalidade_processo = '1' AND Lmr.Tipo_Operacao = 3 THEN 'Nacional Aéreo'
        WHEN Lmr.Modalidade_processo = '2' AND Lmr.Tipo_Operacao = 1 THEN 'Exportação Marítima'
        WHEN Lmr.Modalidade_processo = '2' AND Lmr.Tipo_Operacao = 2 THEN 'Importação Marítima'
        WHEN Lmr.Modalidade_processo = '2' AND Lmr.Tipo_Operacao = 3 THEN 'Nacional Marítimo'
        WHEN Lmr.Modalidade_processo = '3' AND Lmr.Tipo_Operacao = 1 THEN 'Exportação Terrestre'
        WHEN Lmr.Modalidade_processo = '3' AND Lmr.Tipo_Operacao = 2 THEN 'Importação Terrestre'
        WHEN Lmr.Modalidade_processo = '3' AND Lmr.Tipo_Operacao = 3 THEN 'Nacional Terrestre'
        ELSE 'Outros'
    END AS Modalidade_Operacao,

    COUNT(DISTINCT Lhs.Numero_Processo) AS Qtd_Processos,

    -- Força o valor 0 caso não haja TEUS (ex: Aéreo)
    SUM(CAST(ISNULL(Lmh.Total_TEUS, 0) AS FLOAT)) AS Qtd_TEUS,

    -- Soma apenas os recebimentos em BRL
    FORMAT(SUM(CASE 
        WHEN Lmo.IdMoeda = 110 THEN ISNULL(Lmo.Total_Recebimento, 0) 
        ELSE 0 
    END), 'C', 'pt-BR') AS Total_Recebido

FROM 
    mov_logistica_house Lhs
LEFT JOIN mov_logistica_master Lmr ON Lmr.IdLogistica_Master = Lhs.IdLogistica_Master
LEFT JOIN mov_Projeto_Atividade_Responsavel Res ON Res.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
LEFT JOIN cad_Pessoa Psa ON Psa.IdPessoa = Res.IdResponsavel
LEFT JOIN cad_Papel_Projeto Ppr ON Ppr.IdPapel_Projeto = Res.IdPapel_Projeto
LEFT JOIN mov_Logistica_Viagem Lvm ON Lvm.IdLogistica_House = Lhs.IdLogistica_House
LEFT JOIN mov_Logistica_Maritima_House Lmh ON Lmh.IdLogistica_House = Lhs.IdLogistica_House
LEFT JOIN mov_Logistica_Moeda Lmo ON Lmo.IdLogistica_House = Lhs.IdLogistica_House

WHERE 
    Lhs.Numero_Processo NOT LIKE '%test%'
    AND Lhs.Numero_Processo NOT LIKE '%demu%'
    AND Lhs.Situacao_Agenciamento NOT IN (7)
    AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())
    AND DATEPART(WEEK, Lhs.Data_Abertura_Processo) = DATEPART(WEEK, GETDATE())
    AND Ppr.Nome = 'Comercial'

GROUP BY 
    Psa.IdPessoa,
    Psa.Nome,
    Psa.EMail,
    Lmr.Modalidade_processo,
    Lmr.Tipo_Operacao

ORDER BY 
    Nome_Comercial,
    Modalidade_Operacao;
`);
  

      return result;
   },

   getProcessTEUS: async function(hash, idLogisticaHouse){

      let result = await executeQuerySQL(`SELECT
    Psa.IdPessoa AS Id_Comercial,
    Psa.Nome AS Nome_Comercial,
    Psa.EMail AS Email_Comercial,
    -- Combinação de Modalidade e Tipo de Operação
    CASE 
        WHEN Lmr.Modalidade_processo = '1' AND Lmr.Tipo_Operacao = 1 THEN 'Exportação Aérea'
        WHEN Lmr.Modalidade_processo = '1' AND Lmr.Tipo_Operacao = 2 THEN 'Importação Aérea'
        WHEN Lmr.Modalidade_processo = '1' AND Lmr.Tipo_Operacao = 3 THEN 'Nacional Aéreo'
        WHEN Lmr.Modalidade_processo = '2' AND Lmr.Tipo_Operacao = 1 THEN 'Exportação Marítima'
        WHEN Lmr.Modalidade_processo = '2' AND Lmr.Tipo_Operacao = 2 THEN 'Importação Marítima'
        WHEN Lmr.Modalidade_processo = '2' AND Lmr.Tipo_Operacao = 3 THEN 'Nacional Marítimo'
        WHEN Lmr.Modalidade_processo = '3' AND Lmr.Tipo_Operacao = 1 THEN 'Exportação Terrestre'
        WHEN Lmr.Modalidade_processo = '3' AND Lmr.Tipo_Operacao = 2 THEN 'Importação Terrestre'
        WHEN Lmr.Modalidade_processo = '3' AND Lmr.Tipo_Operacao = 3 THEN 'Nacional Terrestre'
        ELSE 'Outros'
    END AS Modalidade_Operacao,

    COUNT(DISTINCT Lhs.Numero_Processo) AS Qtd_Processos

FROM 
    mov_logistica_house Lhs
LEFT JOIN mov_logistica_master Lmr ON Lmr.IdLogistica_Master = Lhs.IdLogistica_Master
LEFT JOIN mov_Projeto_Atividade_Responsavel Res ON Res.IdProjeto_Atividade = Lhs.IdProjeto_Atividade
LEFT JOIN cad_Pessoa Psa ON Psa.IdPessoa = Res.IdResponsavel
LEFT JOIN cad_Papel_Projeto Ppr ON Ppr.IdPapel_Projeto = Res.IdPapel_Projeto
LEFT JOIN mov_Logistica_Viagem Lvm ON Lvm.IdLogistica_House = Lhs.IdLogistica_House

WHERE 
    Lhs.Numero_Processo NOT LIKE '%test%'
    AND Lhs.Numero_Processo NOT LIKE '%demu%'
    AND Lhs.Situacao_Agenciamento NOT IN (7)
    AND Lmr.Modalidade_Processo IN (1, 2) -- Aéreo, Marítimo
    AND Lmr.Tipo_Operacao IN (1, 2)      -- Exportação, Importação
    AND DATEPART(YEAR, Lhs.Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())
    AND DATEPART(WEEK, Lhs.Data_Abertura_Processo) = DATEPART(WEEK, GETDATE())
    AND Ppr.Nome = 'Comercial'

GROUP BY 
    Psa.IdPessoa,
    Psa.Nome,
    Psa.EMail,
    Lmr.Modalidade_processo,
    Lmr.Tipo_Operacao

ORDER BY 
    Nome_Comercial,
    Modalidade_Operacao
`);
  

      return result;
   },




}

module.exports = {
   Analytics,
};