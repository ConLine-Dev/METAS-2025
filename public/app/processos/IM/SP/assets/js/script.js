const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez",];

async function checkCompany(hash) {
   const getCompanieId = await makeRequest('/api/users/listDataUser', 'POST', { hash: hash }); // Dados de recebimento do ano atual
   const companie_id_headcargo = 4 /* SP */

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
         IA_NORMAL: 0,
         IA_COURIER: 0,
         IM_LCL: 0,
         IM_FCL_TEUS: 0
      });
   }

   for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      // Encontra o objeto do mês para atualizar
      const monthObj = sumForMonth.find(m => m.MES === item.Mes);
      if (!monthObj) continue;

      // Incrementa os contadores com base no tipo de processo
      switch(item.Tipo_Processo) {
         case 'IA-NORMAL':
               monthObj.IA_NORMAL++;
               break;
         case 'IA-COURIER':
            monthObj.IA_COURIER++;
            break;
         case 'IM-LCL':
            monthObj.IM_LCL++;
            break;
         case 'IM-FCL':
            monthObj.IM_FCL_TEUS += item.Teus;
            break;
      }
   }

   // Garantir que os meses estejam na ordem correta
   sumForMonth.sort((a, b) => a.MES - b.MES);
   return sumForMonth;
};

// Separa os arrays por tipo de processo
function separateArraysByType(arrayValuesForMonth) {
   const ia_normal = [];
   // const ia_courier = [];
   const im_lcl = [];
   const im_fcl_teus = [];

   arrayValuesForMonth.forEach(month => {
      ia_normal.push(month.IA_NORMAL);
      // ia_courier.push(month.IA_COURIER);
      im_lcl.push(month.IM_LCL);
      im_fcl_teus.push(month.IM_FCL_TEUS);
   });

   return {
      ia_normal, 
      // ia_courier, 
      im_lcl, 
      im_fcl_teus};
};

