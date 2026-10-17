import { autenticar, verificarSenhaAdmin } from "./auth.js";
import { navegarPara, voltarParaMenu, voltarParaAdminMenu } from "./menu.js";
import { abrirGerenciadorVideos, abrirModalSenhas, adicionarVideoNoGitHub, atualizarSenhas } from "./admin.js";
import { filtrarVideos, initPlayer, iniciarVideosAleatoriosContinuos } from "./player.js";
import { inicializarTeclado, focarMenuPrincipal } from "./keyboard.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      autenticar(e);
    });
  }

  const btnPalavras = document.getElementById("btn-menu-palavras");
  if (btnPalavras) btnPalavras.addEventListener("click", () => navegarPara("palavras"));

  const btnBiblia = document.getElementById("btn-menu-biblia");
  if (btnBiblia) btnBiblia.addEventListener("click", () => navegarPara("biblia"));

  const btnHinos = document.getElementById("btn-menu-hinos");
  if (btnHinos) btnHinos.addEventListener("click", () => navegarPara("hinos"));

  const btnConfig = document.getElementById("btn-menu-configuracao");
  if (btnConfig) btnConfig.addEventListener("click", () => navegarPara("configuracao"));

  const adminAuthForm = document.getElementById("admin-auth-form");
  if (adminAuthForm) {
    adminAuthForm.addEventListener("submit", (e) => {
      e.preventDefault();
      verificarSenhaAdmin(e);
    });
  }

  const btnCloseAdminAuth = document.getElementById("btn-close-admin-auth");
  if (btnCloseAdminAuth) btnCloseAdminAuth.addEventListener("click", voltarParaMenu);

  const btnGerenciarVideos = document.getElementById("btn-gerenciar-videos");
  if (btnGerenciarVideos) btnGerenciarVideos.addEventListener("click", abrirGerenciadorVideos);

  const btnAlterarSenhas = document.getElementById("btn-alterar-senhas");
  if (btnAlterarSenhas) btnAlterarSenhas.addEventListener("click", abrirModalSenhas);

  const btnAdminVoltar = document.getElementById("btn-admin-voltar");
  if (btnAdminVoltar) btnAdminVoltar.addEventListener("click", voltarParaMenu);

  const btnCloseAdminMenu = document.getElementById("btn-close-admin-menu");
  if (btnCloseAdminMenu) btnCloseAdminMenu.addEventListener("click", voltarParaMenu);

  const btnSaveGh = document.getElementById("btn-save-gh");
  if (btnSaveGh) btnSaveGh.addEventListener("click", adicionarVideoNoGitHub);

  const btnVideoManagerBack = document.getElementById("btn-video-manager-back");
  if (btnVideoManagerBack) btnVideoManagerBack.addEventListener("click", voltarParaAdminMenu);

  const btnCloseVideoManager = document.getElementById("btn-close-video-manager");
  if (btnCloseVideoManager) btnCloseVideoManager.addEventListener("click", voltarParaAdminMenu);

  const btnSavePass = document.getElementById("btn-save-pass");
  if (btnSavePass) btnSavePass.addEventListener("click", atualizarSenhas);

  const btnPasswordBack = document.getElementById("btn-password-back");
  if (btnPasswordBack) btnPasswordBack.addEventListener("click", voltarParaAdminMenu);

  const btnClosePasswords = document.getElementById("btn-close-passwords");
  if (btnClosePasswords) btnClosePasswords.addEventListener("click", voltarParaAdminMenu);

  const btnPlaceholderBack = document.getElementById("btn-placeholder-back");
  if (btnPlaceholderBack) btnPlaceholderBack.addEventListener("click", voltarParaMenu);

  const btnClosePlaceholder = document.getElementById("btn-close-placeholder");
  if (btnClosePlaceholder) btnClosePlaceholder.addEventListener("click", voltarParaMenu);

  const btnAppBack = document.getElementById("btn-app-back");
  if (btnAppBack) btnAppBack.addEventListener("click", voltarParaMenu);

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", filtrarVideos);
  }

  initPlayer();

  const btnRandomVideos = document.getElementById("btn-random-videos");
  if (btnRandomVideos) {
    btnRandomVideos.addEventListener("click", iniciarVideosAleatoriosContinuos);
  }

  /* ==========================================
     AÇÃO DO BOTÃO SAIR (MODAL PERSONALIZADO)
     ========================================== */
  document.addEventListener("click", (e) => {
    const btnSairTarget = e.target.closest("#btn-sair-app");
    if (btnSairTarget) {
      e.preventDefault();
      const sairModal = document.getElementById("sair-modal");
      const btnSairNao = document.getElementById("btn-sair-nao");
      
      if (sairModal) {
        sairModal.style.setProperty("display", "flex", "important");
        if (btnSairNao) btnSairNao.focus();
      }
    }
  });

  const btnSairSim = document.getElementById("btn-sair-sim");
  const btnSairNao = document.getElementById("btn-sair-nao");
  const sairModal = document.getElementById("sair-modal");

  if (btnSairNao && sairModal) {
    btnSairNao.addEventListener("click", () => {
      sairModal.style.setProperty("display", "none", "important");
      const btnSair = document.getElementById("btn-sair-app");
      if (btnSair) btnSair.focus();
    });
  }

  if (btnSairSim) {
    btnSairSim.addEventListener("click", () => {
      window.close();
      setTimeout(() => {
        // Exibe o ecrã de encerramento com botão de reabertura para telemóveis
        document.body.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0b2545; color: white; font-family: sans-serif; text-align: center; padding: 20px; box-sizing: border-box;">
            <h2 style="margin-bottom: 10px; font-size: 1.5rem;">Aplicativo Encerrado</h2>
            <p style="color: #cbd5e1; font-size: 1rem; margin-bottom: 2rem;">Pode fechar esta aba ou reabrir o aplicativo quando desejar.</p>
            <button onclick="window.location.reload()" style="background: #ffffff; color: #0b2545; border: none; padding: 12px 24px; font-size: 1rem; font-weight: bold; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.2);">
              Voltar / Reabrir Aplicativo
            </button>
          </div>
        `;
      }, 50);
    });
  }

  inicializarTeclado();
  focarMenuPrincipal();

  /* ==========================================
     CONTROLE DO BOTÃO VOLTAR DO TELEMÓVEL
     ========================================== */
  window.history.pushState({ page: "main" }, "", "");

  window.addEventListener("popstate", (event) => {
    const appContainer = document.getElementById("app-container");
    const currentSairModal = document.getElementById("sair-modal");
    const btnSairNao = document.getElementById("btn-sair-nao");

    // Se o modal de saída estiver aberto, apenas fecha o modal ao apertar voltar
    if (currentSairModal && window.getComputedStyle(currentSairModal).display !== "none") {
      currentSairModal.style.setProperty("display", "none", "important");
      window.history.pushState({ page: "main" }, "", "");
      return;
    }

    // Se estiver na tela de vídeos aberta, volta para o menu principal em vez de sair
    if (appContainer && window.getComputedStyle(appContainer).display !== "none") {
      voltarParaMenu();
      window.history.pushState({ page: "main" }, "", "");
    } else {
      // Se já estiver no menu principal, abre o modal personalizado de saída
      if (currentSairModal) {
        currentSairModal.style.setProperty("display", "flex", "important");
        if (btnSairNao) btnSairNao.focus();
      }
    }
  });

  window.history.pushState({ page: "main" }, "", "");
});