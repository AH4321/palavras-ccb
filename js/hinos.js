const CAMINHO_HINOS = "./data/hinos.json";
const CHAVE_ESCALA_HINOS = "hinos_ccb_escala_fonte_v1";
const ESCALA_MIN = 0.75;
const ESCALA_MAX = 1.8;
const ESCALA_PASSO = 0.1;

let listaHinos = [];
let indiceHinoAtual = -1;
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

function mostrarTela(tela) {
  telaLista.classList.toggle("ativa", tela === "lista");
  telaLeitura.classList.toggle("ativa", tela === "leitura");
}

export function fecharHinos() {
  mostrarTela("lista");
}

export async function iniciarHinos() {
  mostrarTela("lista");
  if (listaHinos.length > 0) {
    renderizarGrade(filtrarHinosLista());
    return;
  }

  areaLista.innerHTML = `<div class="hinos-status">Carregando hinos...</div>`;
  try {
    const resp = await fetch(CAMINHO_HINOS);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const dados = await resp.json();
    listaHinos = Array.isArray(dados)
      ? [...dados].sort((a, b) => Number(a.numero) - Number(b.numero))
      : [];
    renderizarGrade(listaHinos);
  } catch (err) {
    console.error("Erro ao carregar hinos:", err);
    areaLista.innerHTML = `
      <div class="hinos-status">
        <strong>Não foi possível carregar o hinário.</strong><br><br>
        Verifique se o arquivo <code>data/hinos.json</code> existe e se o projeto está rodando via servidor local ou GitHub Pages.
      </div>
    `;
  }
}

function filtrarHinosLista() {
  const termoBruto = (inputBusca ? inputBusca.value : "").trim();
  if (!termoBruto) return listaHinos;

  const termoNorm = normalizar(termoBruto);
  const ehNumero = /^\d+$/.test(termoBruto);

  return listaHinos.filter((hino) => {
    const numStr = String(hino.numero || "");
    if (ehNumero && (numStr === termoBruto || numStr.startsWith(termoBruto))) {
      return true;
    }
    const corpoTexto = [
      numStr,
      hino.titulo || "",
      hino.categoria || "",
      hino.coro || "",
      ...(Array.isArray(hino.estrofes) ? hino.estrofes : []),
      hino.letra || ""
    ].join(" ");
    return normalizar(corpoTexto).includes(termoNorm);
  });
}

function renderizarGrade(hinos) {
  mostrarTela("lista");
  if (!hinos.length) {
    areaLista.innerHTML = `<div class="hinos-status">Nenhum hino encontrado para a busca.</div>`;
    return;
  }

  let html = `<div class="hinos-grid">`;
  hinos.forEach((hino) => {
    const idxOriginal = listaHinos.findIndex((item) => Number(item.numero) === Number(hino.numero));
    html += `
      <button type="button" class="hino-card-btn" data-index="${idxOriginal}">
        <span class="hino-card-num">${escaparHtml(hino.numero)}</span>
        <span class="hino-card-titulo">${escaparHtml(hino.titulo)}</span>
      </button>
    `;
  });
  html += `</div>`;
  areaLista.innerHTML = html;
  areaLista.scrollTop = 0;

  areaLista.querySelectorAll(".hino-card-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-index"));
      if (idx >= 0) abrirHino(idx);
    });
  });
}

export function abrirHino(index) {
  if (index < 0 || index >= listaHinos.length) return;
  indiceHinoAtual = index;
  const hino = listaHinos[index];

  mostrarTela("leitura");
  tituloTopo.textContent = `${hino.numero} - ${hino.titulo}`;
  indicadorNum.textContent = `Nº ${hino.numero}`;
  btnAnterior.disabled = index <= 0;
  btnProximo.disabled = index >= listaHinos.length - 1;

  let estrofesHtml = "";
  const estrofes = Array.isArray(hino.estrofes)
    ? hino.estrofes
    : String(hino.letra || "")
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean);

  estrofes.forEach((estrofe, i) => {
    estrofesHtml += `
      <div class="hino-estrofe">
        <span class="hino-estrofe-num">${i + 1}</span>
        <p class="hino-estrofe-texto">${escaparHtml(estrofe).replace(/\n/g, "<br>")}</p>
      </div>
    `;
  });

  const coroHtml = hino.coro
    ? `
      <div class="hino-coro">
        <div class="hino-coro-rotulo">Coro</div>
        <p class="hino-estrofe-texto">${escaparHtml(hino.coro).replace(/\n/g, "<br>")}</p>
      </div>
    `
    : "";

  areaLeitura.innerHTML = `
    <article class="hino-leitura-card">
      <div class="hino-cabecalho-leitura">
        <span class="hino-numero-destaque">Hino ${escaparHtml(hino.numero)}</span>
        <h2>${escaparHtml(hino.titulo)}</h2>
        ${hino.categoria ? `<span class="hino-categoria-tag">${escaparHtml(hino.categoria)}</span>` : ""}
      </div>
      <div class="hino-corpo-letra">
        ${estrofesHtml}
        ${coroHtml}
      </div>
    </article>
  `;
  areaLeitura.scrollTop = 0;
}

function irHinoAnterior() {
  if (indiceHinoAtual > 0) abrirHino(indiceHinoAtual - 1);
}

function irProximoHino() {
  if (indiceHinoAtual >= 0 && indiceHinoAtual < listaHinos.length - 1) {
    abrirHino(indiceHinoAtual + 1);
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

if (inputBusca) {
  inputBusca.addEventListener("input", () => renderizarGrade(filtrarHinosLista()));
}
if (btnVoltarLista) btnVoltarLista.addEventListener("click", () => mostrarTela("lista"));
if (btnAnterior) btnAnterior.addEventListener("click", irHinoAnterior);
if (btnProximo) btnProximo.addEventListener("click", irProximoHino);
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
    if (e.key === "ArrowLeft") irHinoAnterior();
    else if (e.key === "ArrowRight") irProximoHino();
    else if (e.key === "Escape") {
      e.preventDefault();
      mostrarTela("lista");
    }
  }
});

carregarEscala();