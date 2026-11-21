// Caminhos relativos à pasta onde o index.html está sendo servido
const CAMINHO_INDICE = "./data/livros.json";
const PASTA_LIVROS = "./data/livros";

// Ordem canônica tradicional da Bíblia (Antigo e Novo Testamento)
const ORDEM_LIVROS_CCB = [
  // Antigo Testamento (39)
  "genesis",
  "exodo",
  "levitico",
  "numeros",
  "deuteronomio",
  "josue",
  "juizes",
  "rute",
  "1-samuel",
  "2-samuel",
  "1-reis",
  "2-reis",
  "1-cronicas",
  "2-cronicas",
  "esdras",
  "neemias",
  "ester",
  "jo",
  "salmos",
  "proverbios",
  "eclesiastes",
  "cantares",
  "isaias",
  "jeremias",
  "lamentacoes",
  "ezequiel",
  "daniel",
  "oseias",
  "joel",
  "amos",
  "obadias",
  "jonas",
  "miqueias",
  "naum",
  "habacuque",
  "sofonias",
  "ageu",
  "zacarias",
  "malaquias",
  // Novo Testamento (27)
  "mateus",
  "marcos",
  "lucas",
  "joao",
  "atos",
  "romanos",
  "1-corintios",
  "2-corintios",
  "galatas",
  "efesios",
  "filipenses",
  "colossenses",
  "1-tessalonicenses",
  "2-tessalonicenses",
  "1-timoteo",
  "2-timoteo",
  "tito",
  "filemom",
  "hebreus",
  "tiago",
  "1-pedro",
  "2-pedro",
  "1-joao",
  "2-joao",
  "3-joao",
  "judas",
  "apocalipse"
];

let indiceLivros = [];
let livroAtualDados = null;
let capituloAtualNumero = 1;
let telaAtual = "livros"; // "livros" | "capitulos" | "leitura" | "busca"
let todosLivrosCarregados = false;
const cacheLivros = new Map();

const telaLivros = document.getElementById("tela-livros");
const telaCapitulos = document.getElementById("tela-capitulos");
const telaLeitura = document.getElementById("tela-leitura");
const telaResultadosBusca = document.getElementById("tela-resultados-busca");

const areaLivros = document.getElementById("area-livros");
const areaCapitulos = document.getElementById("area-capitulos");
const areaLeitura = document.getElementById("biblia-leitura");
const areaResultadosBusca = document.getElementById("area-resultados-busca");

const formBuscaPalavra = document.getElementById("form-busca-palavra");
const buscaPalavraInput = document.getElementById("busca-palavra-input");

const formBuscaPalavraTopo = document.getElementById("form-busca-palavra-topo");
const buscaPalavraResultadosInput = document.getElementById("busca-palavra-resultados-input");
const tituloResultadosBusca = document.getElementById("titulo-resultados-busca");

const inputBuscaCapitulo = document.getElementById("biblia-busca-input");

const tituloLivroCapitulos = document.getElementById("titulo-livro-capitulos");
const subtituloTestamentoCap = document.getElementById("subtitulo-testamento-cap");
const tituloLeituraTopo = document.getElementById("titulo-leitura-topo");
const indicadorCapAtual = document.getElementById("indicador-cap-atual");

const btnVoltarMenu = document.getElementById("btn-biblia-back");
const btnVoltarLivros = document.getElementById("btn-voltar-livros");
const btnVoltarCapitulos = document.getElementById("btn-voltar-capitulos");
const btnIrLivrosLeitura = document.getElementById("btn-ir-livros-leitura");
const btnVoltarBuscaLivros = document.getElementById("btn-voltar-busca-livros");
const btnCapAnterior = document.getElementById("btn-cap-anterior");
const btnCapProximo = document.getElementById("btn-cap-proximo");

