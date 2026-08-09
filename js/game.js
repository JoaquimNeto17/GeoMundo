/* ============================================================
   GEO MUNDO — game.js
   Regras do jogo: XP, vidas, sequência (streak), níveis,
   transições entre perguntas, game over e vitória.
   ============================================================ */

const VIDAS_MAX = 3;
const XP_ACERTO = 100;
const XP_ERRO = -25;
const XP_DICA = -15;
const BONUS_STREAK_3 = 50;
const BONUS_STREAK_5 = 100;

let estado = {
  progress: null,
  vidas: VIDAS_MAX,
  streakAtual: 0,
  regiaoAtualIndex: 0,
  perguntaAtual: null,
  acertosNoNivel: 0,
  respondendo: false,
  countdownTimer: null,
  autoAvancoTimer: null,
  respostaSelecionadaIndex: null
};

function regiaoAtual() {
  return REGIOES[estado.regiaoAtualIndex];
}

/**
 * Inicia uma nova partida a partir do menu. Cada partida começa
 * do zero (XP, vidas, nível) e é identificada pelo nome informado.
 */
function startGame(nomeJogador) {
  estado.progress = novaSessao(nomeJogador);
  estado.vidas = VIDAS_MAX;
  estado.streakAtual = 0;
  estado.acertosNoNivel = 0;
  estado.regiaoAtualIndex = 0;

  mostrarTela("screen-game");
  centralizarRegiao(regiaoAtual().id);
  renderizarVidas(estado.vidas, VIDAS_MAX);
  atualizarStreakUI(estado.streakAtual);
  atualizarHudJogo(estado.progress, regiaoAtual().nome);

  loadQuestion();
}

/**
 * Carrega a próxima pergunta na tela.
 */
function loadQuestion() {
  limparDestaque();
  const pergunta = proximaPergunta(regiaoAtual().id, estado.progress.historicoPerguntas.slice(-6));
  if (!pergunta) {
    completeLevel();
    return;
  }

  estado.perguntaAtual = pergunta;
  estado.respondendo = true;
  estado.respostaSelecionadaIndex = null;

  renderizarPergunta(pergunta);

  document.querySelectorAll(".answer-btn").forEach((btn) => {
    btn.addEventListener("click", onAnswerClick);
  });
}

function onAnswerClick(e) {
  if (!estado.respondendo) return;
  const btn = e.currentTarget;
  const index = Number(btn.dataset.index);
  checkAnswer(index);
}

/**
 * Verifica a resposta escolhida pelo jogador.
 */
function checkAnswer(indexEscolhido) {
  if (!estado.respondendo) return;
  estado.respondendo = false;
  estado.respostaSelecionadaIndex = indexEscolhido;

  const pergunta = estado.perguntaAtual;
  const acertou = indexEscolhido === pergunta.resposta;

  marcarRespostaSelecionada(indexEscolhido);
  revelarResposta(pergunta.resposta, indexEscolhido);

  const xpGanho = acertou ? calcularXpAcerto() : XP_ERRO;
  updateScore(xpGanho);

  if (acertou) {
    estado.streakAtual++;
    estado.acertosNoNivel++;
    estado.progress.acertos++;
    if (estado.streakAtual > estado.progress.maiorSequencia) {
      estado.progress.maiorSequencia = estado.streakAtual;
    }
  } else {
    estado.streakAtual = 0;
    estado.progress.erros++;
    updateLives(-1);
  }

  estado.progress.perguntasRespondidas++;
  estado.progress.historicoPerguntas.push(pergunta.id);
  if (estado.progress.historicoPerguntas.length > 20) {
    estado.progress.historicoPerguntas.shift();
  }

  atualizarStreakUI(estado.streakAtual);

  // pequena pausa para o jogador ver o feedback nos botões antes do overlay
  setTimeout(() => {
    if (estado.vidas <= 0) {
      gameOver();
      return;
    }
    showResult(acertou, xpGanho, pergunta);
  }, 550);
}

