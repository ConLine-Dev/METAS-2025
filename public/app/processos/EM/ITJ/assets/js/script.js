const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez",];

async function checkCompany(hash) {
   const getCompanieId = await makeRequest('/api/users/listDataUser', 'POST', { hash: hash }); // Dados de recebimento do ano atual
   const companie_id_headcargo = 1 /* ITJ */

   if (getCompanieId[0].companie_id_headcargo !== companie_id_headcargo) {
      window.location.href = `/app/erro/acesso-nao-autorizado`;
   };
};

// Soma os resultados do meses que localizar no sistema
function sumForMonth(data, allowedMonths) {
   const sumForMonth = [];

   for (let i = 0; i < allowedMonths.length; i++) {
      sumForMonth.push({
         MES: allowedMonths[i],
         EA_NORMAL: 0,
         EA_COURIER: 0,
         EM_LCL: 0,
         EM_FCL_TEUS: 0
      });
   }

   for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      // Encontra o objeto do mês para atualizar
      const monthObj = sumForMonth.find(m => m.MES === item.Mes);
      if (!monthObj) continue;

      // Incrementa os contadores com base no tipo de processo
      switch(item.Tipo_Processo) {
         case 'EA-NORMAL':
               monthObj.EA_NORMAL++;
               break;
         case 'EA-COURIER':
            monthObj.EA_COURIER++;
            break;
         case 'EM-LCL':
            monthObj.EM_LCL++;
            break;
         case 'EM-FCL':
            monthObj.EM_FCL_TEUS += item.Teus;
            break;
      }
   }

   // Garantir que os meses estejam na ordem correta
   sumForMonth.sort((a, b) => a.MES - b.MES);
   return sumForMonth;
};

// Separa os arrays por tipo de processo
function separateArraysByType(arrayValuesForMonth) {
   const ea_normal = [];
   const ea_courier = [];
   const em_lcl = [];
   const em_fcl_teus = [];

   arrayValuesForMonth.forEach(month => {
      ea_normal.push(month.EA_NORMAL);
      ea_courier.push(month.EA_COURIER);
      em_lcl.push(month.EM_LCL);
      em_fcl_teus.push(month.EM_FCL_TEUS);
   });

   return {ea_normal, ea_courier, em_lcl, em_fcl_teus};
};