function normalizarSemAcento(txt) {
  return (txt || "")
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

function chaveOrdemLivro(item) {
  const slugNorm = normalizarSemAcento(item.livro || "").replace(/\s+/g, "-");
  const nomeNorm = normalizarSemAcento(item.nome || "")
    .replace(/^i\s+/, "1-")
    .replace(/^ii\s+/, "2-")
    .replace(/^iii\s+/, "3-")
    .replace(/\s+/g, "-");

  const idxSlug = ORDEM_LIVROS_CCB.indexOf(slugNorm);
  if (idxSlug !== -1) return idxSlug;

  const idxNome = ORDEM_LIVROS_CCB.indexOf(nomeNorm);
  if (idxNome !== -1) return idxNome;

  return Number.MAX_SAFE_INTEGER;
}

function ordenarLivrosCCB(lista) {
  return [...lista].sort((a, b) => {
    const posA = chaveOrdemLivro(a);
    const posB = chaveOrdemLivro(b);
    if (posA !== posB) return posA - posB;
    return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
  });
}

function construirMapaNormalizado(textoOriginal) {
  const charsNorm = [];
  const indicesOriginais = [];

  for (let i = 0; i < textoOriginal.length; i++) {
    const ch = textoOriginal[i];
    const semAcento = ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    for (let j = 0; j < semAcento.length; j++) {
      charsNorm.push(semAcento[j]);
      indicesOriginais.push(i);
    }
  }

  return {
    textoNorm: charsNorm.join(""),
    indicesOriginais
  };
}

function destacarTermoNoTexto(textoOriginal, termoBruto) {
  const termoNorm = normalizarSemAcento(termoBruto.trim());
  if (!termoNorm) return escaparHtml(textoOriginal);

  const { textoNorm, indicesOriginais } = construirMapaNormalizado(textoOriginal);
  if (!textoNorm || indicesOriginais.length === 0) return escaparHtml(textoOriginal);

  const intervalos = [];
  let pos = 0;

  while (pos <= textoNorm.length - termoNorm.length) {
    const achou = textoNorm.indexOf(termoNorm, pos);
    if (achou === -1) break;

    const idxInicioOrig = indicesOriginais[achou];
    const idxUltimoCharNorm = achou + termoNorm.length - 1;
    const idxUltimoOrig = indicesOriginais[idxUltimoCharNorm];

    let fimOrig = idxUltimoOrig + 1;
    while (
      fimOrig < textoOriginal.length &&
      /[\u0300-\u036f]/.test(textoOriginal[fimOrig].normalize("NFD"))
    ) {
      fimOrig++;
    }

    intervalos.push([idxInicioOrig, fimOrig]);
    pos = achou + termoNorm.length;
  }

  if (intervalos.length === 0) return escaparHtml(textoOriginal);

  let resultado = "";
  let cursor = 0;

  for (const [ini, fim] of intervalos) {
    if (ini < cursor) continue;
    resultado += escaparHtml(textoOriginal.slice(cursor, ini));
    resultado += `<mark class="palavra-destaque">${escaparHtml(textoOriginal.slice(ini, fim))}</mark>`;
    cursor = fim;
  }

  resultado += escaparHtml(textoOriginal.slice(cursor));
  return resultado;
}

function mostrarTela(nomeTela) {
  telaAtual = nomeTela;
  telaLivros.classList.toggle("ativa", nomeTela === "livros");
  telaCapitulos.classList.toggle("ativa", nomeTela === "capitulos");
  telaLeitura.classList.toggle("ativa", nomeTela === "leitura");
  telaResultadosBusca.classList.toggle("ativa", nomeTela === "busca");
}

export function fecharBiblia() {
  mostrarTela("livros");
}

export async function iniciarBiblia() {
  mostrarTela("livros");
  try {
    const resp = await fetch(CAMINHO_INDICE);
    if (!resp.ok) {
      throw new Error(`Não foi possível carregar ${CAMINHO_INDICE} (HTTP ${resp.status})`);
    }
    const dadosIndice = await resp.json();

    if (!Array.isArray(dadosIndice) || dadosIndice.length === 0) {
      areaLivros.innerHTML = `<div class="biblia-status">Nenhum livro encontrado em ${CAMINHO_INDICE}.</div>`;
      return;
    }

    indiceLivros = ordenarLivrosCCB(dadosIndice);
    renderizarTelaLivros();
  } catch (erro) {
    console.error(erro);
    areaLivros.innerHTML = `
      <div class="biblia-status">
        <strong>Erro ao carregar os dados da Bíblia.</strong><br><br>
        Verifique se a pasta <code>data/</code> (com <code>livros.json</code> e a subpasta <code>livros/</code>)
        está dentro desta mesma pasta e se você abriu o projeto pelo Live Server.
      </div>
    `;
  }
}

function renderizarTelaLivros() {
  mostrarTela("livros");

  const livrosAT = indiceLivros.filter((l) => l.testamento === "AT");
  const livrosNT = indiceLivros.filter((l) => l.testamento !== "AT");

  let html = "";

  if (livrosAT.length > 0) {
    html += `<h2 class="biblia-grupo-titulo">Antigo Testamento</h2><div class="biblia-grid-livros">`;
    livrosAT.forEach((livro) => {
      html += `
        <button type="button" class="btn-livro-compacto" data-slug="${escaparHtml(livro.livro)}" title="${escaparHtml(livro.nome)}">
          ${escaparHtml(livro.nome)}
        </button>
      `;
    });
    html += `</div>`;
  }

  if (livrosNT.length > 0) {
    html += `<h2 class="biblia-grupo-titulo">Novo Testamento</h2><div class="biblia-grid-livros">`;
    livrosNT.forEach((livro) => {
      html += `
        <button type="button" class="btn-livro-compacto" data-slug="${escaparHtml(livro.livro)}" title="${escaparHtml(livro.nome)}">
          ${escaparHtml(livro.nome)}
        </button>
      `;
    });
    html += `</div>`;
  }

  areaLivros.innerHTML = html;
  areaLivros.scrollTop = 0;

  areaLivros.querySelectorAll(".btn-livro-compacto").forEach((btn) => {
    btn.addEventListener("click", () => {
      abrirTelaCapitulos(btn.getAttribute("data-slug"));
    });
  });
}

async function obterDadosLivro(slugLivro) {
  if (cacheLivros.has(slugLivro)) {
    return cacheLivros.get(slugLivro);
  }
  const resp = await fetch(`${PASTA_LIVROS}/${slugLivro}.json`);
  if (!resp.ok) {
    throw new Error(`Erro ao carregar ${slugLivro}.json (HTTP ${resp.status})`);
  }
  const dados = await resp.json();
  cacheLivros.set(slugLivro, dados);
  return dados;
}

async function garantirTodosLivrosCarregados() {
  if (todosLivrosCarregados) return;

  const pendentes = indiceLivros.filter((item) => !cacheLivros.has(item.livro));
  await Promise.all(
    pendentes.map(async (item) => {
      try {
        await obterDadosLivro(item.livro);
      } catch (err) {
        console.warn(`Falha ao carregar ${item.livro}:`, err);
      }
    })
  );
  todosLivrosCarregados = true;
}

async function abrirTelaCapitulos(slugLivro) {
  mostrarTela("capitulos");
  const metaLivro = indiceLivros.find((l) => l.livro === slugLivro);
  tituloLivroCapitulos.textContent = metaLivro ? metaLivro.nome : slugLivro;
  subtituloTestamentoCap.textContent =
    metaLivro && metaLivro.testamento === "AT" ? "Antigo Testamento" : "Novo Testamento";

  areaCapitulos.innerHTML = `<div class="biblia-status">Carregando capítulos...</div>`;

  try {
    const dados = await obterDadosLivro(slugLivro);
    livroAtualDados = dados;
    tituloLivroCapitulos.textContent = dados.nome;
    subtituloTestamentoCap.textContent =
      dados.testamento === "AT" ? "Antigo Testamento" : "Novo Testamento";

    if (!dados.capitulos || dados.capitulos.length === 0) {
      areaCapitulos.innerHTML = `<div class="biblia-status">Este livro não possui capítulos cadastrados.</div>`;
      return;
    }

    let html = `<div class="biblia-grid-capitulos">`;
    dados.capitulos.forEach((cap) => {
      html += `
        <button type="button" class="btn-capitulo-card" data-cap="${cap.capitulo}">
          ${cap.capitulo}
        </button>
      `;
    });
    html += `</div>`;

    areaCapitulos.innerHTML = html;
    areaCapitulos.scrollTop = 0;

    areaCapitulos.querySelectorAll(".btn-capitulo-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        abrirTelaLeitura(Number(btn.getAttribute("data-cap")));
      });
    });
  } catch (erro) {
    console.error(erro);
    areaCapitulos.innerHTML = `<div class="biblia-status">Não foi possível carregar os capítulos deste livro.</div>`;
  }
}

