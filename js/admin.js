import { listaVideos } from "../data/videos.js";
import { state } from "./state.js";
import { salvarListaNoGitHub } from "./github.js";

let itemSelecionadoIndex = -1;

export function abrirGerenciadorVideos() {
  fecharModaisAdmin();
  document.getElementById("admin-form-overlay").style.display = "flex";
  renderizarListaAdmin();
  setTimeout(() => {
    document.getElementById("gh-token-videos").focus();
  }, 50);
}

export function abrirModalSenhas() {
  fecharModaisAdmin();
  document.getElementById("admin-passwords-overlay").style.display = "flex";
  document.getElementById("new-user-pass").value = "";
  document.getElementById("new-admin-pass").value = "";
  document.getElementById("pass-msg").innerText = "";
  setTimeout(() => {
    document.getElementById("gh-token-pass").focus();
  }, 50);
}

function fecharModaisAdmin() {
  document.getElementById("admin-form-overlay").style.display = "none";
  document.getElementById("admin-passwords-overlay").style.display = "none";
}

export function renderizarListaAdmin() {
  const adminList = document.getElementById("admin-video-list");
  adminList.innerHTML = "";
  itemSelecionadoIndex = -1;
  atualizarBotoesGlobais();

  if (listaVideos.length === 0) {
    adminList.innerHTML = `<li class="admin-video-item">Nenhum vídeo cadastrado</li>`;
    return;
  }

  // Ordena os vídeos de forma decrescente para exibição, mantendo o índice original correto
  const listaOrdenada = listaVideos.map((vid, origIndex) => ({ vid, origIndex }))
                                   .sort((a, b) => b.vid.title.localeCompare(a.vid.title));

  listaOrdenada.forEach(({ vid: video, origIndex: index }) => {
    const li = document.createElement("li");
    li.className = "admin-video-item";
    li.style.cursor = "pointer";
    
    const titleSpan = document.createElement("span");
    titleSpan.innerText = video.title;
    titleSpan.title = video.title;

    li.appendChild(titleSpan);

    // Seleciona o item ao clicar na lista
    li.addEventListener("click", () => {
      document.querySelectorAll(".admin-video-item").forEach(el => el.classList.remove("selected"));
      li.classList.add("selected");
      itemSelecionadoIndex = index;
      atualizarBotoesGlobais();
    });

    adminList.appendChild(li);
  });
}

function atualizarBotoesGlobais() {
  const btnEdit = document.getElementById("btn-global-edit");
  const btnDelete = document.getElementById("btn-global-delete");
  
  const ativo = itemSelecionadoIndex !== -1;
  if (btnEdit) btnEdit.disabled = !ativo;
  if (btnDelete) btnDelete.disabled = !ativo;
}

export function carregarSelecaoParaEdicao() {
  if (itemSelecionadoIndex === -1) return;
  
  const video = listaVideos[itemSelecionadoIndex];
  if (!video) return;

  const videoId = video.youtubeld || video.youtubeld;

  document.getElementById("edit-video-index").value = itemSelecionadoIndex;
  document.getElementById("new-video-title").value = video.title;
  // Preenche o campo da URL com o link completo para visualização e edição
  document.getElementById("new-video-url").value = videoId ? `https://www.youtube.com/watch?v=${videoId}` : "";
  
  document.getElementById("form-video-title-heading").innerText = "Editar Vídeo Selecionado";
  document.getElementById("btn-save-gh").innerText = "Salvar Alterações";
  document.getElementById("btn-cancel-edit").style.display = "block";
}

export function cancelarEdicao() {
  document.getElementById("edit-video-index").value = "-1";
  document.getElementById("new-video-title").value = "";
  document.getElementById("new-video-url").value = "";
  document.getElementById("form-video-title-heading").innerText = "Adicionar / Editar Vídeo";
  document.getElementById("btn-save-gh").innerText = "Salvar Vídeo";
  document.getElementById("btn-cancel-edit").style.display = "none";
  
  document.querySelectorAll(".admin-video-item").forEach(el => el.classList.remove("selected"));
  itemSelecionadoIndex = -1;
  atualizarBotoesGlobais();
}

export function extrairYoutubeld(entrada) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = entrada.match(regex);
  return match ? match[1] : entrada.trim();
}

