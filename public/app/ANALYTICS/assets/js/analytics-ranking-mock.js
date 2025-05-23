// analytics-ranking-mock.js

// Lista de IDs de colaboradores a serem ignorados nos rankings
const idsIgnorados = [48908, 48902, 48901, 48906];

// Função utilitária para capitalizar nomes
function capitalizarNome(nome) {
  if (!nome) return '';
  return nome.toLowerCase().replace(/\b(\w)/g, l => l.toUpperCase());
}

// Função para agrupar os top 3 por modalidade
function agrupaTop3PorModalidade(listAllProcesses) {
  const modalidades = {};
  listAllProcesses.forEach(item => {
    if (!modalidades[item.Modalidade_Operacao]) modalidades[item.Modalidade_Operacao] = [];
    modalidades[item.Modalidade_Operacao].push(item);
  });
  // Ordena e pega top 3 de cada modalidade
  Object.keys(modalidades).forEach(mod => {
    modalidades[mod] = modalidades[mod]
      .sort((a, b) => b.Qtd_Processos - a.Qtd_Processos)
      .slice(0, 3);
  });
  return modalidades;
}

// Função para agrupar ranking mensal geral por vendedor
function agrupaRankingMensal(listAllProcesses) {
  const ranking = {};
  let totalCorporativo = 0;
  console.log(listAllProcesses)
  listAllProcesses.forEach(item => {
    if (idsIgnorados.includes(item.Id_Comercial)) {
      totalCorporativo += item.Qtd_Processos;
      return;
    }
    if (!ranking[item.Id_Comercial]) {
      ranking[item.Id_Comercial] = {
        nome: item.Nome_Comercial,
        email: item.Email_Comercial,
        total: 0,
        Id_Comercial: item.Id_Comercial
      };
    }
    ranking[item.Id_Comercial].total += item.Qtd_Processos;
  });

  // Adiciona o "Corporativo" se houver processos removidos
  if (totalCorporativo > 0) {
    ranking[0] = {
      nome: 'Corporativo',
      email: '',
      total: totalCorporativo,
      Id_Comercial: 0
    };

    console.log('ranking', ranking)
  }
  // Retorna array ordenado
  return Object.values(ranking).sort((a, b) => b.total - a.total);
}

// Função para renderizar os cards Top 3 por modalidade em linha única (layout TV)
function renderTop3PorModalidadeTV(rankingPorModalidade, listAllProcessesFiltrado, listAllProcessesOriginal) {
  const container = document.getElementById('analytics-ranking-modalidades');
  if (!container) return;
  container.innerHTML = '';
  Object.entries(rankingPorModalidade).forEach(([modalidade, lista]) => {
    const top1 = lista[0];
    const top2 = lista[1];
    const top3 = lista[2];
    const totalModalidade = lista.reduce((acc, item) => acc + item.Qtd_Processos, 0);
    const percentualTop1 = top1 ? Math.round((top1.Qtd_Processos / totalModalidade) * 100) : 0;
    container.innerHTML += `
      <div class="d-flex flex-column align-items-center bg-white rounded shadow-sm p-3" style="min-width:220px;max-width:240px;">
        <h6 class="fw-bold text-primary mb-2">${modalidade}</h6>
        <div class="text-center mb-2">
          <img src="https://cdn.conlinebr.com.br/colaboradores/${top1 ? top1.Id_Comercial : ''}" class="avatar avatar-xl mb-1 border border-primary" style="object-fit:cover;" alt="${top1 ? capitalizarNome(top1.Nome_Comercial) : ''}" onerror="this.onerror=null;this.src='https://conlinebr.com.br/assets/img/icon-redondo.png'">
          <div class="fw-bold">${top1 ? capitalizarNome(top1.Nome_Comercial) : ''}</div>
          <div class="fs-16">${top1 ? top1.Qtd_Processos : ''} ${top1 && top1.Qtd_Processos == 1 ? 'fechamento' : 'fechamentos'}</div>
          <div class="progress mb-1" style="height: 6px; width: 80%; margin: 0 auto;">
            <div class="progress-bar bg-primary" style="width: ${percentualTop1}%;"></div>
          </div>
          <small class="text-muted">${percentualTop1}%</small>
        </div>
        <div class="d-flex flex-row gap-2 justify-content-center">
          ${[top2, top3].map((item, idx) => item ? `
            <div class="text-center">
              <img src="https://cdn.conlinebr.com.br/colaboradores/${item.Id_Comercial}" class="avatar avatar-sm mb-1 border border-secondary" style="object-fit:cover;" alt="${capitalizarNome(item.Nome_Comercial)}" onerror="this.onerror=null;this.src='https://conlinebr.com.br/assets/img/icon-redondo.png'">
              <div class="small">${capitalizarNome(item.Nome_Comercial)}</div>
              <div class="small">${item.Qtd_Processos}</div>
            </div>
          ` : '').join('')}
        </div>
      </div>
    `;
  });
  // Gráfico de pizza na mesma linha
  container.innerHTML += `
    <div class="d-flex flex-column align-items-center bg-white rounded shadow-sm p-3" style="min-width:320px;max-width:340px;">
      <h6 class="fw-bold text-primary mb-2">Participação Percentual (Semana)</h6>
      <div id="analytics-ranking-pie" style="width: 100%; min-height: 220px;"></div>
    </div>
  `;
  setTimeout(() => renderPieChart(listAllProcessesOriginal), 100); // Usa a lista original
}