function abrirTelaLeitura(numCapitulo) {
  inputBuscaCapitulo.value = "";
  mostrarTela("leitura");
  renderizarCapitulo(numCapitulo);
}

function renderizarCapitulo(numCapitulo) {
  if (!livroAtualDados || !livroAtualDados.capitulos.length) {
    areaLeitura.innerHTML = `<div class="biblia-status">Este livro não possui capítulos cadastrados.</div>`;
    return;
  }

  const capObj =
    livroAtualDados.capitulos.find((c) => c.capitulo === Number(numCapitulo)) ||
    livroAtualDados.capitulos[0];

  capituloAtualNumero = capObj.capitulo;
  tituloLeituraTopo.textContent = `${livroAtualDados.nome} ${capObj.capitulo}`;
  indicadorCapAtual.textContent = `Cap. ${capObj.capitulo}`;

  const idxAtual = livroAtualDados.capitulos.findIndex((c) => c.capitulo === capituloAtualNumero);
  const temAnterior = idxAtual > 0;
  const temProximo = idxAtual < livroAtualDados.capitulos.length - 1;

  btnCapAnterior.disabled = !temAnterior;
  btnCapProximo.disabled = !temProximo;

  const termoBusca = normalizarSemAcento(inputBuscaCapitulo.value.trim());
  const rotuloTestamento =
    livroAtualDados.testamento === "AT" ? "Antigo Testamento" : "Novo Testamento";

  let html = `
    <div class="biblia-capitulo-header">
      <h2>${escaparHtml(livroAtualDados.nome)} ${capObj.capitulo}</h2>
      <span class="biblia-testamento-tag">${rotuloTestamento}</span>
    </div>
  `;

  let versiculosExibidos = 0;

  capObj.secoes.forEach((secao) => {
    const versiculosFiltrados = secao.versiculos.filter((v) => {
      if (!termoBusca) return true;
      return (
        normalizarSemAcento(v.texto).includes(termoBusca) ||
        String(v.numero) === termoBusca
      );
    });

    if (versiculosFiltrados.length === 0) return;

    html += `<section class="biblia-secao">`;
    if (secao.titulo) {
      html += `<h3 class="biblia-secao-titulo">${escaparHtml(secao.titulo)}</h3>`;
    }
    versiculosFiltrados.forEach((v) => {
      versiculosExibidos++;
      const textoRender = termoBusca
        ? destacarTermoNoTexto(v.texto, inputBuscaCapitulo.value.trim())
        : escaparHtml(v.texto);
      html += `
        <p class="biblia-versiculo">
          <span class="biblia-versiculo-num">${v.numero}</span>${textoRender}
        </p>
      `;
    });
    html += `</section>`;
  });

  if (versiculosExibidos === 0) {
    html += `<div class="biblia-status">Nenhum versículo encontrado para o filtro informado.</div>`;
  }

  html += `
    <div class="biblia-rodape-nav">
      <button type="button" class="btn-rodape-cap" id="btn-rodape-ant" ${temAnterior ? "" : "disabled"}>
        &larr; Capítulo Anterior
      </button>
      <button type="button" class="btn-rodape-cap" id="btn-rodape-prox" ${temProximo ? "" : "disabled"}>
        Próximo Capítulo &rarr;
      </button>
    </div>
  `;

  areaLeitura.innerHTML = html;
  areaLeitura.scrollTop = 0;

  const btnRodapeAnt = document.getElementById("btn-rodape-ant");
  const btnRodapeProx = document.getElementById("btn-rodape-prox");
  if (btnRodapeAnt) btnRodapeAnt.addEventListener("click", irCapituloAnterior);
  if (btnRodapeProx) btnRodapeProx.addEventListener("click", irProximoCapitulo);
}

