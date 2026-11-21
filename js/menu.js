import { state } from "./state.js";
import { abrirAuthAdmin } from "./auth.js";
import { carregarPlaylist } from "./player.js";
import { iniciarBiblia, fecharBiblia } from "./biblia.js";

export function navegarPara(opcao) {
  document.getElementById("menu-overlay").style.display = "none";

  const appEl = document.getElementById("app-container");
  const bibliaEl = document.getElementById("biblia-container");
  if (appEl) appEl.style.display = "none";
  if (bibliaEl) bibliaEl.style.display = "none";

  if (opcao === "palavras") {
    if (appEl) appEl.style.display = "block";
    carregarPlaylist();
    const playlistEl = document.getElementById("playlist");
    if (playlistEl) playlistEl.focus();
  } else if (opcao === "biblia") {
    if (bibliaEl) bibliaEl.style.display = "flex";
    iniciarBiblia();
  } else if (opcao === "configuracao") {
    abrirAuthAdmin();
  } else if (opcao === "hinos") {
    abrirPlaceholder(
      "Hinos",
      "O hinário com as letras dos hinos estará disponível em breve."
    );
  }
}

export function abrirPlaceholder(titulo, descricao) {
  document.getElementById("placeholder-title").innerText = titulo;
  document.getElementById("placeholder-desc").innerText = descricao;
  document.getElementById("placeholder-overlay").style.display = "flex";
  document.getElementById("btn-placeholder-back").focus();
}

export function voltarParaMenu() {
  fecharModais();
  fecharBiblia();

  const appEl = document.getElementById("app-container");
  const bibliaEl = document.getElementById("biblia-container");
  const menuEl = document.getElementById("menu-overlay");

  if (appEl) appEl.style.display = "none";
  if (bibliaEl) bibliaEl.style.display = "none";
  if (menuEl) menuEl.style.display = "flex";
}

export function voltarParaAdminMenu() {
  fecharModais();
  document.getElementById("admin-menu-overlay").style.display = "flex";
}

export function fecharModais() {
  document.getElementById("admin-auth-overlay").style.display = "none";
  document.getElementById("admin-menu-overlay").style.display = "none";
  document.getElementById("admin-form-overlay").style.display = "none";
  document.getElementById("admin-passwords-overlay").style.display = "none";
  document.getElementById("placeholder-overlay").style.display = "none";
}