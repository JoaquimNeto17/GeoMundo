/* ============================================================
   GEO MUNDO — questions.js
   Carrega o banco de perguntas e seleciona perguntas
   dinamicamente, evitando repetição imediata.
   ============================================================ */

const REGIOES = [
  { id: "america-do-sul", nome: "América do Sul", nivel: 1 },
  { id: "america-do-norte", nome: "América do Norte", nivel: 2 },
  { id: "europa", nome: "Europa", nivel: 3 },
  { id: "asia", nome: "Ásia", nivel: 4 },
  { id: "africa", nome: "África", nivel: 5 },
  { id: "oceania", nome: "Oceania", nivel: 6 },
  { id: "mundo", nome: "Mundo", nivel: 7 }
];

const PERGUNTAS_POR_NIVEL = 5; // quantidade de acertos para concluir um nível

let bancoPerguntas = [];

/**
 * Carrega o JSON de perguntas do disco.
 */
async function carregarPerguntas() {
  const resp = await fetch("data/questions.json");
  bancoPerguntas = await resp.json();
  return bancoPerguntas;
}

/**
 * Retorna a lista de perguntas de uma região específica.
 * Se a região for "mundo", retorna todas.
 */
function perguntasPorRegiao(regiaoId) {
  if (regiaoId === "mundo") return bancoPerguntas;
  return bancoPerguntas.filter((p) => p.regiao === regiaoId);
}

/**
 * Escolhe a próxima pergunta de forma aleatória, evitando repetir
 * as últimas perguntas já usadas (histórico).
 */
function proximaPergunta(regiaoId, historicoIds) {
  const disponiveis = perguntasPorRegiao(regiaoId);
  if (disponiveis.length === 0) return null;

  let candidatas = disponiveis.filter((p) => !historicoIds.includes(p.id));

  // se todas já foram usadas recentemente, libera o histórico dessa região
  if (candidatas.length === 0) {
    candidatas = disponiveis;
  }

  const escolhida = candidatas[Math.floor(Math.random() * candidatas.length)];
  return escolhida;
}
