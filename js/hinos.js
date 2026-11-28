const CAMINHO_HINOS = "./data/hinos.json";
const CHAVE_ESCALA_HINOS = "hinos_ccb_escala_fonte_v1";
const ESCALA_MIN = 0.75;
const ESCALA_MAX = 1.8;
const ESCALA_PASSO = 0.1;

let todosItens = [];
let listaHinos = [];
let listaCoros = [];
let modoBusca = "hino"; // "hino" | "coro" | "palavra"
let grupoLeituraAtual = "hino"; // "hino" | "coro"
let indiceLeituraAtual = -1;
let escalaFonte = 1.0;

const containerHinos = document.getElementById("hinos-container");
const telaLista = document.getElementById("hinos-tela-lista");
const telaLeitura = document.getElementById("hinos-tela-leitura");
const areaLista = document.getElementById("hinos-area-lista");
const areaLeitura = document.getElementById("hinos-area-leitura");
const inputBusca = document.getElementById("hinos-busca-input");
const tituloTopo = document.getElementById("hinos-titulo-topo");
const indicadorNum = document.getElementById("hinos-indicador-num");
const btnVoltarMenu = document.getElementById("btn-hinos-back");
const btnVoltarLista = document.getElementById("btn-hinos-voltar-lista");
const btnAnterior = document.getElementById("btn-hino-anterior");
const btnProximo = document.getElementById("btn-hino-proximo");
const btnFonteMenos = document.getElementById("btn-hino-fonte-diminuir");
const btnFonteMais = document.getElementById("btn-hino-fonte-aumentar");
const badgeFonte = document.getElementById("hinos-fonte-badge");
const botoesModo = document.querySelectorAll(".btn-modo-busca");

