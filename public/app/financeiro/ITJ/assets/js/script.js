const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez",];

// Soma os resultados dos meses que localizar no sistema
function sumForMonth(data, allowedMonths) {
   const sumForMonth = [];
 
   for (let i = 0; i < data.length; i++) {
      const item = data[i];
 
      // Ignorar meses que não estão na lista de permitidos
      if (!allowedMonths.includes(item.Mes)) {
         continue;
      }
   
      const monthOfExistence = sumForMonth.find((mes) => mes.MES === item.Mes);
   
      if (monthOfExistence) {
         monthOfExistence.TOTAL_RECEBIMENTO += item.Total_Recebimento;
      } else {
         sumForMonth.push({
            MES: item.Mes,
            TOTAL_RECEBIMENTO: item.Total_Recebimento,
         });
      }
   }
 
   // Garantir que os meses estejam na ordem correta
   sumForMonth.sort((a, b) => a.MES - b.MES);
   return sumForMonth;
};

let chartUpdate = null;
// Cria o grafico mes a mes
function graphicMonthForMonth(dataActualYear, dataGoal) {
   // Extrai os meses permitidos do dataGoal
   const allowedMonths = [...new Set(dataGoal.map((item) => item.month))];
 
   // Atualiza os meses permitidos no sumForMonth
   const arrayValuesForMonth = sumForMonth(dataActualYear, allowedMonths);
 
   // Extrai apenas as METAS de cada mês
   const goalForMonth = dataGoal
      .filter((item) => allowedMonths.includes(item.month))
      .map((item) => item.value);
 
   // Extrai apenas os valores de TOTAL_RECEBIMENTO
   const valuesForMonth = arrayValuesForMonth.map((item) => item.TOTAL_RECEBIMENTO);
 
   // Gera as porcentagens
   const percentages = goalForMonth.map((goal, index) => {
      const valueReceived = valuesForMonth[index] || 0;
      // Evita a divisão por zero
      const percentage = goal !== 0 ? (valueReceived / goal) * 100 : 0;
      return Number(percentage.toFixed(2));
   });
 
   const options = {
      series: [
         {
            name: "Valores",
            type: "column",
            data: valuesForMonth,
         },
         {
            name: "Meta",
            type: "area",
            data: goalForMonth,
         },
      ],
      colors: ["#FF2429", "#3F2021"],
      chart: {
         height: 500,
         type: "area",
         stacked: false,
         toolbar: {
            show: false,
         },
      },
      stroke: {
         width: [0, 2],
         curve: "smooth",
         dashArray: [0, 4],
      },
      plotOptions: {
         bar: {
            borderRadius: 7,
            columnWidth: "25%",
         },
      },
      fill: {
         type: ["solid", "gradient"],
         gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.5,
            opacityTo: 0.0,
            stops: [0, 100],
         },
      },
      dataLabels: {
         enabled: true,
         enabledOnSeries: [0],
         formatter: function (val, opts) {
            const percentage = percentages[opts.dataPointIndex];
            return Math.max(percentage, 0) + "%";
         },
         offsetY: -15,
         style: {
            fontSize: "12px",
            colors: ["#FF2429"],
         },
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
      yaxis: [
         {
            show: false,
            min: 0,
         },
      ],
      tooltip: {
         enabled: false,
      },
   };
 
   if (chartUpdate) {
      chartUpdate.updateOptions(options);
   } else {
      chartUpdate = new ApexCharts(
         document.querySelector("#meta-mes-a-mes"),
         options
      );
      chartUpdate.render();
   }
};

document.addEventListener("DOMContentLoaded", async () => {
   await checkLogin(); // Verifica se o usuario esta logado/ativo

   const getLocalStorage = localStorage.getItem('hash');
   const dataLocal = JSON.parse(getLocalStorage);

   const receiptActualYear = await makeRequest('/api/financial/listReceiptActualYear', 'POST', { hash: dataLocal.hash_code}); // Dados de recebimento do ano atual
   const listGoalActualYear = await makeRequest('/api/financial/listGoalActualYear', 'POST', { hash: dataLocal.hash_code}); // Lista as metas do ano atual

   graphicMonthForMonth(receiptActualYear, listGoalActualYear)
   
   document.querySelector('#loader2').classList.add('d-none');
});