export async function salvarOuAtualizarVideo() {
  const token = document.getElementById("gh-token-videos").value.trim();
  const title = document.getElementById("new-video-title").value.trim();
  const rawUrl = document.getElementById("new-video-url").value.trim();
  const editIndex = parseInt(document.getElementById("edit-video-index").value, 10);
  const msg = document.getElementById("admin-msg");
  const btn = document.getElementById("btn-save-gh");

  if (!token) {
    msg.style.color = "red";
    msg.innerText = "Preencha o Token do GitHub!";
    return;
  }
  if (!title || !rawUrl) {
    msg.style.color = "red";
    msg.innerText = "Preencha o título e a URL/ID do vídeo!";
    return;
  }

  const youtubeld = extrairYoutubeld(rawUrl);
  btn.disabled = true;
  msg.style.color = "#0b2545";
  msg.innerText = "Enviando alterações...";

  try {
    let novaLista = [...listaVideos];
    if (editIndex >= 0) {
      novaLista[editIndex] = { title, youtubeld };
      await salvarListaNoGitHub(token, novaLista, `Atualizado vídeo: ${title}`);
      listaVideos[editIndex] = { title, youtubeld };
      msg.innerText = "Vídeo atualizado com sucesso!";
    } else {
      novaLista.push({ title, youtubeld });
      await salvarListaNoGitHub(token, novaLista, `Adicionado vídeo: ${title}`);
      listaVideos.push({ title, youtubeld });
      msg.innerText = "Vídeo salvo com sucesso!";
    }

    renderizarListaAdmin();
    cancelarEdicao();
    msg.style.color = "green";
  } catch (err) {
    msg.style.color = "red";
    msg.innerText = "Erro: " + err.message;
  } finally {
    btn.disabled = false;
  }
}

export async function excluirVideoSelecionado() {
  if (itemSelecionadoIndex === -1) return;

  const token = document.getElementById("gh-token-videos").value.trim();
  const msg = document.getElementById("admin-msg");

  if (!token) {
    msg.style.color = "red";
    msg.innerText = "Digite o Token do GitHub antes de excluir!";
    return;
  }

  const videoRemover = listaVideos[itemSelecionadoIndex];
  if (!videoRemover) return;

  if (!confirm(`Excluir o vídeo selecionado:\n"${videoRemover.title}"?`)) {
    return;
  }

  msg.style.color = "#0b2545";
  msg.innerText = "Removendo vídeo...";

  try {
    const novaLista = listaVideos.filter((_, i) => i !== itemSelecionadoIndex);
    await salvarListaNoGitHub(token, novaLista, `Removido vídeo: ${videoRemover.title}`);
    
    listaVideos.splice(itemSelecionadoIndex, 1);
    renderizarListaAdmin();
    cancelarEdicao();
    msg.style.color = "green";
    msg.innerText = "Vídeo removido com sucesso!";
  } catch (err) {
    msg.style.color = "red";
    msg.innerText = "Erro ao excluir: " + err.message;
  }
}

export async function atualizarSenhas() {
  const token = document.getElementById("gh-token-pass").value.trim();
  const newPassUser = document.getElementById("new-user-pass").value.trim();
  const newPassAdmin = document.getElementById("new-admin-pass").value.trim();
  const msg = document.getElementById("pass-msg");
  const btn = document.getElementById("btn-save-pass");

  if (!token) {
    msg.style.color = "red";
    msg.innerText = "Informe o Token do GitHub!";
    return;
  }
  if (!newPassUser && !newPassAdmin) {
    msg.style.color = "red";
    msg.innerText = "Preencha ao menos uma das senhas!";
    return;
  }

  btn.disabled = true;
  msg.style.color = "#0b2545";
  msg.innerText = "Salvando senhas no GitHub...";

  try {
    await salvarListaNoGitHub(
      token,
      listaVideos,
      "Atualização de Senhas de Acesso",
      newPassUser || null,
      newPassAdmin || null
    );

    if (newPassUser) state.SENHA_USUARIO = newPassUser;
    if (newPassAdmin) state.SENHA_ADMIN = newPassAdmin;

    msg.style.color = "green";
    msg.innerText = "Senhas atualizadas com sucesso!";
    document.getElementById("new-user-pass").value = "";
    document.getElementById("new-admin-pass").value = "";
  } catch (err) {
    msg.style.color = "red";
    msg.innerText = "Erro ao atualizar senhas: " + err.message;
  } finally {
    btn.disabled = false;
  }
}