// process-metrics-listener.js
// Módulo para escutar o evento newProcess_metrics e exibir card central com fogos de artifício

// Fila de processos para exibição sequencial
let processQueue = [];
let isShowingCard = false;

// Caminho da imagem padrão
const IMG_PADRAO = 'https://conlinebr.com.br/assets/img/icon-redondo.png';

// Caminho dos arquivos de som
const SOUND_FOGOS = '/app/ANALYTICS/assets/sound/fireworks.mp3';
const SOUND_PALMAS = '/app/ANALYTICS/assets/sound/applause.mp3';

// Função para criar fogos de artifício animados (CSS/JS leve)
function launchFireworks() {
  // Garante que só exista um canvas de fogos
  const oldCanvas = document.getElementById('fireworks-canvas');
  if (oldCanvas) oldCanvas.remove();
  const canvas = document.createElement('canvas');
  canvas.id = 'fireworks-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = 0;
  canvas.style.left = 0;
  // Reduz a resolução do canvas, mas mantém o tamanho visual
  canvas.width = Math.floor(window.innerWidth / 1.5);
  canvas.height = Math.floor(window.innerHeight / 1.5);
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = 10000;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W = canvas.width;
  let H = canvas.height;

  // Foguetes e partículas
  let rockets = [];
  let particles = [];
  function randomColor() {
    const colors = ['#845adf', '#23b7e5', '#f9423a', '#f7b731', '#64af6d', '#fff', '#ff69b4', '#00e6e6'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  function createRocket() {
    const faixa = Math.floor(Math.random() * 5);
    const faixaLargura = W / 5;
    const x = Math.random() * (faixaLargura * 0.8) + faixa * faixaLargura + faixaLargura * 0.1;
    const targetY = Math.random() * (H * 0.25) + H * 0.05;
    rockets.push({
      x,
      y: H,
      vx: (Math.random() - 0.5) * 1.1,
      vy: - (6.5 + Math.random() * 1.7),
      targetY,
      exploded: false,
      color: randomColor(),
    });
  }
  function explode(x, y, color) {
    const count = 12 + Math.floor(Math.random() * 12); // 12-18 partículas
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 2.7 + Math.random() * 3.2;
      const hueShift = Math.floor(Math.random() * 30 - 15);
      const colorVar = tinycolor(color).spin(hueShift).toHexString();
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1.1,
        color: colorVar,
        size: 2.5 + Math.random() * 2.5,
        age: 0
      });
    }
  }
  function animate() {
    ctx.clearRect(0, 0, W, H);
    // Rockets
    rockets.forEach((r, idx) => {
      if (!r.exploded) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();
        ctx.restore();
        // Traço do foguete
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x, r.y + 18);
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        // Movimento
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.12;
        if (r.y <= r.targetY || r.vy > 0) {
          r.exploded = true;
          explode(r.x, r.y, r.color);
        }
      }
    });
    rockets = rockets.filter(r => !r.exploded);
    // Partículas
    particles.forEach((p, idx) => {
      if (p.alpha < 0.1) return; // Não desenha partículas invisíveis
      ctx.save();
      ctx.globalAlpha = p.alpha;
      // Blur leve só nas partículas jovens
      if (p.age < 3) {
        ctx.shadowBlur = 3;
        ctx.shadowColor = p.color;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.shadowBlur = 0; // Garante que não vaze para outras partículas
      ctx.restore();
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.98;
      p.vy *= 0.98;
      if (p.age < 6) {
        p.alpha -= 0.012;
      } else {
        p.alpha -= 0.008;
      }
      p.age++;
    });
    particles = particles.filter(p => p.alpha > 0);
    const maxRockets = 5;
    if ((isShowingCard || processQueue.length > 0) && rockets.length < maxRockets && Math.random() < 0.22) {
      createRocket();
    }
    if (particles.length > 0 || rockets.length > 0 || isShowingCard || processQueue.length > 0) {
      requestAnimationFrame(animate);
    } else {
      setTimeout(() => {
        canvas.remove();
        rockets = [];
        particles = [];
      }, 1000);
    }
  }
  // tinycolor utilitário para variação de cor (inline, não precisa importar)
  function tinycolor(hex) {
    // hex: #rrggbb
    let h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    let r = parseInt(h.substring(0,2),16);
    let g = parseInt(h.substring(2,4),16);
    let b = parseInt(h.substring(4,6),16);
    return {
      spin: function(deg) {
        // converte para hsl, gira o hue, volta pra rgb
        let max = Math.max(r,g,b), min = Math.min(r,g,b);
        let h,s,l;
        l = (max+min)/2/255;
        if(max==min){h=s=0;}else{
          let d = (max-min)/255;
          s = l>0.5 ? d/(2-l*2) : d/(l*2);
          switch(max){
            case r: h = (g-b)/d + (g<b?6:0); break;
            case g: h = (b-r)/d + 2; break;
            case b: h = (r-g)/d + 4; break;
          }
          h/=6;
        }
        h = ((h*360+deg)%360+360)%360/360;
        // volta pra rgb
        let q = l<0.5?l*(1+s):l+s-l*s;
        let p = 2*l-q;
        function h2r(t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}
        let rr = Math.round(h2r(h+1/3)*255);
        let gg = Math.round(h2r(h)*255);
        let bb = Math.round(h2r(h-1/3)*255);
        return {
          toHexString:()=>`#${rr.toString(16).padStart(2,'0')}${gg.toString(16).padStart(2,'0')}${bb.toString(16).padStart(2,'0')}`
        };
      }
    };
  }
  createRocket();
  animate();
}

