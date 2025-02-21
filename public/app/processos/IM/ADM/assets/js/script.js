const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez",];

async function checkCompany(hash) {
   const getCompanieId = await makeRequest('/api/users/listDataUser', 'POST', { hash: hash }); // Dados de recebimento do ano atual
   const companie_id_headcargo = 7 /* ADM */

   if (getCompanieId[0].companie_id_headcargo !== companie_id_headcargo) {
      window.location.href = `/app/erro/acesso-nao-autorizado`;
   };
};

// Soma os resultados do meses que localizar no sistema
function sumForMonth(data, allowedMonths, companyId) {
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
      
      // Verifica se o IdEmpresa_Sistema corresponde ao companyId
      if (item.IdEmpresa_Sistema !== companyId) continue;

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
   const ia_courier = [];
   const im_lcl = [];
   const im_fcl_teus = [];

   arrayValuesForMonth.forEach(month => {
      ia_normal.push(month.IA_NORMAL);
      ia_courier.push(month.IA_COURIER);
      im_lcl.push(month.IM_LCL);
      im_fcl_teus.push(month.IM_FCL_TEUS);
   });

   return {ia_normal, ia_courier, im_lcl, im_fcl_teus};
};

// Cria o grafico mes a mes de ITJ
let chartIM_LCL_ITJ = null;
let chartIM_FCL_ITJ = null;
let chartIA_NORMAL_ITJ = null;
let chartIA_COURIER_ITJ = null;
async function graphicMonthForMonthITJ(dataActualYear, dataGoal) {
   // Extrai os meses permitidos do dataGoal
   const allowedMonths = [...new Set(dataGoal.map((item) => item.month))]

   // Determinar o último mês com metas lançadas
   const maxMonth = Math.max(...allowedMonths);

   // Soma de faturamento total por empresa, considerando até o último mês com metas
   const filterValues_IMLCL_ITJ = dataActualYear.filter((item) => item.IdEmpresa_Sistema === 1 && item.Mes <= maxMonth && item.Tipo_Processo === 'IM-LCL').length;
   const filterValues_IMFCL_ITJ = dataActualYear.filter((item) => item.IdEmpresa_Sistema === 1 && item.Mes <= maxMonth && item.Tipo_Processo === 'IM-FCL').reduce((acc, item) => acc + item.Teus, 0);
   const filterValues_IA_NORMAL_ITJ = dataActualYear.filter((item) => item.IdEmpresa_Sistema === 1 && item.Mes <= maxMonth && item.Tipo_Processo === 'IA-NORMAL').length;
   const filterValues_IA_COURIER_ITJ = dataActualYear.filter((item) => item.IdEmpresa_Sistema === 1 && item.Mes <= maxMonth && item.Tipo_Processo === 'IA-COURIER').length;

   document.getElementById('IM-LCL-ANUAL-ITJ').textContent = filterValues_IMLCL_ITJ;
   document.getElementById('IM-TEUS-ANUAL-ITJ').textContent = filterValues_IMFCL_ITJ;
   document.getElementById('IA-NORMAL-ANUAL-ITJ').textContent = filterValues_IA_NORMAL_ITJ;
   document.getElementById('IA-COURIER-ANUAL-ITJ').textContent = filterValues_IA_COURIER_ITJ;

   // Soma de meta total por empresa
   const filterGoals_IM_LCL_PROCESSOS_ITJ = dataGoal.filter((item) => item.companie_id_headcargo === 1 && item.type === 'IM-LCL-PROCESSOS').reduce((acc, item) => acc + item.value, 0);
   const filterGoals_IM_FCL_TEUS_ITJ = dataGoal.filter((item) => item.companie_id_headcargo === 1 && item.type === 'IM-TEUS').reduce((acc, item) => acc + item.value, 0);
   const filterGoals_IA_NORMAL_PROCESSOS_ITJ = dataGoal.filter((item) => item.companie_id_headcargo === 1 && item.type === 'IA-NORMAL-PROCESSOS').reduce((acc, item) => acc + item.value, 0);
   const filterGoals_IA_COURIER_PROCESSOS_ITJ = dataGoal.filter((item) => item.companie_id_headcargo === 1 && item.type === 'IA-COURIER-PROCESSOS').reduce((acc, item) => acc + item.value, 0);

   document.getElementById('IM-LCL-META-ANUAL-ITJ').textContent = filterGoals_IM_LCL_PROCESSOS_ITJ;
   document.getElementById('IM-TEUS-META-ANUAL-ITJ').textContent = filterGoals_IM_FCL_TEUS_ITJ;
   document.getElementById('IA-NORMAL-META-ANUAL-ITJ').textContent = filterGoals_IA_NORMAL_PROCESSOS_ITJ;
   document.getElementById('IA-COURIER-META-ANUAL-ITJ').textContent = filterGoals_IA_COURIER_PROCESSOS_ITJ;

   // Atualiza os meses permitidos no sumForMonth
   const arrayValuesForMonth = sumForMonth(dataActualYear, allowedMonths, 1 /* ITJ */);
   const separatedArrays = separateArraysByType(arrayValuesForMonth);

   // Extrai apenas os valores de cada MES / Tipo de processo
   const im_lcl = separatedArrays.im_lcl;
   const im_fcl_teus = separatedArrays.im_fcl_teus;
   const ia_normal = separatedArrays.ia_normal;
   const ia_courier = separatedArrays.ia_courier;
   
   // Extrai as METAS de cada mês e tipo de processo  
   const goalForMonth = {
      im_lcl: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'IM-LCL-PROCESSOS' && item.companie_id_headcargo === 1 /* ITJ */).map(item => item.value),
      im_fcl_teus: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'IM-TEUS' && item.companie_id_headcargo === 1 /* ITJ */).map(item => item.value),
      ia_normal: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'IA-NORMAL-PROCESSOS' && item.companie_id_headcargo === 1 /* ITJ */).map(item => item.value),
      ia_courier: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'IA-COURIER-PROCESSOS' && item.companie_id_headcargo === 1 /* ITJ */).map(item => item.value),
   };

   const goalForMonthIM_LCL = goalForMonth.im_lcl;
   const goalForMonthIM_FCL_TEUS = goalForMonth.im_fcl_teus;
   const goalForMonthIA_NORMAL = goalForMonth.ia_normal;
   const goalForMonthIA_COURIER = goalForMonth.ia_courier;

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
         height: 600,
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

   if (chartIM_LCL_ITJ) {
      chartIM_LCL_ITJ.updateOptions(optionsIM_LCL);
   } else {
      chartIM_LCL_ITJ = new ApexCharts(
         document.querySelector("#IM-LCL-ITJ"),
         optionsIM_LCL
      );
      chartIM_LCL_ITJ.render();
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
         height: 600,
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

   if (chartIM_FCL_ITJ) {
      chartIM_FCL_ITJ.updateOptions(optionsIM_FCL);
   } else {
      chartIM_FCL_ITJ = new ApexCharts(
         document.querySelector("#IM-FCL-ITJ"),
         optionsIM_FCL
      );
      chartIM_FCL_ITJ.render();
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
         height: 600,
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

   if (chartIA_NORMAL_ITJ) {
      chartIA_NORMAL_ITJ.updateOptions(optionsIA_NORMAL);
   } else {
      chartIA_NORMAL_ITJ = new ApexCharts(
         document.querySelector("#IA-NORMAL-ITJ"),
         optionsIA_NORMAL
      );
      chartIA_NORMAL_ITJ.render();
   }


   // Gráfico de Processos de Importação Aérea COURIER
   var optionsIA_COURIER = {
      series: [
         {
            name: "Valores",
            data: ia_courier,
         },
         {
            name: "Meta",
            data: goalForMonthIA_COURIER,
         },
      ],
   
      chart: {
         type: "bar",
         height: 600,
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
               return ia_courier[opts.dataPointIndex];
            } else if (seriesIndex === 1) {
               // Se for a segunda sére (Meta), mostra o valor correspondente
               return goalForMonthIA_COURIER[opts.dataPointIndex];
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

   if (chartIA_COURIER_ITJ) {
      chartIA_COURIER_ITJ.updateOptions(optionsIA_COURIER);
   } else {
      chartIA_COURIER_ITJ = new ApexCharts(
         document.querySelector("#IA-COURIER-ITJ"),
         optionsIA_COURIER
      );
      chartIA_COURIER_ITJ.render();
   }
};

// Cria o grafico mes a mes de SP
let chartIM_LCL_SP = null;
let chartIM_FCL_SP = null;
let chartIA_TOTAL_SP = null;
async function graphicMonthForMonthSP(dataActualYear, dataGoal) {
   // Extrai os meses permitidos do dataGoal
   const allowedMonths = [...new Set(dataGoal.map((item) => item.month))]

   // Determinar o último mês com metas lançadas
   const maxMonth = Math.max(...allowedMonths);

   // Soma de faturamento total por empresa, considerando até o último mês com metas
   const filterValues_IMLCL_SP = dataActualYear.filter((item) => item.IdEmpresa_Sistema === 4 && item.Mes <= maxMonth && item.Tipo_Processo === 'IM-LCL').length;
   const filterValues_IMFCL_SP = dataActualYear.filter((item) => item.IdEmpresa_Sistema === 4 && item.Mes <= maxMonth && item.Tipo_Processo === 'IM-FCL').reduce((acc, item) => acc + item.Teus, 0);
   
   // Combina os valores de IA NORMAL e COURIER
   const filterValues_IA_TOTAL_SP = dataActualYear.filter((item) => 
      item.IdEmpresa_Sistema === 4 && 
      item.Mes <= maxMonth && 
      (item.Tipo_Processo === 'IA-NORMAL' || item.Tipo_Processo === 'IA-COURIER')
   ).length;

   document.getElementById('IM-LCL-ANUAL-SP').textContent = filterValues_IMLCL_SP;
   document.getElementById('IM-TEUS-ANUAL-SP').textContent = filterValues_IMFCL_SP;
   document.getElementById('IA-TOTAL-ANUAL-SP').textContent = filterValues_IA_TOTAL_SP;

   // Soma de meta total por empresa
   const filterGoals_IM_LCL_PROCESSOS_SP = dataGoal.filter((item) => item.companie_id_headcargo === 4 && item.type === 'IM-LCL-PROCESSOS').reduce((acc, item) => acc + item.value, 0);
   const filterGoals_IM_FCL_TEUS_SP = dataGoal.filter((item) => item.companie_id_headcargo === 4 && item.type === 'IM-TEUS').reduce((acc, item) => acc + item.value, 0);
   
   // Combina as metas de IA NORMAL e COURIER
   const filterGoals_IA_TOTAL_PROCESSOS_SP = dataGoal.filter((item) => 
      item.companie_id_headcargo === 4 && 
      (item.type === 'IA-NORMAL-PROCESSOS' || item.type === 'IA-COURIER-PROCESSOS')
   ).reduce((acc, item) => acc + item.value, 0);

   document.getElementById('IM-LCL-META-ANUAL-SP').textContent = filterGoals_IM_LCL_PROCESSOS_SP;
   document.getElementById('IM-TEUS-META-ANUAL-SP').textContent = filterGoals_IM_FCL_TEUS_SP;
   document.getElementById('IA-TOTAL-META-ANUAL-SP').textContent = filterGoals_IA_TOTAL_PROCESSOS_SP;

   // Atualiza os meses permitidos no sumForMonth
   const arrayValuesForMonth = sumForMonth(dataActualYear, allowedMonths, 4 /* SP */);
   const separatedArrays = separateArraysByType(arrayValuesForMonth);

   // Extrai apenas os valores de cada MES / Tipo de processo
   const im_lcl = separatedArrays.im_lcl;
   const im_fcl_teus = separatedArrays.im_fcl_teus;
   
   // Combina os valores mensais de IA NORMAL e COURIER
   const ia_total = allowedMonths.map(month => {
      const monthData = arrayValuesForMonth.filter(item => item.month === month);
      return monthData.reduce((acc, item) => {
         if (item.type === 'IA-NORMAL' || item.type === 'IA-COURIER') {
            return acc + item.value;
         }
         return acc;
      }, 0);
   });
   
   // Extrai as METAS de cada mês e tipo de processo  
   const goalForMonth = {
      im_lcl: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'IM-LCL-PROCESSOS' && item.companie_id_headcargo === 4 /* SP */).map(item => item.value),
      im_fcl_teus: dataGoal.filter(item => allowedMonths.includes(item.month) && item.type === 'IM-TEUS' && item.companie_id_headcargo === 4 /* SP */).map(item => item.value),
      ia_total: allowedMonths.map(month => {
         const monthGoals = dataGoal.filter(item => 
            item.month === month && 
            item.companie_id_headcargo === 4 && 
            (item.type === 'IA-NORMAL-PROCESSOS' || item.type === 'IA-COURIER-PROCESSOS')
         );
         return monthGoals.reduce((acc, item) => acc + item.value, 0);
      })
   };

   const goalForMonthIM_LCL = goalForMonth.im_lcl;
   const goalForMonthIM_FCL_TEUS = goalForMonth.im_fcl_teus;
   const goalForMonthIA_TOTAL = goalForMonth.ia_total;
   
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
         height: 600,
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

   if (chartIM_LCL_SP) {
      chartIM_LCL_SP.updateOptions(optionsIM_LCL);
   } else {
      chartIM_LCL_SP = new ApexCharts(
         document.querySelector("#IM-LCL-SP"),
         optionsIM_LCL
      );
      chartIM_LCL_SP.render();
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
         height: 600,
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

   if (chartIM_FCL_SP) {
      chartIM_FCL_SP.updateOptions(optionsIM_FCL);
   } else {
      chartIM_FCL_SP = new ApexCharts(
         document.querySelector("#IM-FCL-SP"),
         optionsIM_FCL
      );
      chartIM_FCL_SP.render();
   }


   // Gráfico de Processos de Importação Aérea Total
   var optionsIA_TOTAL = {
      series: [
         {
            name: "Valores",
            data: ia_total,
         },
         {
            name: "Meta",
            data: goalForMonthIA_TOTAL,
         },
      ],
   
      chart: {
         type: "bar",
         height: 600,
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
               return ia_total[opts.dataPointIndex];
            } else if (seriesIndex === 1) {
               // Se for a segunda sére (Meta), mostra o valor correspondente
               return goalForMonthIA_TOTAL[opts.dataPointIndex];
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
      }
   };

   if (chartIA_TOTAL_SP) {
      chartIA_TOTAL_SP.updateOptions(optionsIA_TOTAL);
   } else {
      chartIA_TOTAL_SP = new ApexCharts(
         document.querySelector("#IA-TOTAL-SP"),
         optionsIA_TOTAL
      );
      chartIA_TOTAL_SP.render();
   }
};


document.addEventListener("DOMContentLoaded", async () => {
   await checkLogin(); // Verifica se o usuario esta logado/ativo
   const getLocalStorage = localStorage.getItem('hash');
   const dataLocal = JSON.parse(getLocalStorage);
   await checkCompany(dataLocal.hash_code); // Verifica se o usuario esta na pagina referente a filial que ele tem acesso

   const listAllProcesses = await makeRequest('/api/importation/listAllProcesses', 'POST', { hash: dataLocal.hash_code }); // Lista os recebimentos do ano atual
   
   const listGoalActualYear = await makeRequest('/api/importation/listGoalActualYear', 'POST', { hash: dataLocal.hash_code}); // Lista as metas do ano atual
   graphicMonthForMonthITJ(listAllProcesses, listGoalActualYear)
   graphicMonthForMonthSP(listAllProcesses, listGoalActualYear)

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
   graphicMonthForMonthITJ(listAllProcesses, listGoalActualYear)
   graphicMonthForMonthSP(listAllProcesses, listGoalActualYear)
})