function calcularXpAcerto() {
  let xp = XP_ACERTO;
  if (estado.streakAtual + 1 === 3) xp += BONUS_STREAK_3;
  if (estado.streakAtual + 1 === 5) xp += BONUS_STREAK_5;
  return xp;
}

/**
 * Atualiza o XP do jogador (positivo ou negativo).
 */
function updateScore(delta) {
  estado.progress.xp = Math.max(0, estado.progress.xp + delta);
  atualizarHudJogo(estado.progress, regiaoAtual().nome);
}

/**
 * Atualiza as vidas do jogador.
 */
function updateLives(delta) {
  estado.vidas = Math.max(0, Math.min(VIDAS_MAX, estado.vidas + delta));
  renderizarVidas(estado.vidas, VIDAS_MAX);
}

/**
 * Exibe a tela de resultado (correto/errado) com contagem regressiva.
 */
function showResult(acertou, xpGanho, pergunta) {
  mostrarResultado({
    acertou,
    pergunta,
    xpGanho,
    progress: { ...estado.progress, streakAtual: estado.streakAtual },
    regiaoNome: regiaoAtual().nome
  });

  let contador = 3;
  atualizarContador(contador);
  estado.countdownTimer = setInterval(() => {
    contador--;
    atualizarContador(contador);
    if (contador <= 0) clearInterval(estado.countdownTimer);
  }, 1000);

  estado.autoAvancoTimer = setTimeout(() => nextQuestion(), 3000);
}

/**
 * Avança para a próxima pergunta (chamado pelo botão CONTINUAR ou
 * automaticamente após a contagem regressiva).
 */
function nextQuestion() {
  clearInterval(estado.countdownTimer);
  clearTimeout(estado.autoAvancoTimer);
  fecharOverlays();

  if (estado.acertosNoNivel >= PERGUNTAS_POR_NIVEL) {
    completeLevel();
    return;
  }

  loadQuestion();
}

/**
 * Chamado quando as vidas chegam a zero.
 */
function gameOver() {
  clearInterval(estado.countdownTimer);
  clearTimeout(estado.autoAvancoTimer);
  const ranking = salvarNoRanking(estado.progress);
  mostrarGameOver(estado.progress, ranking);
}

/**
 * Chamado quando o jogador atinge o número necessário de acertos
 * na região atual, concluindo o nível.
 */
function completeLevel() {
  const xpGanhoNivel = estado.acertosNoNivel * XP_ACERTO;
  const proximoIndex = Math.min(estado.regiaoAtualIndex + 1, REGIOES.length - 1);

  if (estado.progress.nivel <= regiaoAtual().nivel) {
    estado.progress.nivel = Math.min(regiaoAtual().nivel + 1, REGIOES.length);
  }

  mostrarVitoria({
    regiaoNome: regiaoAtual().nome,
    xpGanho: xpGanhoNivel,
    acertos: estado.acertosNoNivel,
    total: PERGUNTAS_POR_NIVEL
  });

  estado.regiaoAtualIndex = proximoIndex;
}

/**
 * Continua para o próximo nível (chamado no botão da tela de vitória).
 */
function goToNextLevel() {
  fecharOverlays();
  estado.acertosNoNivel = 0;
  estado.vidas = VIDAS_MAX;
  renderizarVidas(estado.vidas, VIDAS_MAX);
  centralizarRegiao(regiaoAtual().id);
  atualizarHudJogo(estado.progress, regiaoAtual().nome);
  loadQuestion();
}

/**
 * Usa uma dica na pergunta atual, consumindo XP.
 */
function usarDica() {
  if (!estado.perguntaAtual || !estado.perguntaAtual.dicas) return;
  const idx = document.querySelectorAll(".hint-box").length;
  const dicas = estado.perguntaAtual.dicas;
  if (idx >= dicas.length) return;

  updateScore(XP_DICA);
  mostrarDica(dicas[idx]);
}