function renderPieChart(listAllProcesses) {
  if (!window.ApexCharts) return;
  const el = document.getElementById('analytics-ranking-pie');
  if (!el) return;
  el.innerHTML = '';
  // Agrupa por modalidade
  const modalidadeMap = {};
  listAllProcesses.forEach(item => {
    if (!modalidadeMap[item.Modalidade_Operacao]) modalidadeMap[item.Modalidade_Operacao] = 0;
    modalidadeMap[item.Modalidade_Operacao] += item.Qtd_Processos;
  });
  const labels = Object.keys(modalidadeMap);
  const data = Object.values(modalidadeMap);
  const options = {
    chart: { type: 'donut', height: 220 },
    labels,
    series: data,
    legend: { position: 'bottom' },
    colors: ['#845adf', '#23b7e5', '#f9423a', '#f7b731'],
    tooltip: { y: { formatter: val => `${val} fechamentos` } }
  };
  new ApexCharts(el, options).render();
}

// Gráfico de barras mensal por vendedor
function renderBarChartMensal(rankingMensalVendedor) {
  if (!window.ApexCharts) return;
  const el = document.getElementById('analytics-ranking-bar');
  if (!el) return;
  el.innerHTML = '';
  const labels = rankingMensalVendedor.map(x => x.nome);
  const data = rankingMensalVendedor.map(x => x.total);
  const options = {
    chart: { type: 'bar', height: 320, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 6 } },
    dataLabels: { enabled: false },
    xaxis: { categories: labels },
    series: [{ name: 'Fechamentos', data }],
    colors: ['#845adf'],
    grid: { borderColor: '#f1f1f1' },
    tooltip: { y: { formatter: val => `${val} fechamentos` } }
  };
  new ApexCharts(el, options).render();
}

function renderPieChartRankingProcessos(rankingMensalVendedor) {
  if (!window.ApexCharts) return;
  console.log(rankingMensalVendedor)
  const el = document.getElementById('analytics-ranking-processos-pie');
  if (!el) return;
  el.innerHTML = '';
  const total = rankingMensalVendedor.reduce((acc, item) => acc + item.total, 0);
  const labels = rankingMensalVendedor.map(x => x.nome);
  const fotos = rankingMensalVendedor.map(x => `https://cdn.conlinebr.com.br/colaboradores/${x.Id_Comercial}`);
  const data = rankingMensalVendedor.map(x => Math.round((x.total / total) * 100));

  const options = {
    chart: { type: 'donut', height: 260 },
    labels,
    series: data,
    legend: {
      position: 'bottom',
      formatter: function(seriesName, opts) {
        const idx = opts.seriesIndex;
        return `<img src='${fotos[idx]}' style='width:22px;height:22px;border-radius:50%;object-fit:cover;margin-right:6px;vertical-align:middle;' onerror=\"this.onerror=null;this.src='https://conlinebr.com.br/assets/img/icon-redondo.png'\"> ${seriesName}`;
      }
    },
    tooltip: {
      custom: function({ series, seriesIndex, w }) {
        const nome = labels[seriesIndex];
        const foto = fotos[seriesIndex];
        return `<div style='text-align:center;'>
          <img src='${foto}' style='width:38px;height:38px;border-radius:50%;object-fit:cover;margin-bottom:4px;' onerror=\"this.onerror=null;this.src='https://conlinebr.com.br/assets/img/icon-redondo.png'\"><br>
          <strong>${nome}</strong><br>
          <span style='font-size:1.1em;'>${series[seriesIndex]}%</span>
        </div>`;
      }
    },
    colors: ['#845adf', '#23b7e5', '#f9423a', '#f7b731', '#00b894', '#fdcb6e', '#636e72', '#0984e3', '#d35400', '#6c5ce7']
  };

  new ApexCharts(el, options).render();
}