// Cria o grafico mes a mes
let chartEM_LCL = null;
let chartEM_FCL = null;
let chartEA_NORMAL = null;
let chartEA_COURIER = null;
async function graphicMonthForMonth(dataActualYear, dataGoal) {
   // Extrai os meses permitidos do dataGoal
   const allowedMonths = [...new Set(dataGoal.map((item) => item.month))]

   // Atualiza os meses permitidos no sumForMonth
   const arrayValuesForMonth = sumForMonth(dataActualYear, allowedMonths);
   const separatedArrays = separateArraysByType(arrayValuesForMonth);


      // Determinar o último mês com metas lançadas
      const maxMonth = Math.max(...allowedMonths);

      // Soma de faturamento total por empresa, considerando até o último mês com metas
      const filterValues_EMLCL_ITJ = dataActualYear.filter((item) => item.IdEmpresa_Sistema === 1 && item.Mes <= maxMonth && item.Tipo_Processo === 'EM-LCL').length;
      const filterValues_EMFCL_ITJ = dataActualYear.filter((item) => item.IdEmpresa_Sistema === 1 && item.Mes <= maxMonth && item.Tipo_Processo === 'EM-FCL').reduce((acc, item) => acc + item.Teus, 0);
      const filterValues_EA_NORMAL_ITJ = dataActualYear.filter((item) => item.IdEmpresa_Sistema === 1 && item.Mes <= maxMonth && item.Tipo_Processo === 'EA-NORMAL').length;
      const filterValues_EA_COURIER_ITJ = dataActualYear.filter((item) => item.IdEmpresa_Sistema === 1 && item.Mes <= maxMonth && item.Tipo_Processo === 'EA-COURIER').length;
   
      document.getElementById('EM-LCL-ANUAL-ITJ').textContent = filterValues_EMLCL_ITJ;
      document.getElementById('EM-TEUS-ANUAL-ITJ').textContent = filterValues_EMFCL_ITJ;
      document.getElementById('EA-NORMAL-ANUAL-ITJ').textContent = filterValues_EA_NORMAL_ITJ;
      document.getElementById('EA-COURIER-ANUAL-ITJ').textContent = filterValues_EA_COURIER_ITJ;
   
      // Soma de meta total por empresa
      const filterGoals_EM_LCL_PROCESSOS_ITJ = dataGoal.filter((item) => item.companie_id_headcargo === 1 && item.type === 'EM-LCL-PROCESSOS').reduce((acc, item) => acc + item.value, 0);
      const filterGoals_EM_FCL_TEUS_ITJ = dataGoal.filter((item) => item.companie_id_headcargo === 1 && item.type === 'EM-TEUS').reduce((acc, item) => acc + item.value, 0);
      const filterGoals_EA_NORMAL_PROCESSOS_ITJ = dataGoal.filter((item) => item.companie_id_headcargo === 1 && item.type === 'EA-NORMAL-PROCESSOS').reduce((acc, item) => acc + item.value, 0);
      const filterGoals_EA_COURIER_PROCESSOS_ITJ = dataGoal.filter((item) => item.companie_id_headcargo === 1 && item.type === 'EA-COURIER-PROCESSOS').reduce((acc, item) => acc + item.value, 0);
   
      document.getElementById('EM-LCL-META-ANUAL-ITJ').textContent = filterGoals_EM_LCL_PROCESSOS_ITJ;
      document.getElementById('EM-TEUS-META-ANUAL-ITJ').textContent = filterGoals_EM_FCL_TEUS_ITJ;
      document.getElementById('EA-NORMAL-META-ANUAL-ITJ').textContent = filterGoals_EA_NORMAL_PROCESSOS_ITJ;
      document.getElementById('EA-COURIER-META-ANUAL-ITJ').textContent = filterGoals_EA_COURIER_PROCESSOS_ITJ;

      

   // Extrai apenas os valores de cada MES / Tipo de processo
   const em_lcl = separatedArrays.em_lcl;
   const em_fcl_teus = separatedArrays.em_fcl_teus;
   const ea_normal = separatedArrays.ea_normal;
   const ea_courier = separatedArrays.ea_courier;
   
   // Extrai as METAS de cada mês e tipo de processo
   const goalForMonth = {
      em_lcl: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'EM-LCL-PROCESSOS').map(item => item.value),
      em_fcl_teus: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'EM-TEUS').map(item => item.value),
      ea_normal: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'EA-NORMAL-PROCESSOS').map(item => item.value),
      ea_courier: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'EA-COURIER-PROCESSOS').map(item => item.value),
   };

   const goalForMonthEM_LCL = goalForMonth.em_lcl;
   const goalForMonthEM_FCL_TEUS = goalForMonth.em_fcl_teus;
   const goalForMonthEA_NORMAL = goalForMonth.ea_normal;
   const goalForMonthEA_COURIER = goalForMonth.ea_courier;

   // Gráfico de Processos de Exportação Marítima FCL
   var optionsEM_LCL = {
      series: [
         {
            name: "Valores",
            data: em_lcl,
         },
         {
            name: "Meta",
            data: goalForMonthEM_LCL,
         },
      ],
  
      chart: {
         type: "bar",
         height: 700,
         toolbar: {
            show: false,
         },
      },
  
      colors: ["#F9423A", "#3F2021"],
  
      plotOptions: {
         bar: {
            borderRadius: 2,
            columnWidth: "25%",
            horizontal: true,
            dataLabels: {
               position: "top",
            },
         },
      },
  
      dataLabels: {
         enabled: true,
         enabledOnSeries: [0, 1], // ativa os rótulos para ambas as séries
         formatter: function (val, opts) {
            const seriesIndex = opts.seriesIndex;
            if (seriesIndex === 0) {
               // Se for a primeira serie de processos do ano atual, mostra o valor correspondente
               return em_lcl[opts.dataPointIndex];
            } else if (seriesIndex === 1) {
               // Se for a segunda sére (Meta), mostra o valor correspondente
               return goalForMonthEM_LCL[opts.dataPointIndex];
            }
         },
         offsetX: 30,
         style: {
            fontSize: "12px",
            colors: ["#F9423A", "#3F2021"],
         },
         background: {
            enabled: true,
            foreColor: "#fff",
            borderRadius: 2,
            padding: 4,
            opacity: 0.9,
            borderWidth: 1,
            borderColor: "#fff",
         },
      },
  
      stroke: {
         show: true,
         width: 1,
         colors: ["#fff"],
      },
  
      tooltip: {
         shared: true,
         enabled: false,
         intersect: false,
      },
  
      xaxis: {
         categories: allowedMonths.map((mes) => months[mes - 1]),
         labels: {
            show: false,
         },
      },
  
      xaxis: {
         categories: allowedMonths.map((mes) => months[mes - 1]),
         labels: {
           show: false,
         },
      },
   };

   if (chartEM_LCL) {
      chartEM_LCL.updateOptions(optionsEM_LCL);
   } else {
      chartEM_LCL = new ApexCharts(
         document.querySelector("#EM-LCL"),
         optionsEM_LCL
      );
      chartEM_LCL.render();
   }


   // Gráfico de Processos de Exportação Marítima FCL
   var optionsEM_FCL = {
      series: [
         {
            name: "Valores",
            data: em_fcl_teus,
         },
         {
            name: "Meta",
            data: goalForMonthEM_FCL_TEUS,
         },
      ],
  
      chart: {
         type: "bar",
         height: 700,
         toolbar: {
            show: false,
         },
      },
  
      colors: ["#F9423A", "#3F2021"],
  
      plotOptions: {
         bar: {
            borderRadius: 2,
            columnWidth: "25%",
            horizontal: true,
            dataLabels: {
               position: "top",
            },
         },
      },
  
      dataLabels: {
         enabled: true,
         enabledOnSeries: [0, 1], // ativa os rótulos para ambas as séries
         formatter: function (val, opts) {
            const seriesIndex = opts.seriesIndex;
            if (seriesIndex === 0) {
               // Se for a primeira serie de processos do ano atual, mostra o valor correspondente
               return em_fcl_teus[opts.dataPointIndex];
            } else if (seriesIndex === 1) {
               // Se for a segunda sére (Meta), mostra o valor correspondente
               return goalForMonthEM_FCL_TEUS[opts.dataPointIndex];
            }
         },
         offsetX: 30,
         style: {
            fontSize: "12px",
            colors: ["#F9423A", "#3F2021"],
         },
         background: {
            enabled: true,
            foreColor: "#fff",
            borderRadius: 2,
            padding: 4,
            opacity: 0.9,
            borderWidth: 1,
            borderColor: "#fff",
         },
      },
  
      stroke: {
         show: true,
         width: 1,
         colors: ["#fff"],
      },
  
      tooltip: {
         shared: true,
         enabled: false,
         intersect: false,
      },
  
      xaxis: {
         categories: allowedMonths.map((mes) => months[mes - 1]),
         labels: {
            show: false,
         },
      },
  
      xaxis: {
         categories: allowedMonths.map((mes) => months[mes - 1]),
         labels: {
           show: false,
         },
      },
   };

   if (chartEM_FCL) {
      chartEM_FCL.updateOptions(optionsEM_FCL);
   } else {
      chartEM_FCL = new ApexCharts(
         document.querySelector("#EM-FCL"),
         optionsEM_FCL
      );
      chartEM_FCL.render();
   }


   // Gráfico de Processos de Importação Aérea NORMAL
   var optionsEA_NORMAL = {
      series: [
         {
            name: "Valores",
            data: ea_normal,
         },
         {
            name: "Meta",
            data: goalForMonthEA_NORMAL,
         },
      ],
   
      chart: {
         type: "bar",
         height: 700,
         toolbar: {
            show: false,
         },
      },
   
      colors: ["#F9423A", "#3F2021"],
   
      plotOptions: {
         bar: {
            borderRadius: 2,
            columnWidth: "25%",
            horizontal: true,
            dataLabels: {
               position: "top",
            },
         },
      },
   
      dataLabels: {
         enabled: true,
         enabledOnSeries: [0, 1], // ativa os rótulos para ambas as séries
         formatter: function (val, opts) {
            const seriesIndex = opts.seriesIndex;
            if (seriesIndex === 0) {
               // Se for a primeira serie de processos do ano atual, mostra o valor correspondente
               return ea_normal[opts.dataPointIndex];
            } else if (seriesIndex === 1) {
               // Se for a segunda sére (Meta), mostra o valor correspondente
               return goalForMonthEA_NORMAL[opts.dataPointIndex];
            }
         },
         offsetX: 30,
         style: {
            fontSize: "12px",
            colors: ["#F9423A", "#3F2021"],
         },
         background: {
            enabled: true,
            foreColor: "#fff",
            borderRadius: 2,
            padding: 4,
            opacity: 0.9,
            borderWidth: 1,
            borderColor: "#fff",
         },
      },
   
      stroke: {
         show: true,
         width: 1,
         colors: ["#fff"],
      },
   
      tooltip: {
         shared: true,
         enabled: false,
         intersect: false,
      },
   
      xaxis: {
         categories: allowedMonths.map((mes) => months[mes - 1]),
         labels: {
            show: false,
         },
      },
   
      xaxis: {
         categories: allowedMonths.map((mes) => months[mes - 1]),
         labels: {
            show: false,
         },
      },
   };

   if (chartEA_NORMAL) {
      chartEA_NORMAL.updateOptions(optionsEA_NORMAL);
   } else {
      chartEA_NORMAL = new ApexCharts(
         document.querySelector("#EA-NORMAL"),
         optionsEA_NORMAL
      );
      chartEA_NORMAL.render();
   }


   // Gráfico de Processos de Importação Aérea COURIER
   var optionsEA_COURIER = {
      series: [
         {
            name: "Valores",
            data: ea_courier,
         },
         {
            name: "Meta",
            data: goalForMonthEA_COURIER,
         },
      ],
   
      chart: {
         type: "bar",
         height: 700,
         toolbar: {
            show: false,
         },
      },
   
      colors: ["#F9423A", "#3F2021"],
   
      plotOptions: {
         bar: {
            borderRadius: 2,
            columnWidth: "25%",
            horizontal: true,
            dataLabels: {
               position: "top",
            },
         },
      },
   
      dataLabels: {
         enabled: true,
         enabledOnSeries: [0, 1], // ativa os rótulos para ambas as séries
         formatter: function (val, opts) {
            const seriesIndex = opts.seriesIndex;
            if (seriesIndex === 0) {
               // Se for a primeira serie de processos do ano atual, mostra o valor correspondente
               return ea_courier[opts.dataPointIndex];
            } else if (seriesIndex === 1) {
               // Se for a segunda sére (Meta), mostra o valor correspondente
               return goalForMonthEA_COURIER[opts.dataPointIndex];
            }
         },
         offsetX: 30,
         style: {
            fontSize: "12px",
            colors: ["#F9423A", "#3F2021"],
         },
         background: {
            enabled: true,
            foreColor: "#fff",
            borderRadius: 2,
            padding: 4,
            opacity: 0.9,
            borderWidth: 1,
            borderColor: "#fff",
         },
      },
   
      stroke: {
         show: true,
         width: 1,
         colors: ["#fff"],
      },
   
      tooltip: {
         shared: true,
         enabled: false,
         intersect: false,
      },
   
      xaxis: {
         categories: allowedMonths.map((mes) => months[mes - 1]),
         labels: {
            show: false,
         },
      },
   
      xaxis: {
         categories: allowedMonths.map((mes) => months[mes - 1]),
         labels: {
            show: false,
         },
      },
   };

   if (chartEA_COURIER) {
      chartEA_COURIER.updateOptions(optionsEA_COURIER);
   } else {
      chartEA_COURIER = new ApexCharts(
         document.querySelector("#EA-COURIER"),
         optionsEA_COURIER
      );
      chartEA_COURIER.render();
   }
};