async function executarBuscaPalavra(palavraBruta) {
  const palavra = (palavraBruta || "").trim();
  buscaPalavraInput.value = palavra;
  buscaPalavraResultadosInput.value = palavra;

  mostrarTela("busca");
  tituloResultadosBusca.textContent = palavra ? `"${palavra}"` : "Resultados";

  if (!palavra) {
    areaResultadosBusca.innerHTML = `<div class="biblia-status">Digite uma palavra na barra de pesquisa e clique na lupa.</div>`;
    return;
  }

  areaResultadosBusca.innerHTML = `<div class="biblia-status">Pesquisando...</div>`;

  try {
    await garantirTodosLivrosCarregados();

    const termoNorm = normalizarSemAcento(palavra);
    const gruposPorLivro = [];
    let totalOcorrencias = 0;

    for (const meta of indiceLivros) {
      const dados = cacheLivros.get(meta.livro);
      if (!dados || !Array.isArray(dados.capitulos)) continue;

      const encontradosNoLivro = [];

      for (const cap of dados.capitulos) {
        if (!Array.isArray(cap.secoes)) continue;
        for (const secao of cap.secoes) {
          if (!Array.isArray(secao.versiculos)) continue;
          for (const v of secao.versiculos) {
            if (normalizarSemAcento(v.texto).includes(termoNorm)) {
              encontradosNoLivro.push({
                capitulo: cap.capitulo,
                versiculo: v.numero,
                texto: v.texto
              });
            }
          }
        }
      }

      if (encontradosNoLivro.length > 0) {
        totalOcorrencias += encontradosNoLivro.length;
        gruposPorLivro.push({
          slug: dados.livro || meta.livro,
          nome: dados.nome || meta.nome,
          ocorrencias: encontradosNoLivro
        });
      }
    }

    if (totalOcorrencias === 0) {
      areaResultadosBusca.innerHTML = `
        <div class="biblia-status">
          Nenhum resultado para <strong>"${escaparHtml(palavra)}"</strong>.
        </div>
      `;
      return;
    }

    let html = `
      <div class="busca-resumo-topo">
        <strong>${totalOcorrencias}</strong> versículo(s) em <strong>${gruposPorLivro.length}</strong> livro(s) — <strong>"${escaparHtml(palavra)}"</strong>
      </div>
    `;

    gruposPorLivro.forEach((grupo) => {
      const qtdLabel =
        grupo.ocorrencias.length === 1
          ? "1 versículo"
          : `${grupo.ocorrencias.length} versículos`;

      html += `
        <section class="busca-bloco-livro">
          <h2 class="busca-livro-titulo">
            <span>${escaparHtml(grupo.nome)}</span>
            <span class="busca-livro-qtd">${qtdLabel}</span>
          </h2>
      `;

      grupo.ocorrencias.forEach((item) => {
        const textoDestacado = destacarTermoNoTexto(item.texto, palavra);
        html += `
          <div class="busca-item-versiculo">
            <button
              type="button"
              class="busca-ref-link"
              data-slug="${escaparHtml(grupo.slug)}"
              data-cap="${item.capitulo}"
              title="Abrir ${escaparHtml(grupo.nome)} ${item.capitulo}:${item.versiculo}"
            >
              ${item.capitulo}:${item.versiculo}
            </button>
            <span>${textoDestacado}</span>
          </div>
        `;
      });

      html += `</section>`;
    });

    areaResultadosBusca.innerHTML = html;
    areaResultadosBusca.scrollTop = 0;

    areaResultadosBusca.querySelectorAll(".busca-ref-link").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const slug = btn.getAttribute("data-slug");
        const cap = Number(btn.getAttribute("data-cap"));
        const dados = await obterDadosLivro(slug);
        livroAtualDados = dados;
        abrirTelaLeitura(cap);
      });
    });
  } catch (erro) {
    console.error(erro);
    areaResultadosBusca.innerHTML = `<div class="biblia-status">Erro ao realizar a busca por palavra.</div>`;
  }
}

