/* ============================================================
   GEO MUNDO — ui.js
   Funções responsáveis por atualizar o DOM. Não contém regras
   de jogo, apenas leitura/escrita de elementos visuais.
   ============================================================ */

const el = (id) => document.getElementById(id);

function mostrarTela(nomeTela) {
  ["screen-menu", "screen-game"].forEach((id) => el(id).classList.add("hidden"));
  el(nomeTela).classList.remove("hidden");

  // O Leaflet é inicializado enquanto a tela do jogo ainda está oculta
  // (display:none), então ele mede o container como 0x0 pixels. Isso
  // corrompe os cálculos internos de projeção (gera coordenadas NaN)
  // até que o mapa seja "avisado" do novo tamanho real do container.
  if (nomeTela === "screen-game" && typeof geoMap !== "undefined" && geoMap) {
    geoMap.invalidateSize();
  }
}

function fecharOverlays() {
  ["overlay-result", "overlay-gameover", "overlay-vitoria"].forEach((id) =>
    el(id).classList.add("hidden")
  );
}

/**
 * Renderiza a lista de ranking (usada no menu e na tela de game over).
 * nomeDestaque, se informado, recebe destaque visual (última partida).
 */
function renderizarRanking(containerId, ranking, nomeDestaque) {
  const container = el(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (!ranking || ranking.length === 0) {
    container.innerHTML = '<div class="ranking-empty">Nenhuma partida registrada ainda. Jogue para entrar no ranking!</div>';
    return;
  }

  ranking.forEach((entrada, i) => {
    const row = document.createElement("div");
    row.className = "ranking-row" + (nomeDestaque && entrada.nome === nomeDestaque && i === 0 ? " destaque" : "");
    row.innerHTML = `<span class="ranking-pos">${i + 1}º</span><span class="ranking-nome">${entrada.nome}</span><span class="ranking-xp">${entrada.xp} XP</span>`;
    container.appendChild(row);
  });
}

function atualizarHudJogo(progress, regiaoNome) {
  el("hud-nome").textContent = progress.nome;
  el("hud-xp").textContent = progress.xp;
  el("hud-nivel").textContent = "Nível " + progress.nivel;
  el("hud-regiao").textContent = regiaoNome;
}

function renderizarPergunta(pergunta) {
  el("question-text").textContent = pergunta.pergunta;
  el("hint-box-wrap").innerHTML = "";

  const letras = ["A", "B", "C", "D"];
  const container = el("answers");
  container.innerHTML = "";

  pergunta.alternativas.forEach((texto, i) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.dataset.index = i;
    btn.innerHTML = `<span class="answer-letter">${letras[i]}</span><span>${texto}</span>`;
    container.appendChild(btn);
  });
}

function marcarRespostaSelecionada(index) {
  document.querySelectorAll(".answer-btn").forEach((btn) => {
    btn.classList.toggle("selected", Number(btn.dataset.index) === index);
  });
}

function revelarResposta(indexCorreta, indexEscolhida) {
  document.querySelectorAll(".answer-btn").forEach((btn) => {
    const i = Number(btn.dataset.index);
    btn.disabled = true;
    if (i === indexCorreta) btn.classList.add("correct");
    else if (i === indexEscolhida) btn.classList.add("wrong");
  });
}

function renderizarVidas(vidasAtuais, vidasMax) {
  const container = el("lives");
  container.innerHTML = "";
  for (let i = 0; i < vidasMax; i++) {
    const span = document.createElement("span");
    span.className = "life" + (i >= vidasAtuais ? " lost" : "");
    span.textContent = "❤️";
    container.appendChild(span);
  }
}

function atualizarStreakUI(streak) {
  el("streak-value").textContent = streak;
}

function mostrarDica(texto) {
  const wrap = el("hint-box-wrap");
  const box = document.createElement("div");
  box.className = "hint-box";
  box.textContent = "💡 " + texto;
  wrap.appendChild(box);
}

function mostrarResultado({ acertou, pergunta, xpGanho, progress, regiaoNome }) {
  const panel = el("result-panel");
  panel.className = "result-panel " + (acertou ? "correct" : "wrong");

  el("result-icon").textContent = acertou ? "✅" : "❌";
  el("result-icon").className = "result-icon " + (acertou ? "correct" : "wrong");
  el("result-title").textContent = acertou ? "CORRETO!" : "ERRADO!";
  el("result-title").className = "result-title " + (acertou ? "correct" : "wrong");

  if (acertou) {
    el("result-desc").innerHTML = `Parabéns! A resposta certa era <strong>${pergunta.alternativas[pergunta.resposta]}</strong>.`;
  } else {
    el("result-desc").innerHTML = `A resposta correta é <strong>${pergunta.alternativas[pergunta.resposta]}</strong>.`;
  }

  el("result-xp").textContent = (xpGanho >= 0 ? "+" : "") + xpGanho + " XP";
  el("result-xp").className = "result-xp " + (acertou ? "correct" : "wrong");

  el("status-xp").textContent = progress.xp;
  el("status-streak").textContent = progress.streakAtual;
  el("status-nivel").textContent = progress.nivel;
  el("status-regiao").textContent = regiaoNome;
  el("status-paises").textContent = progress.paisesDescobertos.length;

  document.querySelectorAll(".status-row").forEach((row) => row.classList.remove("correct", "wrong"));

  el("overlay-result").classList.remove("hidden");
}

function atualizarContador(valor) {
  el("countdown-ring").textContent = valor;
}

function mostrarGameOver(stats, ranking) {
  el("go-nome").textContent = `🌎 ${stats.nome}, sua jornada terminou`;
  el("go-xp").textContent = stats.xp;
  el("go-respondidas").textContent = stats.perguntasRespondidas;
  el("go-acertos").textContent = stats.acertos;
  el("go-erros").textContent = stats.erros;
  el("go-streak").textContent = stats.maiorSequencia;
  renderizarRanking("go-ranking-list", ranking || carregarRanking(), stats.nome);
  el("overlay-gameover").classList.remove("hidden");
}

function mostrarVitoria({ regiaoNome, xpGanho, acertos, total }) {
  el("vitoria-regiao").textContent = regiaoNome;
  el("vitoria-xp").textContent = "+" + xpGanho + " XP";
  el("vitoria-acertos").textContent = acertos + "/" + total;
  el("overlay-vitoria").classList.remove("hidden");
}

function renderizarPainelExploracao(nome, dados) {
  const mapColumn = document.querySelector(".map-column");
  let painel = document.getElementById("explore-panel");
  if (painel) painel.remove();

  painel = document.createElement("div");
  painel.id = "explore-panel";
  painel.className = "explore-panel";
  painel.innerHTML = `
    <div class="explore-flag">${dados.bandeira}</div>
    <div class="explore-name">${nome.toUpperCase()}</div>
    <div class="explore-row"><span>Continente</span><span>${dados.continente}</span></div>
    <div class="explore-row"><span>Capital</span><span>${dados.capital}</span></div>
    <div class="explore-row"><span>Idioma</span><span>${dados.idioma}</span></div>
    <div class="explore-row"><span>Moeda</span><span>${dados.moeda}</span></div>
    <button class="btn btn-primary" id="btn-desafiar-pais" style="width:100%; margin-top:6px;">DESAFIAR ESTE PAÍS</button>
  `;
  mapColumn.appendChild(painel);
  return painel;
}
