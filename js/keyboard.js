/* ==========================================
GESTOR DE NAVEGAÇÃO POR TECLADO
========================================== */
import { state } from './state.js';
import { listaVideos } from '../data/videos.js';
import { tocarVideo, focarCartaoVideo } from './player.js';

// Função auxiliar para focar o primeiro cartão visível com base na lista filtrada e ordenada descendentemente
function focarPrimeiroCartaoVisivel(listaExibida) {
    if (!listaExibida || listaExibida.length === 0) return;
    const cards = document.querySelectorAll('.video-card-item');
    const videoAlvo = listaExibida[0];
    
    for (let i = 0; i < listaVideos.length; i++) {
        if ((listaVideos[i].youtubeld || listaVideos[i].youtubeId) === (videoAlvo.youtubeld || videoAlvo.youtubeId)) {
            state.kbPlaylistIndex = i;
            focarCartaoVideo(i);
            if (cards[i]) cards[i].focus();
            break;
        }
    }
}

export function inicializarTeclado() {
    document.addEventListener("keydown", (e) => {
        const sairModal = document.getElementById("sair-modal");
        const sairVisivel = sairModal && window.getComputedStyle(sairModal).display !== "none";
        
        if (sairVisivel) {
            const btnSim = document.getElementById("btn-sair-sim");
            const btnNao = document.getElementById("btn-sair-nao");
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                if (document.activeElement === btnSim) {
                    if (btnNao) btnNao.focus();
                } else {
                    if (btnSim) btnSim.focus();
                }
                return;
            }
            if (e.key === "Enter") {
                e.preventDefault();
                const elementoFocado = document.activeElement;
                if (elementoFocado) elementoFocado.click();
                return;
            }
            return;
        }

        const loginOverlay = document.getElementById("login-overlay");
        const menuOverlay = document.getElementById("menu-overlay");
        const adminModal = document.getElementById("admin-form-overlay") || document.getElementById("admin-modal");
        const appContainer = document.getElementById("app-container");

        const loginVisivel = loginOverlay && window.getComputedStyle(loginOverlay).display !== "none";
        const menuVisivel = menuOverlay && window.getComputedStyle(menuOverlay).display !== "none";
        const adminVisivel = adminModal && window.getComputedStyle(adminModal).display !== "none";
        const appVisivel = appContainer && window.getComputedStyle(appContainer).display !== "none";

        if (loginVisivel) return;

        // 2. TELA "PALAVRAS" (YOUTUBE TV) - GRELHA DE VÍDEOS
        if (appVisivel) {
            const searchBox = document.getElementById("search-input");
            const termoBruto = searchBox ? searchBox.value : "";
            const termos = termoBruto ? termoBruto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/\s+/) : [];
            
            // Mantém a lista ordenada de forma decrescente para coincidir com a exibição visual
            const listaOrdenada = [...listaVideos].sort((a, b) => b.title.localeCompare(a.title));
            const listaExibida = termos.length > 0
                ? listaOrdenada.filter(video => {
                    const tit = video.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    return termos.every(t => tit.includes(t));
                  })
                : listaOrdenada;

            const gridContainer = document.getElementById("playlist");
            let colunas = 4;
            if (gridContainer) {
                const computedStyle = window.getComputedStyle(gridContainer);
                const colTemplate = computedStyle.getPropertyValue("grid-template-columns");
                colunas = colTemplate ? colTemplate.split(" ").length : 4;
            }

            if (document.activeElement === searchBox) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    focarPrimeiroCartaoVisivel(listaExibida);
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    const btnMenu = document.getElementById("btn-app-back") || document.getElementById("btn-back") || document.querySelector("header button");
                    if (btnMenu) btnMenu.focus();
                } else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    const btnRandom = document.getElementById("btn-random-videos");
                    if (btnRandom) btnRandom.focus();
                } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    const btnMenu = document.getElementById("btn-app-back");
                    if (btnMenu) btnMenu.focus();
                }
                return;
            }

            const btnRandom = document.getElementById("btn-random-videos");
            if (document.activeElement === btnRandom) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    focarPrimeiroCartaoVisivel(listaExibida);
                } else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "ArrowRight") {
                    e.preventDefault();
                    if (searchBox) searchBox.focus();
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    btnRandom.click();
                }
                return;
            }

            const btnMenu = document.getElementById("btn-app-back") || document.getElementById("btn-back") || document.getElementById("btn-voltar");
            if (document.activeElement === btnMenu) {
                if (e.key === "ArrowRight") {
                    e.preventDefault();
                    if (searchBox) searchBox.focus();
                } else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    if (btnRandom) {
                        btnRandom.focus();
                    } else {
                        focarPrimeiroCartaoVisivel(listaExibida);
                    }
                } else if (e.key === "Enter") {
                    e.preventDefault();
                    btnMenu.click();
                }
                return;
            }

            if (e.key === "ArrowRight") {
                e.preventDefault();
                if (listaExibida.length > 0) {
                    state.kbPlaylistIndex = (state.kbPlaylistIndex + 1) % listaExibida.length;
                    focarCartaoVideo(state.kbPlaylistIndex);
                }
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                if (listaExibida.length > 0) {
                    state.kbPlaylistIndex = (state.kbPlaylistIndex - 1 + listaExibida.length) % listaExibida.length;
                    focarCartaoVideo(state.kbPlaylistIndex);
                }
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                if (listaExibida.length > 0) {
                    let novoIndex = state.kbPlaylistIndex + colunas;
                    if (novoIndex >= listaExibida.length) novoIndex = listaExibida.length - 1;
                    state.kbPlaylistIndex = novoIndex;
                    focarCartaoVideo(state.kbPlaylistIndex);
                }
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                let novoIndex = state.kbPlaylistIndex - colunas;
                if (novoIndex < 0) {
                    if (btnRandom) {
                        btnRandom.focus();
                    } else if (searchBox) {
                        searchBox.focus();
                    }
                } else {
                    state.kbPlaylistIndex = novoIndex;
                    focarCartaoVideo(state.kbPlaylistIndex);
                }
            } else if (e.key === "Enter") {
                e.preventDefault();
                const elementoFocado = document.activeElement;
                if (elementoFocado === btnMenu && btnMenu) {
                    btnMenu.click();
                    return;
                }
                if (elementoFocado === btnRandom && btnRandom) {
                    btnRandom.click();
                    return;
                }
                if (listaExibida[state.kbPlaylistIndex]) {
                    const videoAlvo = listaExibida[state.kbPlaylistIndex];
                    const indexOriginal = listaVideos.findIndex(v => (v.youtubeld || v.youtubeId) === (videoAlvo.youtubeld || videoAlvo.youtubeId));
                    if (indexOriginal !== -1) {
                        tocarVideo(indexOriginal);
                    }
                }
            }
            return;
        }

        // 3. MENU PRINCIPAL OU MODAIS
        const botoesAtivos = Array.from(document.querySelectorAll('#menu-overlay button:not([style*="display: none"]), .btn-menu:not([style*="display: none"]), .btn-config-flutuante, .btn-sair-flutuante'))
            .filter(btn => {
                const rect = btn.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            });

        if (botoesAtivos.length > 0) {
            let currentIndex = botoesAtivos.indexOf(document.activeElement);
            if (currentIndex === -1) currentIndex = 0;
            const btnConfig = document.getElementById("btn-menu-configuracao");
            const btnSair = document.getElementById("btn-sair-app");

            if (document.activeElement === btnConfig && e.key === "ArrowLeft") {
                e.preventDefault();
                if (btnSair) btnSair.focus();
                return;
            } else if (document.activeElement === btnSair && e.key === "ArrowRight") {
                e.preventDefault();
                if (btnConfig) btnConfig.focus();
                return;
            }

            if ((document.activeElement === btnConfig || document.activeElement === btnSair) && e.key === "ArrowUp") {
                e.preventDefault();
                const botoesCentrais = document.querySelectorAll('#menu-overlay .menu-grid button:not([style*="display: none"])');
                if (botoesCentrais.length > 0) {
                    botoesCentrais[botoesCentrais.length - 1].focus();
                }
                return;
            }

            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                e.preventDefault();
                currentIndex = (currentIndex + 1) % botoesAtivos.length;
                botoesAtivos[currentIndex].focus();
            } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                e.preventDefault();
                currentIndex = (currentIndex - 1 + botoesAtivos.length) % botoesAtivos.length;
                botoesAtivos[currentIndex].focus();
            } else if (e.key === "Enter") {
                e.preventDefault();
                const elementoFocado = document.activeElement;
                if (elementoFocado) elementoFocado.click();
                return;
            }
        }
    });
}

export const initKeyboard = inicializarTeclado;

export function focarMenuPrincipal() {
    const menuOverlay = document.getElementById("menu-overlay");
    if (menuOverlay) {
        const primeiroBotao = menuOverlay.querySelector("button");
        if (primeiroBotao) primeiroBotao.focus();
    }
}

export function focarAdminMenu() {
    const adminMenuOverlay = document.getElementById("admin-menu-overlay");
    if (adminMenuOverlay) {
        const primeiroBotao = adminMenuOverlay.querySelector("button");
        if (primeiroBotao) primeiroBotao.focus();
    }
}