function irCapituloAnterior() {
  if (!livroAtualDados) return;
  const idx = livroAtualDados.capitulos.findIndex((c) => c.capitulo === capituloAtualNumero);
  if (idx > 0) {
    renderizarCapitulo(livroAtualDados.capitulos[idx - 1].capitulo);
  }
}

function irProximoCapitulo() {
  if (!livroAtualDados) return;
  const idx = livroAtualDados.capitulos.findIndex((c) => c.capitulo === capituloAtualNumero);
  if (idx >= 0 && idx < livroAtualDados.capitulos.length - 1) {
    renderizarCapitulo(livroAtualDados.capitulos[idx + 1].capitulo);
  }
}

// Eventos
formBuscaPalavra.addEventListener("submit", (e) => {
  e.preventDefault();
  executarBuscaPalavra(buscaPalavraInput.value);
});

formBuscaPalavraTopo.addEventListener("submit", (e) => {
  e.preventDefault();
  executarBuscaPalavra(buscaPalavraResultadosInput.value);
});

btnVoltarLivros.addEventListener("click", () => {
  renderizarTelaLivros();
});

btnVoltarCapitulos.addEventListener("click", () => {
  if (livroAtualDados) {
    abrirTelaCapitulos(livroAtualDados.livro);
  } else {
    renderizarTelaLivros();
  }
});