function normalizar(txt) {
  return String(txt || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escaparHtml(txt) {
  return String(txt || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function destacarPalavra(texto, termoBruto) {
  const escapado = escaparHtml(texto);
  const termoNorm = normalizar(termoBruto).trim();
  if (!termoNorm || modoBusca !== "palavra") {
    return escapado.replace(/\n/g, "<br>");
  }

  const mapaChars = [];
  const mapaIndices = [];
  for (let i = 0; i < texto.length; i++) {
    const normChar = normalizar(texto[i]);
    for (let j = 0; j < normChar.length; j++) {
      mapaChars.push(normChar[j]);
      mapaIndices.push(i);
    }
  }

  const textoNorm = mapaChars.join("");
  const intervalos = [];
  let pos = 0;
  while (pos <= textoNorm.length - termoNorm.length) {
    const achou = textoNorm.indexOf(termoNorm, pos);
    if (achou === -1) break;
    const ini = mapaIndices[achou];
    const fim = mapaIndices[achou + termoNorm.length - 1] + 1;
    intervalos.push([ini, fim]);
    pos = achou + termoNorm.length;
  }

  if (!intervalos.length) return escapado.replace(/\n/g, "<br>");

  let out = "";
  let cursor = 0;
  for (const [ini, fim] of intervalos) {
    if (ini < cursor) continue;
    out += escaparHtml(texto.slice(cursor, ini)).replace(/\n/g, "<br>");
    out += `<mark class="hino-destaque">${escaparHtml(texto.slice(ini, fim))}</mark>`;
    cursor = fim;
  }
  out += escaparHtml(texto.slice(cursor)).replace(/\n/g, "<br>");
  return out;
}

function atualizarPlaceholderBusca() {
  if (!inputBusca) return;
  if (modoBusca === "hino") {
    inputBusca.placeholder = "Buscar nº ou título do hino...";
  } else if (modoBusca === "coro") {
    inputBusca.placeholder = "Buscar nº ou título do coro...";
  } else {
    inputBusca.placeholder = "Buscar palavra nos hinos e coros...";
  }
}

function mostrarTela(tela) {
  telaLista.classList.toggle("ativa", tela === "lista");
  telaLeitura.classList.toggle("ativa", tela === "leitura");
}

export function fecharHinos() {
  mostrarTela("lista");
}

export async function iniciarHinos() {
  mostrarTela("lista");
  atualizarPlaceholderBusca();

  if (todosItens.length > 0) {
    renderizarResultados();
    return;
  }

  areaLista.innerHTML = `<div class="hinos-status">Carregando hinário...</div>`;
  try {
    const resp = await fetch(CAMINHO_HINOS);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const dados = await resp.json();
    todosItens = Array.isArray(dados) ? dados : [];

    listaHinos = todosItens
      .filter((item) => (item.tipo || "hino") === "hino")
      .sort((a, b) => Number(a.numero) - Number(b.numero));

    listaCoros = todosItens
      .filter((item) => item.tipo === "coro")
      .sort((a, b) => Number(a.numero) - Number(b.numero));

    renderizarResultados();
  } catch (err) {
    console.error("Erro ao carregar hinário:", err);
    areaLista.innerHTML = `
      <div class="hinos-status">
        <strong>Não foi possível carregar o hinário.</strong><br><br>
        Verifique se o arquivo <code>data/hinos.json</code> está na pasta <code>data/</code>.
      </div>
    `;
  }
}

function obterEstrofesItem(item) {
  if (Array.isArray(item.estrofes) && item.estrofes.length > 0) {
    return item.estrofes;
  }
  return String(item.letra || "")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function filtrarPorHino(termoBruto) {
  const termoNorm = normalizar(termoBruto);
  const ehNumero = /^\d+$/.test(termoBruto);

  return listaHinos
    .map((hino, idx) => ({ item: hino, index: idx, tipo: "hino" }))
    .filter(({ item }) => {
      if (!termoNorm) return true;
      const numStr = String(item.numero || "");
      if (ehNumero) {
        return numStr === termoBruto || numStr.startsWith(termoBruto);
      }
      return normalizar(`${item.numero} ${item.titulo || ""}`).includes(termoNorm);
    });
}

function filtrarPorCoro(termoBruto) {
  const termoNorm = normalizar(termoBruto);
  const ehNumero = /^\d+$/.test(termoBruto);

  return listaCoros
    .map((coro, idx) => ({ item: coro, index: idx, tipo: "coro" }))
    .filter(({ item }) => {
      if (!termoNorm) return true;
      const numStr = String(item.numero || "");
      if (ehNumero) {
        return numStr === termoBruto || numStr.startsWith(termoBruto);
      }
      const textoCoro = [
        item.numero || "",
        item.titulo || "",
        item.coro || "",
        ...obterEstrofesItem(item)
      ].join(" ");
      return normalizar(textoCoro).includes(termoNorm);
    });
}

function filtrarPorPalavra(termoBruto) {
  const termoNorm = normalizar(termoBruto);
  const matchItem = (item) => {
    if (!termoNorm) return true;
    const textoCompleto = [
      item.numero || "",
      item.titulo || "",
      item.coro || "",
      ...obterEstrofesItem(item)
    ].join(" ");
    return normalizar(textoCompleto).includes(termoNorm);
  };

  return {
    hinos: listaHinos
      .map((item, index) => ({ item, index, tipo: "hino" }))
      .filter(({ item }) => matchItem(item)),
    coros: listaCoros
      .map((item, index) => ({ item, index, tipo: "coro" }))
      .filter(({ item }) => matchItem(item))
  };
}

function montarCartao(entrada) {
  const { item, index, tipo } = entrada;
  const prefixo = tipo === "coro" ? "Coro" : "Hino";
  return `
    <button type="button" class="hino-card-btn" data-tipo="${tipo}" data-index="${index}">
      <span class="hino-card-num">${prefixo} ${escaparHtml(item.numero)}</span>
      <span class="hino-card-titulo">${escaparHtml(item.titulo)}</span>
    </button>
  `;
}

function montarSecao(titulo, entradas) {
  if (!entradas.length) return "";
  return `
    <h2 class="hinos-grupo-titulo">${escaparHtml(titulo)} (${entradas.length})</h2>
    <div class="hinos-grid">
      ${entradas.map(montarCartao).join("")}
    </div>
  `;
}

function renderizarResultados() {
  mostrarTela("lista");
  const termoBruto = (inputBusca ? inputBusca.value : "").trim();
  let html = "";

  if (modoBusca === "hino") {
    const encontradosHinos = filtrarPorHino(termoBruto);
    const outrosCoros = !termoBruto ? filtrarPorCoro("") : [];
    html += montarSecao("Hinos", encontradosHinos);
    html += montarSecao("Coros", outrosCoros);
  } else if (modoBusca === "coro") {
    const encontradosCoros = filtrarPorCoro(termoBruto);
    const outrosHinos = !termoBruto ? filtrarPorHino("") : [];
    html += montarSecao("Coros", encontradosCoros);
    html += montarSecao("Hinos", outrosHinos);
  } else {
    const { hinos, coros } = filtrarPorPalavra(termoBruto);
    html += montarSecao("Hinos", hinos);
    html += montarSecao("Coros", coros);
  }

  if (!html.trim()) {
    areaLista.innerHTML = `<div class="hinos-status">Nenhum resultado encontrado para "${escaparHtml(termoBruto)}".</div>`;
    return;
  }

  areaLista.innerHTML = html;
  areaLista.scrollTop = 0;

  areaLista.querySelectorAll(".hino-card-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tipo = btn.getAttribute("data-tipo");
      const idx = Number(btn.getAttribute("data-index"));
      abrirItem(tipo, idx);
    });
  });
}

export function abrirItem(tipo, index) {
  const colecao = tipo === "coro" ? listaCoros : listaHinos;
  if (index < 0 || index >= colecao.length) return;

  grupoLeituraAtual = tipo;
  indiceLeituraAtual = index;
  const item = colecao[index];
  const rotuloTipo = tipo === "coro" ? "Coro" : "Hino";
  const termoBuscaAtual = (inputBusca ? inputBusca.value : "").trim();

  mostrarTela("leitura");
  tituloTopo.textContent = `${rotuloTipo} ${item.numero} — ${item.titulo}`;
  indicadorNum.textContent = `${rotuloTipo} ${item.numero}`;
  btnAnterior.disabled = index <= 0;
  btnProximo.disabled = index >= colecao.length - 1;

  const estrofes = obterEstrofesItem(item);
  const estrofesHtml = estrofes
    .map(
      (estrofe, i) => `
      <div class="hino-estrofe">
        <span class="hino-estrofe-num">${i + 1}</span>
        <p class="hino-estrofe-texto">${destacarPalavra(estrofe, termoBuscaAtual)}</p>
      </div>
    `
    )
    .join("");

  const coroHtml = item.coro
    ? `
      <div class="hino-coro">
        <div class="hino-coro-rotulo">Coro</div>
        <p class="hino-estrofe-texto">${destacarPalavra(item.coro, termoBuscaAtual)}</p>
      </div>
    `
    : "";

  areaLeitura.innerHTML = `
    <article class="hino-leitura-card">
      <div class="hino-cabecalho-leitura">
        <span class="hino-numero-destaque">${rotuloTipo} ${escaparHtml(item.numero)}</span>
        <h2>${escaparHtml(item.titulo)}</h2>
      </div>
      <div class="hino-corpo-letra">
        ${estrofesHtml}
        ${coroHtml}
      </div>
    </article>
  `;
  areaLeitura.scrollTop = 0;
}

function irAnterior() {
  if (indiceLeituraAtual > 0) {
    abrirItem(grupoLeituraAtual, indiceLeituraAtual - 1);
  }
}

function irProximo() {
  const colecao = grupoLeituraAtual === "coro" ? listaCoros : listaHinos;
  if (indiceLeituraAtual >= 0 && indiceLeituraAtual < colecao.length - 1) {
    abrirItem(grupoLeituraAtual, indiceLeituraAtual + 1);
  }
}

function aplicarEscala() {
  escalaFonte = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, Number(escalaFonte.toFixed(2))));
  if (containerHinos) {
    containerHinos.style.setProperty("--escala-hino", String(escalaFonte));
  }
  if (badgeFonte) badgeFonte.textContent = `${Math.round(escalaFonte * 100)}%`;
  if (btnFonteMenos) btnFonteMenos.disabled = escalaFonte <= ESCALA_MIN + 0.001;
  if (btnFonteMais) btnFonteMais.disabled = escalaFonte >= ESCALA_MAX - 0.001;
  try {
    localStorage.setItem(CHAVE_ESCALA_HINOS, String(escalaFonte));
  } catch (_) {}
}