function renderRankingProcessosBarras(rankingMensalVendedor) {
  const container = document.getElementById('ranking-processos-barras');
  if (!container) return;
  const total = rankingMensalVendedor.reduce((acc, item) => acc + item.total, 0);
  // Exibir apenas os 6 primeiros
  const top6 = rankingMensalVendedor.slice(0, 6);
  container.innerHTML = top6.map(item => {
    const percentual = Math.round((item.total / total) * 100);
    return `
      <div class="d-flex align-items-center mb-3" style="margin-bottom:18px;">
        <img src="https://cdn.conlinebr.com.br/colaboradores/${item.Id_Comercial}"
             style="width:32px;height:32px;border-radius:50%;object-fit:cover;margin-right:12px;vertical-align:middle;"
             onerror="this.onerror=null;this.src='https://conlinebr.com.br/assets/img/icon-redondo.png'">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between" style="font-size:1.1rem;font-weight:500;">
            <span>${capitalizarNome(item.nome)}</span>
            <span>${percentual}%</span>
          </div>
          <div class="progress" style="height:18px;">
            <div class="progress-bar bg-danger" style="width:${percentual}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Função para agrupar ranking de TEUs por vendedor
function agrupaRankingTeus(listAllProcesses) {
  const ranking = {};
  let totalCorporativo = 0;
  listAllProcesses.forEach(item => {
    if (idsIgnorados.includes(item.Id_Comercial)) {
      totalCorporativo += item.Qtd_TEUS || 0;
      return;
    }
    if (!ranking[item.Id_Comercial]) {
      ranking[item.Id_Comercial] = {
        nome: item.Nome_Comercial,
        email: item.Email_Comercial,
        total: 0,
        Id_Comercial: item.Id_Comercial
      };
    }
    ranking[item.Id_Comercial].total += item.Qtd_TEUS || 0;
  });
  if (totalCorporativo > 0) {
    ranking[0] = {
      nome: 'Corporativo',
      email: '',
      total: totalCorporativo,
      Id_Comercial: 0
    };
  }
  return Object.values(ranking).sort((a, b) => b.total - a.total);
}

// Função para renderizar as barras do ranking de TEUs
function renderRankingTeusBarras(rankingTeusVendedor) {
  const container = document.getElementById('ranking-teus-barras');
  if (!container) return;
  const total = rankingTeusVendedor.reduce((acc, item) => acc + item.total, 0);
  const top6 = rankingTeusVendedor.slice(0, 6);
  container.innerHTML = top6.map(item => {
    const percentual = total > 0 ? Math.round((item.total / total) * 100) : 0;
    return `
      <div class="d-flex align-items-center mb-3" style="margin-bottom:18px;">
        <img src="https://cdn.conlinebr.com.br/colaboradores/${item.Id_Comercial}"
             style="width:32px;height:32px;border-radius:50%;object-fit:cover;margin-right:12px;vertical-align:middle;"
             onerror="this.onerror=null;this.src='https://conlinebr.com.br/assets/img/icon-redondo.png'">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between" style="font-size:1.1rem;font-weight:500;">
            <span>${capitalizarNome(item.nome)}</span>
            <span>${percentual}%</span>
          </div>
          <div class="progress" style="height:18px;">
            <div class="progress-bar bg-danger" style="width:${percentual}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Função para converter valor em reais para número
function parseValorReais(valor) {
  if (!valor) return 0;
  // Remove R$, pontos de milhar e troca vírgula por ponto
  return parseFloat(valor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
}

// Função para agrupar ranking de Faturamento por vendedor
function agrupaRankingFaturamento(listAllProcesses) {
  const ranking = {};
  let totalCorporativo = 0;
  listAllProcesses.forEach(item => {
    if (idsIgnorados.includes(item.Id_Comercial)) {
      totalCorporativo += parseValorReais(item.Total_Recebido);
      return;
    }
    if (!ranking[item.Id_Comercial]) {
      ranking[item.Id_Comercial] = {
        nome: item.Nome_Comercial,
        email: item.Email_Comercial,
        total: 0,
        Id_Comercial: item.Id_Comercial
      };
    }
    ranking[item.Id_Comercial].total += parseValorReais(item.Total_Recebido);
  });
  if (totalCorporativo > 0) {
    ranking[0] = {
      nome: 'Corporativo',
      email: '',
      total: totalCorporativo,
      Id_Comercial: 0
    };
  }
  return Object.values(ranking).sort((a, b) => b.total - a.total);
}

// Função para renderizar as barras do ranking de Faturamento
function renderRankingFaturamentoBarras(rankingFaturamentoVendedor) {
  const container = document.getElementById('ranking-faturamento-barras');
  if (!container) return;
  const total = rankingFaturamentoVendedor.reduce((acc, item) => acc + item.total, 0);
  const top6 = rankingFaturamentoVendedor.slice(0, 6);
  container.innerHTML = top6.map(item => {
    const percentual = total > 0 ? Math.round((item.total / total) * 100) : 0;
    return `
      <div class="d-flex align-items-center mb-3" style="margin-bottom:18px;">
        <img src="https://cdn.conlinebr.com.br/colaboradores/${item.Id_Comercial}"
             style="width:32px;height:32px;border-radius:50%;object-fit:cover;margin-right:12px;vertical-align:middle;"
             onerror="this.onerror=null;this.src='https://conlinebr.com.br/assets/img/icon-redondo.png'">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between" style="font-size:1.1rem;font-weight:500;">
            <span>${capitalizarNome(item.nome)}</span>
            <span>${percentual}%</span>
          </div>
          <div class="progress" style="height:18px;">
            <div class="progress-bar bg-danger" style="width:${percentual}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Função centralizada para atualizar todos os rankings da página analytics
async function updateAnalyticsRanking() {
  const listAllProcesses = await makeRequest('/api/analytics/getProcess', 'POST');
  // Filtra só para o Top 3 por Modalidade
  const listAllProcessesFiltrado = listAllProcesses.filter(
    item => !idsIgnorados.includes(item.Id_Comercial)
  );

  // Top 3 por modalidade (usa filtrado)
  const rankingPorModalidade = agrupaTop3PorModalidade(listAllProcessesFiltrado);
  renderTop3PorModalidadeTV(rankingPorModalidade, listAllProcessesFiltrado, listAllProcesses);

  // Rankings (usa lista completa, para gerar o "Corporativo")
  const rankingMensalVendedor = agrupaRankingMensal(listAllProcesses);
  renderBarChartMensal(rankingMensalVendedor);
  renderRankingProcessosBarras(rankingMensalVendedor);

  const rankingTeusVendedor = agrupaRankingTeus(listAllProcesses);
  renderRankingTeusBarras(rankingTeusVendedor);

  const rankingFaturamentoVendedor = agrupaRankingFaturamento(listAllProcesses);
  renderRankingFaturamentoBarras(rankingFaturamentoVendedor);

  // Outros renders (se necessário)
}

// Atualiza ao carregar a página

document.addEventListener('DOMContentLoaded', updateAnalyticsRanking);

// Socket IO para ficar atualizando as informações na tela
// const socket = io();
socket.on('newProcess_metrics', function (msg) {
  updateAnalyticsRanking();
});

// Pronto para expandir: gráficos, tabela, ranking por papel etc. 