document.addEventListener("DOMContentLoaded", async () => {
   await checkLogin(); // Verifica se o usuario esta logado/ativo
   const getLocalStorage = localStorage.getItem('hash');
   const dataLocal = JSON.parse(getLocalStorage);
   await checkCompany(dataLocal.hash_code); // Verifica se o usuario esta na pagina referente a filial que ele tem acesso

   const listAllProcesses = await makeRequest('/api/exportation/listAllProcesses', 'POST', { hash: dataLocal.hash_code }); // Lista os recebimentos do ano atual
   const listGoalActualYear = await makeRequest('/api/exportation/listGoalActualYear', 'POST', { hash: dataLocal.hash_code}); // Lista as metas do ano atual
   graphicMonthForMonth(listAllProcesses, listGoalActualYear)

   document.querySelector('#loader2').classList.add('d-none');
});

// Socket IO para ficar atualizando as informações na tela
const socket = io();

socket.on('newProcess', async function (msg) {
   const getLocalStorage = localStorage.getItem('hash');
   const dataLocal = JSON.parse(getLocalStorage);
   await checkCompany(dataLocal.hash_code); // Verifica se o usuario esta na pagina referente a filial que ele tem acesso

   const listAllProcesses = await makeRequest('/api/exportation/listAllProcesses', 'POST', { hash: dataLocal.hash_code }); // Lista os recebimentos do ano atual
   const listGoalActualYear = await makeRequest('/api/exportation/listGoalActualYear', 'POST', { hash: dataLocal.hash_code}); // Lista as metas do ano atual
   graphicMonthForMonth(listAllProcesses, listGoalActualYear)
})

// Importa e inicializa o listener de métricas de processo
// Certifique-se de que o arquivo process-metrics-listener.js está incluído no HTML antes deste script
if (typeof initProcessMetricsListener === 'function') {
   console.log('initProcessMetricsListener')
  initProcessMetricsListener(socket);
}