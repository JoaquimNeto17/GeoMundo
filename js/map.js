let geoMap = null;
let paisSelecionadoCallback = null;

// Marcadores do modo exploração
let marcadorAtual = null;

/**
 * Inicializa o mapa Leaflet dentro da div #map.
 */
function initMap() {
  geoMap = L.map("map", {
    center: [-15, -55],
    zoom: 3,
    zoomControl: true,
    worldCopyJump: true
  });

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    minZoom: 2,
    attribution: "© OpenStreetMap contributors"
  }).addTo(geoMap);

  geoMap.on("click", (e) => {
    onClickExploracao(e);
  });
}

/**
 * Cria um ícone de emoji para usar como marcador (sem depender
 * de imagens externas).
 */
function criarIconeEmoji(emoji, classeExtra) {
  return L.divIcon({
    html: `<div class="geo-marker-icon ${classeExtra || ""}">${emoji}</div>`,
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 26]
  });
}

/**
 * Centraliza o mapa em uma coordenada [lng, lat] com um zoom específico.
 */
function centralizarMapa(coordenadasLngLat, zoom = 4) {
  if (!geoMap) return;
  const [lng, lat] = coordenadasLngLat;
  geoMap.flyTo([lat, lng], zoom, { duration: 0.9 });
}

/**
 * Aplica zoom em uma região do mundo (usado ao trocar de nível).
 */
const CENTRO_REGIAO = {
  "america-do-sul": { center: [-60, -15], zoom: 3 },
  "america-do-norte": { center: [-100, 45], zoom: 3 },
  europa: { center: [15, 50], zoom: 3.5 },
  asia: { center: [90, 35], zoom: 3 },
  africa: { center: [20, 2], zoom: 3 },
  oceania: { center: [140, -25], zoom: 3.2 },
  mundo: { center: [10, 15], zoom: 2 }
};

function centralizarRegiao(regiaoId) {
  const alvo = CENTRO_REGIAO[regiaoId] || CENTRO_REGIAO["mundo"];
  centralizarMapa(alvo.center, alvo.zoom);
}

/**
 * Adiciona um marcador simples no mapa (usado no modo exploração).
 */
function adicionarMarcador(coordenadasLngLat, label) {
  if (!geoMap) return;
  if (marcadorAtual) geoMap.removeLayer(marcadorAtual);
  const [lng, lat] = coordenadasLngLat;
  marcadorAtual = L.marker([lat, lng], { icon: criarIconeEmoji("📍") }).addTo(geoMap);
  if (label) marcadorAtual.bindPopup(label).openPopup();
}

/**
 * Define a função chamada quando o jogador clica em um país no
 * modo exploração. Como os tiles do OSM não trazem fronteiras
 * vetoriais clicáveis, localizamos o país conhecido mais próximo
 * do ponto clicado (dentro de um raio razoável).
 */
function aoSelecionarPais(callback) {
  paisSelecionadoCallback = callback;
}

function onClickExploracao(e) {
  if (!paisSelecionadoCallback || typeof bancoPaises === "undefined") return;

  let maisProximo = null;
  let menorDistancia = Infinity;

  Object.entries(bancoPaises).forEach(([nome, dados]) => {
    const [lng, lat] = dados.coordenadas;
    const dist = calcularDistanciaKm(e.latlng.lat, e.latlng.lng, lat, lng);
    if (dist < menorDistancia) {
      menorDistancia = dist;
      maisProximo = nome;
    }
  });

  // só considera "clicou no país" se estiver a uma distância razoável
  if (maisProximo && menorDistancia <= 900) {
    paisSelecionadoCallback(maisProximo);
  }
}

/**
 * Calcula a distância em quilômetros entre duas coordenadas
 * geográficas usando a fórmula de Haversine (usada no modo
 * exploração para encontrar o país mais próximo do clique).
 */
function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // raio médio da Terra em km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Funções mantidas por compatibilidade com o restante do código
 * (não fazem mais nada útil sem as fronteiras vetoriais do Mapbox,
 * mas evitam quebrar chamadas existentes).
 */
function destacarPais() {}
function limparDestaque() {}
