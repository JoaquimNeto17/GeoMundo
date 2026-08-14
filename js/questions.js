/* ============================================================
   GEO MUNDO — questions.js
   Carrega o banco de perguntas e seleciona perguntas
   dinamicamente, evitando repetição imediata.
   ============================================================ */

/**
 * Cada região representa um nível da jornada. "nomeNivel" é o título
 * exibido ao jogador (ex.: Explorador) e "dificuldade" define quais
 * perguntas (campo "dificuldade" do questions.json) podem aparecer
 * nesse nível. A dificuldade sobe conforme o jogador avança:
 * níveis iniciais só puxam perguntas fáceis, os do meio misturam
 * fácil/médio ou só médio, e os finais vão para médio/difícil e
 * difícil. O último nível ("Mundo") mistura tudo.
 */
const REGIOES = [
  { id: "america-do-sul", nome: "América do Sul", nivel: 1, nomeNivel: "Explorador", dificuldade: ["facil"] },
  { id: "america-do-norte", nome: "América do Norte", nivel: 2, nomeNivel: "Aventureiro", dificuldade: ["facil"] },
  { id: "europa", nome: "Europa", nivel: 3, nomeNivel: "Viajante", dificuldade: ["facil", "medio"] },
  { id: "asia", nome: "Ásia", nivel: 4, nomeNivel: "Desbravador", dificuldade: ["medio"] },
  { id: "africa", nome: "África", nivel: 5, nomeNivel: "Estrategista", dificuldade: ["medio", "dificil"] },
  { id: "oceania", nome: "Oceania", nivel: 6, nomeNivel: "Mestre", dificuldade: ["dificil"] },
  { id: "mundo", nome: "Mundo", nivel: 7, nomeNivel: "Lenda do GeoMundo", dificuldade: ["facil", "medio", "dificil"] }
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
 * Filtra uma lista de perguntas pelas dificuldades permitidas no
 * nível atual (campo "dificuldade" de cada pergunta no JSON).
 */
function filtrarPorDificuldade(perguntas, dificuldadesPermitidas) {
  if (!dificuldadesPermitidas || dificuldadesPermitidas.length === 0) return perguntas;
  return perguntas.filter((p) => dificuldadesPermitidas.includes(p.dificuldade));
}

/**
 * Escolhe a próxima pergunta de forma aleatória, evitando repetir
 * as últimas perguntas já usadas (histórico) e priorizando a(s)
 * dificuldade(s) do nível atual. Se a região não tiver perguntas
 * suficientes na dificuldade do nível, cai de volta para todas as
 * perguntas da região, para nunca travar o jogo.
 */
function proximaPergunta(regiaoId, historicoIds, dificuldadesPermitidas) {
  const todasDaRegiao = perguntasPorRegiao(regiaoId);
  if (todasDaRegiao.length === 0) return null;

  const doNivel = filtrarPorDificuldade(todasDaRegiao, dificuldadesPermitidas);
  const pool = doNivel.length > 0 ? doNivel : todasDaRegiao;

  let candidatas = pool.filter((p) => !historicoIds.includes(p.id));

  // se todas já foram usadas recentemente, libera o histórico dessa região
  if (candidatas.length === 0) {
    candidatas = pool;
  }

  const escolhida = candidatas[Math.floor(Math.random() * candidatas.length)];
  return escolhida;
}