// Cria o grafico mes a mes
let chartIM_LCL = null;
let chartIM_FCL = null;
let chartIA_NORMAL = null;
// let chartIA_COURIER = null;
async function graphicMonthForMonth(dataActualYear, dataGoal) {
   // Extrai os meses permitidos do dataGoal
   const allowedMonths = [...new Set(dataGoal.map((item) => item.month))]

   // Atualiza os meses permitidos no sumForMonth
   const arrayValuesForMonth = sumForMonth(dataActualYear, allowedMonths);
   const separatedArrays = separateArraysByType(arrayValuesForMonth);

   // Extrai apenas os valores de cada MES / Tipo de processo
   const im_lcl = separatedArrays.im_lcl;
   const im_fcl_teus = separatedArrays.im_fcl_teus;
   const ia_normal = separatedArrays.ia_normal;
   // const ia_courier = separatedArrays.ia_courier;
   
   // Extrai as METAS de cada mês e tipo de processo
   const goalForMonth = {
      im_lcl: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'IM-LCL-PROCESSOS').map(item => item.value),
      im_fcl_teus: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'IM-TEUS').map(item => item.value),
      ia_normal: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'IA-NORMAL-PROCESSOS').map(item => item.value),
      // ia_courier: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'IA-COURIER-PROCESSOS').map(item => item.value),
   };

   const goalForMonthIM_LCL = goalForMonth.im_lcl;
   const goalForMonthIM_FCL_TEUS = goalForMonth.im_fcl_teus;
   const goalForMonthIA_NORMAL = goalForMonth.ia_normal;
   // const goalForMonthIA_COURIER = goalForMonth.ia_courier;

   // Gráfico de Processos de Importação Marítima FCL
   var optionsIM_LCL = {
      series: [
         {
            name: "Valores",
            data: im_lcl,
         },
         {
            name: "Meta",
            data: goalForMonthIM_LCL,
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
               return im_lcl[opts.dataPointIndex];
            } else if (seriesIndex === 1) {
               // Se for a segunda sére (Meta), mostra o valor correspondente
               return goalForMonthIM_LCL[opts.dataPointIndex];
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

   if (chartIM_LCL) {
      chartIM_LCL.updateOptions(optionsIM_LCL);
   } else {
      chartIM_LCL = new ApexCharts(
         document.querySelector("#IM-LCL"),
         optionsIM_LCL
      );
      chartIM_LCL.render();
   }


   // Gráfico de Processos de Importação Marítima FCL
   var optionsIM_FCL = {
      series: [
         {
            name: "Valores",
            data: im_fcl_teus,
         },
         {
            name: "Meta",
            data: goalForMonthIM_FCL_TEUS,
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
               return im_fcl_teus[opts.dataPointIndex];
            } else if (seriesIndex === 1) {
               // Se for a segunda sére (Meta), mostra o valor correspondente
               return goalForMonthIM_FCL_TEUS[opts.dataPointIndex];
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

   if (chartIM_FCL) {
      chartIM_FCL.updateOptions(optionsIM_FCL);
   } else {
      chartIM_FCL = new ApexCharts(
         document.querySelector("#IM-FCL"),
         optionsIM_FCL
      );
      chartIM_FCL.render();
   }


   // Gráfico de Processos de Importação Aérea NORMAL
   var optionsIA_NORMAL = {
      series: [
         {
            name: "Valores",
            data: ia_normal,
         },
         {
            name: "Meta",
            data: goalForMonthIA_NORMAL,
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
               return ia_normal[opts.dataPointIndex];
            } else if (seriesIndex === 1) {
               // Se for a segunda sére (Meta), mostra o valor correspondente
               return goalForMonthIA_NORMAL[opts.dataPointIndex];
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

   if (chartIA_NORMAL) {
      chartIA_NORMAL.updateOptions(optionsIA_NORMAL);
   } else {
      chartIA_NORMAL = new ApexCharts(
         document.querySelector("#IA-NORMAL"),
         optionsIA_NORMAL
      );
      chartIA_NORMAL.render();
   }


   // Gráfico de Processos de Importação Aérea COURIER
   // var optionsIA_COURIER = {
   //    series: [
   //       {
   //          name: "Valores",
   //          data: ia_courier,
   //       },
   //       {
   //          name: "Meta",
   //          data: goalForMonthIA_COURIER,
   //       },
   //    ],
   
   //    chart: {
   //       type: "bar",
   //       height: 700,
   //       toolbar: {
   //          show: false,
   //       },
   //    },
   
   //    colors: ["#F9423A", "#3F2021"],
   
   //    plotOptions: {
   //       bar: {
   //          borderRadius: 2,
   //          columnWidth: "25%",
   //          horizontal: true,
   //          dataLabels: {
   //             position: "top",
   //          },
   //       },
   //    },
   
   //    dataLabels: {
   //       enabled: true,
   //       enabledOnSeries: [0, 1], // ativa os rótulos para ambas as séries
   //       formatter: function (val, opts) {
   //          const seriesIndex = opts.seriesIndex;
   //          if (seriesIndex === 0) {
   //             // Se for a primeira serie de processos do ano atual, mostra o valor correspondente
   //             return ia_courier[opts.dataPointIndex];
   //          } else if (seriesIndex === 1) {
   //             // Se for a segunda sére (Meta), mostra o valor correspondente
   //             return goalForMonthIA_COURIER[opts.dataPointIndex];
   //          }
   //       },
   //       offsetX: 30,
   //       style: {
   //          fontSize: "12px",
   //          colors: ["#F9423A", "#3F2021"],
   //       },
   //       background: {
   //          enabled: true,
   //          foreColor: "#fff",
   //          borderRadius: 2,
   //          padding: 4,
   //          opacity: 0.9,
   //          borderWidth: 1,
   //          borderColor: "#fff",
   //       },
   //    },
   
   //    stroke: {
   //       show: true,
   //       width: 1,
   //       colors: ["#fff"],
   //    },
   
   //    tooltip: {
   //       shared: true,
   //       enabled: false,
   //       intersect: false,
   //    },
   
   //    xaxis: {
   //       categories: allowedMonths.map((mes) => months[mes - 1]),
   //       labels: {
   //          show: false,
   //       },
   //    },
   
   //    xaxis: {
   //       categories: allowedMonths.map((mes) => months[mes - 1]),
   //       labels: {
   //          show: false,
   //       },
   //    },
   // };

   // if (chartIA_COURIER) {
   //    chartIA_COURIER.updateOptions(optionsIA_COURIER);
   // } else {
   //    chartIA_COURIER = new ApexCharts(
   //       document.querySelector("#IA-COURIER"),
   //       optionsIA_COURIER
   //    );
   //    chartIA_COURIER.render();
   // }
};


document.addEventListener("DOMContentLoaded", async () => {
   await checkLogin(); // Verifica se o usuario esta logado/ativo
   const getLocalStorage = localStorage.getItem('hash');
   const dataLocal = JSON.parse(getLocalStorage);
   await checkCompany(dataLocal.hash_code); // Verifica se o usuario esta na pagina referente a filial que ele tem acesso

   const listAllProcesses = await makeRequest('/api/importation/listAllProcesses', 'POST', { hash: dataLocal.hash_code }); // Lista os recebimentos do ano atual
   const listGoalActualYear = await makeRequest('/api/importation/listGoalActualYear', 'POST', { hash: dataLocal.hash_code}); // Lista as metas do ano atual
   graphicMonthForMonth(listAllProcesses, listGoalActualYear)

   document.querySelector('#loader2').classList.add('d-none');
});

// Socket IO para ficar atualizando as informações na tela
const socket = io();

socket.on('newProcess', async function (msg) {
   const getLocalStorage = localStorage.getItem('hash');
   const dataLocal = JSON.parse(getLocalStorage);
   await checkCompany(dataLocal.hash_code); // Verifica se o usuario esta na pagina referente a filial que ele tem acesso

   const listAllProcesses = await makeRequest('/api/importation/listAllProcesses', 'POST', { hash: dataLocal.hash_code }); // Lista os recebimentos do ano atual
   const listGoalActualYear = await makeRequest('/api/importation/listGoalActualYear', 'POST', { hash: dataLocal.hash_code}); // Lista as metas do ano atual
   graphicMonthForMonth(listAllProcesses, listGoalActualYear)
})

// Importa e inicializa o listener de métricas de processo
// Certifique-se de que o arquivo process-metrics-listener.js está incluído no HTML antes deste script
if (typeof initProcessMetricsListener === 'function') {
   console.log('initProcessMetricsListener')
  initProcessMetricsListener(socket);
}