const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez",];

async function checkCompany(hash) {
   const getCompanieId = await makeRequest('/api/users/listDataUser', 'POST', { hash: hash }); // Dados de recebimento do ano atual
   const companie_id_headcargo = 7 /* ADM */

   if (getCompanieId[0].companie_id_headcargo !== companie_id_headcargo) {
      window.location.href = `/app/erro/acesso-nao-autorizado`;
   };
};

let chartUpdateITJ = null;
let chartUpdateSP = null;
// Cria o grafico mes a mes
function graphicMonthForMonth(dataActualYear, dataGoal) {
   // Extrair os meses permitidos do dataGoal
   const allowedMonths = [...new Set(dataGoal.map((item) => item.month))];

   // Determinar o último mês com metas lançadas
   const maxMonth = Math.max(...allowedMonths);

   // Soma de faturamento total por empresa, considerando até o último mês com metas
   const filterValuesITJ = dataActualYear.filter(
      (item) => item.IdEmpresa_Sistema === 1 && item.Mes <= maxMonth
   );
   const filterValuesSP = dataActualYear.filter(
      (item) => item.IdEmpresa_Sistema === 4 && item.Mes <= maxMonth
   );

   const totalValuesITJ = filterValuesITJ.reduce((sum, item) => sum + item.Total_Recebimento, 0);
   const totalValuesSP = filterValuesSP.reduce((sum, item) => sum + item.Total_Recebimento, 0);

   document.getElementById('card-faturamento-anual-ITJ').textContent = totalValuesITJ.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
   document.getElementById('card-faturamento-anual-SP').textContent = totalValuesSP.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

   // Soma de meta total por empresa
   const filterGoalsITJ = dataGoal.filter((item) => item.companie_id_headcargo === 1);
   const filterGoalsSP = dataGoal.filter((item) => item.companie_id_headcargo === 4);
   const totalGoalsITJ = filterGoalsITJ.reduce((sum, item) => sum + item.value, 0);
   const totalGoalsSP = filterGoalsSP.reduce((sum, item) => sum + item.value, 0);

   document.getElementById('card-meta-ITJ').textContent = totalGoalsITJ.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
   document.getElementById('card-meta-SP').textContent = totalGoalsSP.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

   // Agrupar os valores por IdEmpresa_Sistema e mês
   const groupValuesByCompanyIdAndMonth = (data) => {
      const grouped = {};

      data.forEach((item) => {
         const companyId = item.IdEmpresa_Sistema;
         if (!grouped[companyId]) {
            grouped[companyId] = Array(allowedMonths.length).fill(0);
         }

         // Encontrar o índice do mês no array de meses permitidos
         const monthIndex = allowedMonths.indexOf(item.Mes);
         if (monthIndex !== -1) {
            grouped[companyId][monthIndex] += item.Total_Recebimento;
         }
      });

      return grouped;
   };

   // Agrupar as metas por IdEmpresa_Sistema e mês
   const groupGoalsByCompanyIdAndMonth = (data) => {
      const grouped = {};

      data.forEach((item) => {
         const companyId = item.companie_id_headcargo;
         if (!grouped[companyId]) {
            grouped[companyId] = Array(allowedMonths.length).fill(0);
         }

         // Encontrar o índice do mês no array de meses permitidos
         const monthIndex = allowedMonths.indexOf(item.month);
         if (monthIndex !== -1) {
            grouped[companyId][monthIndex] += item.value;
         }
      });

      return grouped;
   };

   // Processar os valores recebidos
   const totalValuesByCompanyId = groupValuesByCompanyIdAndMonth(dataActualYear);

   // Processar as metas
   const totalGoalsByCompanyId = groupGoalsByCompanyIdAndMonth(dataGoal);

   // Determinar o número total de meses permitidos
   const numMonths = allowedMonths.length;

   // Criar constantes separadas para as empresas por IdEmpresa_Sistema
   const valuesCompanyITJ = totalValuesByCompanyId[1] || Array(numMonths).fill(0);
   const valuesCompanySP = totalValuesByCompanyId[4] || Array(numMonths).fill(0);

   const goalsCompanyITJ = totalGoalsByCompanyId[1] || Array(numMonths).fill(0);
   const goalsCompanySP = totalGoalsByCompanyId[4] || Array(numMonths).fill(0);

   // Gráfico ITJ
   var optionsITJ = {
      series: [
         {
            name: 'Faturamento ITJ',
            type: "column",
            data: valuesCompanyITJ
         },
         {
            name: 'Meta ITJ',
            type: "column",
            data: goalsCompanyITJ
         },
      ],

      chart: {
         type: 'bar',
         height: 455,
         stacked: false,
         toolbar: {
            show: false,
         },
      },

      colors: ['#f9423a','#3F2021'],

      plotOptions: {
         bar: {
            borderRadius: 3,
            columnWidth: '50%',
            horizontal: false,
            dataLabels: {
               position: 'top',
            },
         }
      },

      dataLabels: {
         enabled: false,
      },

      stroke: {
         show: true,
         width: 1,
         colors: ['#fff']
      },

      tooltip: {
         shared: true,
         enabled: true,
         intersect: false,
         y: {
            formatter: function (val) {
               return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
         }
      },

      xaxis: {
         categories: allowedMonths.map((mes) => months[mes - 1]),
         position: "bottom",
         axisBorder: {
            show: false,
         },
         axisTicks: {
            show: false,
         },
         crosshairs: {
            fill: {
               type: "gradient",
               gradient: {
                  colorFrom: "#D8E3F0",
                  colorTo: "#BED1E6",
                  stops: [0, 100],
                  opacityFrom: 0.4,
                  opacityTo: 0.5,
               },
            },
         },
      },

      yaxis: {
         show: false,
      },
   };

   if (chartUpdateITJ) {
      chartUpdateITJ.updateOptions(optionsITJ);
   } else {
      chartUpdateITJ = new ApexCharts(
         document.querySelector("#meta-mes-a-mes-ITJ"),
         optionsITJ
      );
      chartUpdateITJ.render();
   }


   // Gráfico SP
   var optionsSP = {
      series: [
         {
            name: 'Faturamento SP',
            type: "column",
            data: valuesCompanySP
         },
         {
            name: 'Meta SP',
            type: "column",
            data: goalsCompanySP
         },
      ],

      chart: {
         type: 'bar',
         height: 455,
         stacked: false,
         toolbar: {
            show: false,
         },
      },

      colors: ['#f9423a','#3F2021'],

      plotOptions: {
         bar: {
            borderRadius: 3,
            columnWidth: '50%',
            horizontal: false,
            dataLabels: {
               position: 'top',
            },
         }
      },

      dataLabels: {
         enabled: false,
      },

      stroke: {
         show: true,
         width: 1,
         colors: ['#fff']
      },

      tooltip: {
         shared: true,
         enabled: true,
         intersect: false,
         y: {
            formatter: function (val) {
               return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
         }
      },

      xaxis: {
         categories: allowedMonths.map((mes) => months[mes - 1]),
         position: "bottom",
         axisBorder: {
            show: false,
         },
         axisTicks: {
            show: false,
         },
         crosshairs: {
            fill: {
               type: "gradient",
               gradient: {
                  colorFrom: "#D8E3F0",
                  colorTo: "#BED1E6",
                  stops: [0, 100],
                  opacityFrom: 0.4,
                  opacityTo: 0.5,
               },
            },
         },
      },

      yaxis: {
         show: false,
      },
   };

   if (chartUpdateSP) {
      chartUpdateSP.updateOptions(optionsSP);
   } else {
      chartUpdateSP = new ApexCharts(
         document.querySelector("#meta-mes-a-mes-SP"),
         optionsSP
      );
      chartUpdateSP.render();
   }
};

document.addEventListener("DOMContentLoaded", async () => {
   await checkLogin(); // Verifica se o usuario esta logado/ativo
   const getLocalStorage = localStorage.getItem('hash');
   const dataLocal = JSON.parse(getLocalStorage);
   await checkCompany(dataLocal.hash_code); // Verifica se o usuario esta na pagina referente a filial que ele tem acesso

   const receiptActualYear = await makeRequest('/api/financial/listReceiptActualYear', 'POST', { hash: dataLocal.hash_code}); // Dados de recebimento do ano atual
   const listGoalActualYear = await makeRequest('/api/financial/listGoalActualYear', 'POST', { hash: dataLocal.hash_code}); // Lista as metas do ano atual
   
   graphicMonthForMonth(receiptActualYear, listGoalActualYear)
   
   document.querySelector('#loader2').classList.add('d-none');
});


// Socket IO para ficar atualizando as informações na tela
const socket = io();

socket.on('newProcess', async function (msg) {
   const getLocalStorage = localStorage.getItem('hash');
   const dataLocal = JSON.parse(getLocalStorage);

   await checkCompany(dataLocal.hash_code); // Verifica se o usuario esta na pagina referente a filial que ele tem acesso

   const receiptActualYear = await makeRequest('/api/financial/listReceiptActualYear', 'POST', { hash: dataLocal.hash_code}); // Dados de recebimento do ano atual
   const listGoalActualYear = await makeRequest('/api/financial/listGoalActualYear', 'POST', { hash: dataLocal.hash_code}); // Lista as metas do ano atual

   graphicMonthForMonth(receiptActualYear, listGoalActualYear)
})

// Importa e inicializa o listener de métricas de processo
// Certifique-se de que o arquivo process-metrics-listener.js está incluído no HTML antes deste script
if (typeof initProcessMetricsListener === 'function') {
  initProcessMetricsListener(socket);
}