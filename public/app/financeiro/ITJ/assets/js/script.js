const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez",];

// Soma os resultados dos meses que localizar no sistema
function sumForMonth(data) {
   const sumForMonth = [];
 
   for (let i = 0; i < data.length; i++) {
      const item = data[i];
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
 
   sumForMonth.sort((a, b) => a.MES - b.MES);
   return sumForMonth;
};

let chartUpdate = null;
// Cria o grafico mes a mes
function graphicMonthForMonth(dataActualYear, dataGoal) {
   const arrayValuesForMonth = sumForMonth(dataActualYear);

   // Extrai apenas as METAS de cada mes
   const goalForMonth = dataGoal.map(
      (item) => item.value
   );

   // Extrai apenas os valores de TOTAL_RECEBIMENTO
   const valuesForMonth = arrayValuesForMonth.map(
      (item) => item.TOTAL_RECEBIMENTO
   );

   const percentages = goalForMonth.map((goal, index) => {
      const valueReceived = valuesForMonth[index];

      // Evita a divisão por zero
      const porcentage = goal !== 0 ? (valueReceived / goal) * 100 : 0;
      console.log(Number(porcentage.toFixed(2)));
      
      return Number(porcentage.toFixed(2));
   });

   var options = {
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
      colors: ["#F9423A", "#3F2021"],

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
            colors: ["#F9423A"],
         },
      },

      xaxis: {
         categories: months,
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
         // seriesName: 'Ano Atual',
         show: false,
         // Define o intervalo do eixo Y para os valores arrecadados
         min: 0, // Defina o mínimo como 0 ou um valor específico, se necessário
         // max: Math.max(2000000)  // Ajuste o máximo para ser um pouco maior que o valor máximo dos valores arrecadados
         },
         // {
         //    seriesName: 'Meta',
         //    show: false,
         //    min: 0, // Defina o mínimo do eixo Y para 0
         //    // max: Math.max(2000000), // Defina o máximo do eixo Y para o maior valor em metas_mensais
         // }
      ],

      tooltip: {
         enabled: false,
      },
   };

   // Verifique se o gráfico já existe
   if (chartUpdate) {
      // Atualize as porcentagens
      options.dataLabels.formatter = function (val, opts) {
         const percentage = percentage[opts.dataPointIndex];
         return Math.max(percentage, 0) + "%";
         // return percentage + "%";
      };
      // Se existir, atualize os dados e renderize novamente
      chartUpdate.updateOptions(options);
   } else {
      // Se não existir, crie um novo gráfico
      chartUpdate = new ApexCharts(
         document.querySelector("#meta-mes-a-mes"),
         options
      );
      chartUpdate.render();
   }
}

document.addEventListener("DOMContentLoaded", async () => {
   await checkLogin(); // Verifica se o usuario esta logado/ativo

   const getLocalStorage = localStorage.getItem('StorageGoogle');
   const dataLocal = JSON.parse(getLocalStorage);

   const receiptActualYear = await makeRequest('/api/financial/listReceiptActualYear', 'POST', { idcompany: dataLocal.companie_id}); // Dados de recebimento do ano atual
   const listGoalActualYear = await makeRequest('/api/financial/listGoalActualYear', 'POST', {companie_id: dataLocal.companie_id}); // Lista as metas do ano atual

   graphicMonthForMonth(receiptActualYear, listGoalActualYear)
   
   document.querySelector('#loader2').classList.add('d-none');
});