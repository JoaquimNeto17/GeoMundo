/* ============================================================
   GEO MUNDO — app.js
   Inicialização geral, navegação entre telas, modo exploração
   e o fluxo de nome do jogador / ranking.
   ============================================================ */

let bancoPaises = {};
let modoExploracaoAtivo = false;

/**
 * Inicializa a aplicação. Cada etapa é protegida individualmente:
 * se o carregamento dos dados falhar (por exemplo, o jogo foi
 * aberto direto como arquivo, sem servidor local), o mapa e os
 * botões continuam funcionando e uma mensagem clara é exibida
 * em vez de travar em "Carregando...".
 */
async function init() {
  renderizarRanking("ranking-list", carregarRanking());

  let perguntasOk = true;
  try {
    await carregarPerguntas();
  } catch (err) {
    console.error("Erro ao carregar perguntas:", err);
    perguntasOk = false;
  }

  try {
    const resp = await fetch("data/countries.json");
    bancoPaises = await resp.json();
  } catch (err) {
    console.error("Erro ao carregar países:", err);
  }

  if (!perguntasOk) {
    el("question-text").textContent =
      "Não foi possível carregar as perguntas. Rode o projeto com um servidor local (ex.: python3 -m http.server) em vez de abrir o arquivo diretamente.";
  }

  initMap();
  ligarEventos();
}

function ligarEventos() {
  el("btn-jogar").addEventListener("click", () => {
    modoExploracaoAtivo = false;
    abrirModalNome((nome) => startGame(nome));
  });

  el("btn-explorar").addEventListener("click", abrirModoExploracao);

  el("btn-conquistas").addEventListener("click", () => {
    alert("🏆 Conquistas: em breve! Continue jogando para desbloquear novas conquistas.");
  });

  el("btn-como-jogar").addEventListener("click", () => {
    alert(
      "COMO JOGAR\n\n" +
      "1. Escolha JOGAR, informe seu nome e responda perguntas de geografia.\n" +
      "2. Use o mapa para se localizar durante os desafios.\n" +
      "3. Cada erro custa uma vida — você tem 3 vidas por partida.\n" +
      "4. Acertos seguidos aumentam sua sequência e rendem XP bônus.\n" +
      "5. Complete uma região para avançar de nível.\n" +
      "6. Ao final da partida, seu XP entra no ranking."
    );
  });

  el("btn-continuar").addEventListener("click", () => nextQuestion());
  el("btn-hint").addEventListener("click", () => usarDica());

  el("btn-jogar-novamente").addEventListener("click", () => {
    fecharOverlays();
    abrirModalNome((nome) => startGame(nome));
  });

  el("btn-menu-principal").addEventListener("click", voltarAoMenu);
  el("btn-vitoria-menu").addEventListener("click", voltarAoMenu);
  el("btn-proximo-nivel").addEventListener("click", () => {
    fecharOverlays();
    goToNextLevel();
  });
}

/**
 * Abre o modal pedindo o nome do jogador. Ao confirmar, chama
 * callback(nome) e fecha o modal. Cada partida pede um nome novo,
 * garantindo que o resultado anterior nunca seja reaproveitado.
 */
function abrirModalNome(callback) {
  const overlay = el("overlay-nome");
  const input = el("input-nome-jogador");
  input.value = "";
  overlay.classList.remove("hidden");
  input.focus();

  const confirmar = () => {
    limpar();
    overlay.classList.add("hidden");
    callback(input.value.trim());
  };
  const cancelar = () => {
    limpar();
    overlay.classList.add("hidden");
  };
  const onEnter = (e) => {
    if (e.key === "Enter") confirmar();
  };

  function limpar() {
    el("btn-confirmar-nome").removeEventListener("click", confirmar);
    el("btn-cancelar-nome").removeEventListener("click", cancelar);
    input.removeEventListener("keydown", onEnter);
  }

  el("btn-confirmar-nome").addEventListener("click", confirmar);
  el("btn-cancelar-nome").addEventListener("click", cancelar);
  input.addEventListener("keydown", onEnter);
}

function voltarAoMenu() {
  fecharOverlays();
  const painel = document.getElementById("explore-panel");
  if (painel) painel.remove();
  renderizarRanking("ranking-list", carregarRanking());
  mostrarTela("screen-menu");
}

/**
 * Ativa o modo "Explorar o Mundo": o jogador navega livremente
 * pelo mapa e pode clicar em países para ver informações.
 */
function abrirModoExploracao() {
  modoExploracaoAtivo = true;
  mostrarTela("screen-game");
  el("map-hint").textContent = "Modo exploração: clique em um país no mapa para ver detalhes.";
  document.querySelector(".quiz-column").innerHTML = `
    <div class="question-card">
      <div class="eyebrow">Modo exploração</div>
      <div class="question-text" style="font-size:16px;">Clique em qualquer país no mapa para descobrir sua capital, idioma e moeda — e desafiar-se com perguntas sobre ele.</div>
    </div>
  `;
  centralizarRegiao("mundo");

  aoSelecionarPais((nomePais) => {
    const chaveEncontrada = Object.keys(bancoPaises).find(
      (nome) => nome.toLowerCase() === nomePais.toLowerCase()
    );
    if (!chaveEncontrada) return;

    const dados = bancoPaises[chaveEncontrada];
    adicionarMarcador(dados.coordenadas, chaveEncontrada);
    centralizarMapa(dados.coordenadas, 4.2);
    renderizarPainelExploracao(chaveEncontrada, dados);

    document.getElementById("btn-desafiar-pais").addEventListener("click", () => {
      abrirModalNome((nome) => desafiarPais(nome, chaveEncontrada, dados));
    });
  });
}

/**
 * Inicia uma partida focada nas perguntas de um país específico
 * escolhido no modo exploração.
 */
function desafiarPais(nomeJogador, nomePais, dados) {
  modoExploracaoAtivo = false;
  const painel = document.getElementById("explore-panel");
  if (painel) painel.remove();

  const idx = REGIOES.findIndex((r) => r.id === dados.regiao);
  estado.progress = novaSessao(nomeJogador);
  estado.vidas = VIDAS_MAX;
  estado.streakAtual = 0;
  estado.acertosNoNivel = 0;
  estado.regiaoAtualIndex = idx >= 0 ? idx : 0;

  atualizarStreakUI(estado.streakAtual);
  renderizarVidas(estado.vidas, VIDAS_MAX);
  atualizarHudJogo(estado.progress, regiaoAtual().nome);
  centralizarRegiao(regiaoAtual().id);
  el("map-hint").textContent = "Use o mapa para explorar a região enquanto responde.";

  loadQuestion();
}

document.addEventListener("DOMContentLoaded", init);