// Função para exibir o card central com informações do processo, um por vez
function showProcessCardSequential(processo) {
  isShowingCard = true;
  // Apenas aplausos
  playApplause();

  // Cria ou seleciona o backdrop escuro
  let backdrop = document.getElementById('process-metrics-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'process-metrics-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.top = 0;
    backdrop.style.left = 0;
    backdrop.style.width = '100vw';
    backdrop.style.height = '100vh';
    backdrop.style.background = 'rgba(20, 20, 30, 0.82)';
    backdrop.style.zIndex = 9999;
    backdrop.style.transition = 'opacity 0.3s';
    backdrop.style.opacity = '1';
    document.body.appendChild(backdrop);
  } else {
    backdrop.style.opacity = '1';
    backdrop.style.display = 'block';
  }

  // Cria ou seleciona o container central dos cards (apenas para centralizar)
  let listContainer = document.getElementById('process-metrics-list-container');
  if (!listContainer) {
    listContainer = document.createElement('div');
    listContainer.id = 'process-metrics-list-container';
    listContainer.style.position = 'fixed';
    listContainer.style.top = '0';
    listContainer.style.left = '0';
    listContainer.style.width = '100vw';
    listContainer.style.height = '100vh';
    listContainer.style.zIndex = 10000;
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.alignItems = 'center';
    listContainer.style.justifyContent = 'center';
    listContainer.style.pointerEvents = 'none'; // só o card recebe eventos
    document.body.appendChild(listContainer);
  }

  // Card container
  const card = document.createElement('div');
  card.className = 'custom-card-ynex shadow-lg animate__animated animate__fadeInDown';
  card.style.width = '100%';
  card.style.maxWidth = '540px';
  card.style.minWidth = '320px';
  card.style.background = 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)';
  card.style.borderRadius = '20px';
  card.style.overflow = 'hidden';
  card.style.position = 'absolute';
  card.style.left = '50%';
  card.style.top = '50%';
  card.style.transform = 'translate(-50%, -50%)';
  card.style.minHeight = '380px';
  card.style.zIndex = 10001;
  card.style.pointerEvents = 'auto';
  card.style.willChange = 'transform, opacity';

  // Separar os papéis principais dos demais, já na ordem desejada
  const principais = ['COMERCIAL', 'INSIDE SALES'];
  const secundarios = ['FINANCEIRO OPERACIONAL', 'OPERACIONAL', 'DOCUMENTAL', 'PRICING'];
  let destaqueHtml = '';
  let outrosHtml = '';
  // Função para capitalizar nomes e papéis
  function capitalize(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/(^|\s|\-)([a-záéíóúãõâêîôûç])/g, (m, p1, p2) => p1 + p2.toUpperCase());
  }
  if (processo.Responsaveis && typeof processo.Responsaveis === 'object') {
    // Garante ordem: Comercial, Inside Sales
    principais.forEach(papelRef => {
      Object.entries(processo.Responsaveis).forEach(([papel, resp]) => {
        if (papel.toUpperCase() === papelRef) {
          destaqueHtml += `
            <div class="text-center mx-2">
              <span class="avatar avatar-xxl border border-primary shadow mb-2" style="width:84px;height:84px;overflow:hidden;display:inline-block;">
                <img src="${resp.foto}" alt="${papel}" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null;this.src='${IMG_PADRAO}';">
              </span>
              <div class="fw-semibold mt-2">${capitalize(resp.nome)}</div>
              <div class="text-primary small fw-bold">${capitalize(papel)}</div>
            </div>
          `;
        }
      });
    });
    // Secundários
    secundarios.forEach(papelRef => {
      Object.entries(processo.Responsaveis).forEach(([papel, resp]) => {
        if (papel.toUpperCase() === papelRef) {
          outrosHtml += `
            <div class="text-center mx-1" style="display:inline-block;">
              <span class="avatar avatar-sm border border-light mb-1" style="width:32px;height:32px;overflow:hidden;display:inline-block;">
                <img src="${resp.foto}" alt="${papel}" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null;this.src='${IMG_PADRAO}';">
              </span>
              <div class="xsmall" style="font-size:11px;">${capitalize(resp.nome)}</div>
              <div class="text-muted xsmall" style="font-size:10px;">${capitalize(papel)}</div>
            </div>
          `;
        }
      });
    });
  }

  card.innerHTML = `
    <div class="card-header-ynex bg-gradient-primary text-white d-flex align-items-center justify-content-center py-3" style="background: linear-gradient(90deg, #845adf 0%, #23b7e5 100%);">
      <i class="bi bi-trophy fs-2 me-2"></i>
      <span class="fw-bold fs-18">Processo Fechado com Sucesso!</span>
    </div>
    <div class="card-body-ynex p-4">
      <div class="text-center mb-3">
        <span class="badge bg-info-gradient fs-16 py-2 px-4 mb-2" style="font-size: 1.15rem; letter-spacing: 1px; background: linear-gradient(90deg, #23b7e5 0%, #845adf 100%); color: #fff;">Nº Processo: <b>${processo.Numero_Processo}</b></span>
      </div>
      <div class="d-flex justify-content-center align-items-center gap-2 mb-3">
        <span class="badge bg-primary-gradient text-white"><i class="bi ${processo.Modalidade?.toLowerCase().includes('marítimo') ? 'bi-ship' : 'bi-airplane'} me-1"></i>${processo.Modalidade}</span>
        <span class="badge bg-light text-dark border"><i class="bi bi-calendar me-1"></i>${processo.DataAbertura || ''}</span>
      </div>
      <div class="d-flex align-items-center justify-content-center mb-4 gap-2">
        <span class="badge badge-origem-destino fs-13 px-3 py-2">
          <i class="bi bi-geo-alt me-1"></i>${processo.Origem || ''}
        </span>
        <span class="fs-2 text-primary"><i class="bi bi-arrow-right"></i></span>
        <span class="badge badge-origem-destino fs-13 px-3 py-2">
          <i class="bi bi-geo-alt me-1"></i>${processo.Destino || ''}
        </span>
      </div>
      <div class="d-flex justify-content-center gap-4 mb-2">
        ${destaqueHtml}
      </div>
      ${outrosHtml ? `<div class="d-flex justify-content-center flex-wrap gap-2 mt-3">${outrosHtml}</div>` : ''}
    </div>
    <style>
      .avatar-xxl { width: 84px !important; height: 84px !important; border-radius: 50% !important; }
      .avatar-sm { width: 32px !important; height: 32px !important; border-radius: 50% !important; }
      .avatar-xl { width: 64px !important; height: 64px !important; border-radius: 50% !important; }
      .custom-card-ynex { box-shadow: 0 8px 32px rgba(132,90,223,0.18) !important; }
      .d-flex { display: flex !important; }
      .justify-content-center { justify-content: center !important; }
      .align-items-center { align-items: center !important; }
      .gap-2 { gap: 0.5rem !important; }
      .gap-4 { gap: 1.5rem !important; }
      .flex-wrap { flex-wrap: wrap !important; }
      .xsmall { font-size: 11px !important; }
      .badge-origem-destino {
        background: #ff2c2c !important;
        color: #fff !important;
        box-shadow: 0 2px 8px rgba(255,44,44,0.12);
        font-weight: 500;
        border: none !important;
      }
      .badge-origem-destino i { color: #fff !important; }
      @keyframes card-entra {
        0% { transform: translate(-50%, 80vh) scale(0.95); opacity: 0.7; }
        80% { transform: translate(-50%, -52%) scale(1.03); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
      @keyframes foguete-sai {
        0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -120vh) scale(1.1); }
      }
    </style>
  `;
  listContainer.appendChild(card);

  // Animação de entrada
  card.style.animation = 'card-entra 1.5s cubic-bezier(0.22, 1, 0.36, 1)';
  card.style.transform = 'translate(-50%, -50%)';
  card.style.opacity = '1';

  // Função para remover o card com animação de foguete
  function removeCardWithRocket() {
    // Bloqueia interações durante a animação de saída
    listContainer.style.pointerEvents = 'none';
    card.style.animation = 'foguete-sai 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards';
    setTimeout(() => {
      card.remove();
      isShowingCard = false;
      listContainer.style.pointerEvents = '';
      // Esconde o backdrop se não houver mais cards
      if (processQueue.length === 0) {
        backdrop.style.opacity = '0';
        setTimeout(() => { backdrop.style.display = 'none'; }, 300);
      }
      showNextProcessCard();
    }, 1500);
  }

  // Remove automaticamente após 7 segundos
  setTimeout(removeCardWithRocket, 7000);
}

// Função para mostrar o próximo card da fila
function showNextProcessCard() {
  if (processQueue.length > 0 && !isShowingCard) {
    const processo = processQueue.shift();
    launchFireworks();
    showProcessCardSequential(processo);
  }
}

// Função principal para iniciar o listener
function initProcessMetricsListener(socket) {
  console.log('initProcessMetricsListener')
  socket.on('newProcess_metrics', function (processos) {
    if (processos && processos.length > 0) {
      console.log(processos);
      processos.forEach(processo => {
        processQueue.push(processo); // Agora já vem pronto do backend
      });
      showNextProcessCard();
    }
  });
}

// Exporta a função globalmente
window.initProcessMetricsListener = initProcessMetricsListener;

// Função para reproduzir um som
function playApplause() {
  const audio = new Audio(SOUND_PALMAS);
  audio.volume = 0.7;
  audio.play();
} 