function carregarEscala() {
  try {
    const salvo = localStorage.getItem(CHAVE_ESCALA_HINOS);
    if (salvo !== null && !Number.isNaN(parseFloat(salvo))) {
      escalaFonte = parseFloat(salvo);
    }
  } catch (_) {}
  aplicarEscala();
}

botoesModo.forEach((btn) => {
  btn.addEventListener("click", () => {
    modoBusca = btn.getAttribute("data-modo") || "hino";
    botoesModo.forEach((b) => b.classList.toggle("ativo", b === btn));
    atualizarPlaceholderBusca();
    if (inputBusca) inputBusca.focus();
    renderizarResultados();
  });
});

if (inputBusca) {
  inputBusca.addEventListener("input", renderizarResultados);
}

if (btnVoltarLista) btnVoltarLista.addEventListener("click", () => mostrarTela("lista"));
if (btnAnterior) btnAnterior.addEventListener("click", irAnterior);
if (btnProximo) btnProximo.addEventListener("click", irProximo);
if (btnFonteMenos) btnFonteMenos.addEventListener("click", () => { escalaFonte -= ESCALA_PASSO; aplicarEscala(); });
if (btnFonteMais) btnFonteMais.addEventListener("click", () => { escalaFonte += ESCALA_PASSO; aplicarEscala(); });
if (btnVoltarMenu) {
  btnVoltarMenu.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("hinos:voltar-menu"));
  });
}

document.addEventListener("keydown", (e) => {
  const visivel = containerHinos && window.getComputedStyle(containerHinos).display !== "none";
  if (!visivel) return;
  if (document.activeElement === inputBusca) return;

  if (telaLeitura.classList.contains("ativa")) {
    if (e.key === "ArrowLeft") irAnterior();
    else if (e.key === "ArrowRight") irProximo();
    else if (e.key === "Escape") {
      e.preventDefault();
      mostrarTela("lista");
    }
  }
});

carregarEscala();