btnIrLivrosLeitura.addEventListener("click", () => {
  renderizarTelaLivros();
});

btnVoltarBuscaLivros.addEventListener("click", () => {
  renderizarTelaLivros();
});

btnCapAnterior.addEventListener("click", irCapituloAnterior);
btnCapProximo.addEventListener("click", irProximoCapitulo);

inputBuscaCapitulo.addEventListener("input", () => {
  renderizarCapitulo(capituloAtualNumero);
});

if (btnVoltarMenu) {
  btnVoltarMenu.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("biblia:voltar-menu"));
  });
}

document.addEventListener("keydown", (e) => {
  const containerBiblia = document.getElementById("biblia-container");
  const bibliaVisivel = containerBiblia && window.getComputedStyle(containerBiblia).display !== "none";
  if (!bibliaVisivel) return;
  if (
    document.activeElement === buscaPalavraInput ||
    document.activeElement === buscaPalavraResultadosInput ||
    document.activeElement === inputBuscaCapitulo
  ) {
    return;
  }

  if (telaAtual === "leitura") {
    if (e.key === "ArrowLeft") irCapituloAnterior();
    if (e.key === "ArrowRight") irProximoCapitulo();
  } else if (telaAtual === "capitulos" || telaAtual === "busca") {
    if (e.key === "Escape" || e.key === "Backspace") {
      e.preventDefault();
      renderizarTelaLivros();
    }
  }
});


// ===== CONTROLE DE TAMANHO DE LETRA (PERSISTENTE EM LOCALSTORAGE) =====
const CHAVE_ESCALA_FONTE = "biblia_ccb_escala_fonte_v1";
const ESCALA_MIN = 0.75;
const ESCALA_MAX = 1.75;
const ESCALA_PASSO = 0.1;

let escalaFonteAtual = 1.0;

function carregarEscalaFonte() {
  try {
    const salvo = localStorage.getItem(CHAVE_ESCALA_FONTE);
    if (salvo !== null) {
      const num = parseFloat(salvo);
      if (!Number.isNaN(num)) {
        escalaFonteAtual = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, Number(num.toFixed(2))));
      }
    }
  } catch (e) {
    // Ignora caso localStorage esteja bloqueado
  }
  aplicarEscalaFonte();
}

function aplicarEscalaFonte() {
  const arredondada = Number(escalaFonteAtual.toFixed(2));
  escalaFonteAtual = arredondada;
  const containerBiblia = document.getElementById("biblia-container");
  if (containerBiblia) {
    containerBiblia.style.setProperty("--escala-fonte", String(arredondada));
  } else {
    document.documentElement.style.setProperty("--escala-fonte", String(arredondada));
  }

  const pct = `${Math.round(arredondada * 100)}%`;
  document.querySelectorAll(".biblia-fonte-badge").forEach((el) => {
    el.textContent = pct;
  });

  document.querySelectorAll('[id^="btn-fonte-diminuir"]').forEach((btn) => {
    btn.disabled = arredondada <= ESCALA_MIN + 0.001;
  });

  document.querySelectorAll('[id^="btn-fonte-aumentar"]').forEach((btn) => {
    btn.disabled = arredondada >= ESCALA_MAX - 0.001;
  });

  try {
    localStorage.setItem(CHAVE_ESCALA_FONTE, String(arredondada));
  } catch (e) {
    // Ignora caso localStorage esteja bloqueado
  }
}

function alterarEscalaFonte(delta) {
  escalaFonteAtual = Math.min(
    ESCALA_MAX,
    Math.max(ESCALA_MIN, Number((escalaFonteAtual + delta).toFixed(2)))
  );
  aplicarEscalaFonte();
}

document.querySelectorAll('[id^="btn-fonte-diminuir"]').forEach((btn) => {
  btn.addEventListener("click", () => alterarEscalaFonte(-ESCALA_PASSO));
});

document.querySelectorAll('[id^="btn-fonte-aumentar"]').forEach((btn) => {
  btn.addEventListener("click", () => alterarEscalaFonte(ESCALA_PASSO));
});

carregarEscalaFonte();

// Quando usado dentro do AppCCB, chame iniciarBiblia() ao abrir a seção/modal da Bíblia.
// Se abrir este arquivo diretamente em modo standalone, inicia automaticamente se não houver um host externo.
if (!window.__APPCCB_HOST__) {
  iniciarBiblia();
}
