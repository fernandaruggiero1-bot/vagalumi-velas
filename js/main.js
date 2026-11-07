/* =====================================================================
   VAGALUMI VELAS · SCRIPT PRINCIPAL
   ===================================================================== */

/* Número do WhatsApp (só números: 55 + DDD + número). Troque aqui e vale para o site todo. */
const WHATSAPP = "5521974799589";

(function () {
  "use strict";

  /* ===== UTILIDADES ===== */
  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));

  const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ADICIONAL_PRESENTE = 5.99; // sacola pra presente + caixa com laço, por unidade

  const formatoReal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  // Troca o espaço especial do Intl por espaço comum
  const formatarPreco = (valor) => formatoReal.format(valor).replace(/\s/g, " ");

  const linkWhatsApp = (mensagem) =>
    "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(mensagem);

  // localStorage pode falhar (aba anônima, bloqueio de cookies): sempre com try/catch
  const armazenamento = {
    ler(chave, padrao) {
      try {
        const valor = localStorage.getItem(chave);
        return valor === null ? padrao : JSON.parse(valor);
      } catch (e) {
        return padrao;
      }
    },
    salvar(chave, valor) {
      try {
        localStorage.setItem(chave, JSON.stringify(valor));
      } catch (e) { /* sem armazenamento: o site segue funcionando */ }
    }
  };

  const escaparHTML = (texto) =>
    String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const catalogo = typeof PRODUTOS !== "undefined" ? PRODUTOS : [];
  const colecoes = typeof COLECOES !== "undefined" ? COLECOES : [];
  const buscarProduto = (id) => catalogo.find((p) => p.id === id);
  const temPrecoFixo = (p) => p && p.precoTipo === "fixo" && typeof p.preco === "number";

  // Formato único de preço: "R$ 89,90" · "a partir de R$ 9,90 a unidade" · "Sob consulta"
  function textoPreco(p) {
    if (p.precoTipo === "fixo") return formatarPreco(p.preco);
    if (p.precoTipo === "a_partir") return "a partir de " + formatarPreco(p.preco) + (p.unidade ? " a unidade" : "");
    return "Sob consulta";
  }

  /* ===== LINKS DE WHATSAPP =====
     Todo elemento com data-whatsapp="mensagem" recebe o link pronto. */
  const ligarWhatsApp = (raiz = document) => $$("[data-whatsapp]", raiz).forEach((el) => {
    el.href = linkWhatsApp(el.dataset.whatsapp);
  });
  ligarWhatsApp();

  /* ===== VÍDEO DA PRIMEIRA DOBRA =====
     Toca sozinho quando aparecem na tela, pausam fora dela e recomeçam ao terminar. */
  function iniciarVideo(video) {
    let naTela = false;
    video.muted = true; // alguns celulares só tocam sozinho se o vídeo estiver mudo

    const tocar = () => {
      const tentativa = video.play();
      if (tentativa) tentativa.catch(() => { /* bloqueado pelo aparelho: tenta de novo no próximo toque */ });
    };

    new IntersectionObserver((entradas) => {
      naTela = entradas[0].isIntersecting;
      if (naTela) tocar();
      else video.pause();
    }, { threshold: 0.2 }).observe(video);

    video.addEventListener("ended", () => {
      video.currentTime = 0;
      tocar();
    });

    // Plano B (ex.: iPhone em modo de pouca bateria): o primeiro toque na página libera o vídeo
    ["touchstart", "touchend", "pointerdown", "click", "keydown"].forEach((evento) => {
      document.addEventListener(evento, () => {
        if (naTela && video.paused) tocar();
      }, { passive: true });
    });
  }

  /* ===== CABEÇALHO: compacta ao rolar ===== */
  const cabecalho = $("#cabecalho");

  function atualizarAlturaCabecalho() {
    document.documentElement.style.setProperty("--altura-header", cabecalho.offsetHeight + "px");
  }

  let rolagemAgendada = false;
  function aoRolar() {
    if (rolagemAgendada) return;
    rolagemAgendada = true;
    requestAnimationFrame(() => {
      const compacto = window.scrollY > 60;
      if (cabecalho.classList.contains("is-compacto") !== compacto) {
        cabecalho.classList.toggle("is-compacto", compacto);
        // espera a transição terminar para medir a nova altura
        setTimeout(atualizarAlturaCabecalho, 320);
      }
      rolagemAgendada = false;
    });
  }

  window.addEventListener("scroll", aoRolar, { passive: true });
  window.addEventListener("resize", atualizarAlturaCabecalho);
  window.addEventListener("load", atualizarAlturaCabecalho);
  atualizarAlturaCabecalho();
  aoRolar();

  /* ===== GAVETAS (menu e sacola): abrir, fechar, Esc e foco ===== */
  const fundoEscuro = $("#fundo-escuro");
  let gavetaAberta = null;
  let focoAnterior = null;

  const SELETOR_FOCAVEL = 'a[href], button:not([disabled]), textarea, input';

  function abrirGaveta(gaveta, botaoAbrir) {
    if (gavetaAberta) fecharGaveta(false);
    gavetaAberta = { gaveta, botaoAbrir };
    focoAnterior = document.activeElement;

    gaveta.classList.add(gaveta.id === "menu-principal" ? "is-aberto" : "is-aberta");
    gaveta.setAttribute("aria-hidden", "false");
    gaveta.inert = false;
    if (botaoAbrir) botaoAbrir.setAttribute("aria-expanded", "true");
    document.body.classList.add(gaveta.id === "menu-principal" ? "menu-aberto" : "sacola-aberta");

    fundoEscuro.hidden = false;
    requestAnimationFrame(() => fundoEscuro.classList.add("is-visivel"));
    document.body.classList.add("trava-rolagem");

    const primeiro = $(SELETOR_FOCAVEL, gaveta);
    if (primeiro) setTimeout(() => primeiro.focus(), 50);
  }

  function fecharGaveta(devolverFoco = true) {
    if (!gavetaAberta) return;
    const { gaveta, botaoAbrir } = gavetaAberta;

    gaveta.classList.remove("is-aberta", "is-aberto");
    gaveta.setAttribute("aria-hidden", "true");
    if (gaveta.id !== "menu-principal" || !desktop.matches) gaveta.inert = true;
    if (botaoAbrir) botaoAbrir.setAttribute("aria-expanded", "false");
    document.body.classList.remove("sacola-aberta", "menu-aberto", "trava-rolagem");

    fundoEscuro.classList.remove("is-visivel");
    setTimeout(() => { if (!gavetaAberta) fundoEscuro.hidden = true; }, 300);

    gavetaAberta = null;
    if (devolverFoco && focoAnterior) focoAnterior.focus();
  }

  // O menu só é gaveta (modal) no celular/tablet; no desktop ele fica fixo na página
  const desktop = window.matchMedia("(min-width: 1024px)");

  fundoEscuro.addEventListener("click", () => fecharGaveta());

  document.addEventListener("keydown", (e) => {
    if (!gavetaAberta) return;
    if (e.key === "Escape") {
      fecharGaveta();
      return;
    }
    // Mantém o Tab dentro da gaveta aberta
    if (e.key === "Tab") {
      const focaveis = $$(SELETOR_FOCAVEL, gavetaAberta.gaveta).filter((el) => el.offsetParent !== null);
      if (!focaveis.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    }
  });

  /* ===== MENU MOBILE ===== */
  const menu = $("#menu-principal");
  const botaoMenu = $("#abrir-menu");

  function ajustarMenuAoTamanho() {
    if (desktop.matches) {
      if (gavetaAberta && gavetaAberta.gaveta === menu) fecharGaveta(false);
      menu.inert = false;
      menu.removeAttribute("aria-hidden");
    } else if (!(gavetaAberta && gavetaAberta.gaveta === menu)) {
      menu.inert = true;
      menu.setAttribute("aria-hidden", "true");
    }
  }
  ajustarMenuAoTamanho();
  desktop.addEventListener("change", ajustarMenuAoTamanho);

  botaoMenu.addEventListener("click", () => abrirGaveta(menu, botaoMenu));
  $("#fechar-menu").addEventListener("click", () => fecharGaveta());

  // Ao clicar num link do menu, fecha a gaveta e deixa a âncora rolar
  $$(".menu__lista a").forEach((link) => {
    link.addEventListener("click", () => {
      if (gavetaAberta && gavetaAberta.gaveta === menu) fecharGaveta(false);
    });
  });

  /* ===== CATÁLOGO: montado a partir de js/produtos.js ===== */
  function botaoDoProduto(p) {
    if (temPrecoFixo(p)) {
      return `<button class="botao" data-adicionar="${p.id}">Adicionar à sacola</button>`;
    }
    return `<a class="botao botao--contorno" target="_blank" rel="noopener" data-whatsapp="${escaparHTML("Olá, Gabi! Vim pelo site e quero um orçamento de " + p.nome + ".")}">Quero orçamento</a>`;
  }

  const fotoDoProduto = (p) => (p.imagens && p.imagens[0]) || "assets/img/placeholder.svg";
  const estiloFoco = (p) => (p.foco ? ` style="object-position: ${p.foco}"` : "");

  // No card, só o essencial: nome, palavras-chave e preço. O resto abre ao clicar no produto.
  function montarCard(p, classe = "") {
    const nome = escaparHTML(p.nome);
    return `
      <li class="card revelar ${classe}">
        <button class="card__foto" type="button" data-detalhes="${p.id}" aria-label="Ver detalhes de ${nome}">
          ${p.selo ? `<span class="selo">${escaparHTML(p.selo)}</span>` : ""}
          <img src="${fotoDoProduto(p)}" alt="${nome}" width="800" height="1000" loading="lazy"${estiloFoco(p)}>
        </button>
        <div class="card__corpo">
          <h4 class="card__nome"><button type="button" data-detalhes="${p.id}">${nome}</button></h4>
          ${p.detalhe ? `<p class="card__detalhe">${escaparHTML(p.detalhe)}</p>` : ""}
          <p class="card__preco${p.precoTipo === "consulta" ? " card__preco--consulta" : ""}">${textoPreco(p)}</p>
          <div class="card__acoes">${botaoDoProduto(p)}</div>
          <button class="card__mais" type="button" data-detalhes="${p.id}">Ver detalhes</button>
        </div>
      </li>`;
  }

  // Coleção de um produto só (Significados), com as palavras e o adicional de presente
  function montarProdutoUnico(c, p) {
    const nome = escaparHTML(p.nome);
    return `
      <article class="unico revelar">
        <button class="unico__foto" type="button" data-detalhes="${p.id}" aria-label="Ver detalhes de ${nome}">
          <img src="${fotoDoProduto(p)}" alt="Velas com os rótulos Amizade, Fé e Família" width="1200" height="800" loading="lazy">
        </button>
        <div class="unico__texto">
          <h4 class="unico__nome"><button type="button" data-detalhes="${p.id}">${nome}</button></h4>
          <p class="card__detalhe">${escaparHTML(p.detalhe)}</p>
          <p class="unico__preco">${textoPreco(p)}</p>
          <p class="unico__rotulo">Palavras que já viraram vela</p>
          <ul class="unico__palavras">${p.palavras.map((x) => `<li>${escaparHTML(x)}</li>`).join("")}</ul>
          <p class="unico__convite">Tem uma palavra que merece virar vela? Conta pra gente.</p>
          <div class="unico__botoes">
            ${botaoDoProduto(p)}
            <a class="botao botao--contorno" target="_blank" rel="noopener" data-whatsapp="${escaparHTML(c.sugestao.mensagem)}">${escaparHTML(c.sugestao.botao)}</a>
          </div>
        </div>
        <div class="adicional">
          <div>
            <p class="adicional__rotulo">Adicional de sacola pra presente + caixa com laço</p>
            <p class="adicional__preco">${formatarPreco(ADICIONAL_PRESENTE)}</p>
          </div>
          <img src="${c.imagemAdicional}" alt="Mão segurando sacola kraft com caixa de presente e laço" width="799" height="548" loading="lazy">
        </div>
      </article>`;
  }

  // Nossas Coleções
  const gruposColecoes = $("#colecoes-grupos");
  gruposColecoes.innerHTML = colecoes.map((c) => {
    const lista = catalogo.filter((p) => p.colecao === c.id);
    return `
    <section class="colecao" id="${c.id}" data-colecao="${c.id}" aria-labelledby="titulo-${c.id}">
      <header class="faixa revelar">
        <h3 class="faixa__nome" id="titulo-${c.id}">${escaparHTML(c.nome)}</h3>
        <p class="faixa__frase">${escaparHTML(c.frase)}</p>
      </header>
      ${c.produtoUnico
        ? montarProdutoUnico(c, lista[0])
        : `<ul class="vitrine vitrine--${lista.length}">${lista.map((p) => montarCard(p)).join("")}</ul>`}
    </section>`;
  }).join("");

  // Lembranças Personalizadas e Brilho da Fé
  $("#lembrancas-grade").innerHTML = catalogo.filter((p) => p.colecao === "lembrancas").map((p) => montarCard(p, "card--lado")).join("");

  $("#brilho-card").innerHTML = catalogo.filter((p) => p.colecao === "brilho-da-fe").map((p) => `
    <article class="fe__card revelar">
      <button class="fe__foto" type="button" data-detalhes="${p.id}" aria-label="Ver detalhes de ${escaparHTML(p.nome)}">
        <svg class="fe__estrela" width="20" height="20" aria-hidden="true"><use href="#i-estrela"/></svg>
        <img src="${fotoDoProduto(p)}" alt="${escaparHTML(p.nome)}" width="929" height="1200" loading="lazy">
      </button>
      <div class="fe__texto">
        <h4 class="fe__nome"><button type="button" data-detalhes="${p.id}">${escaparHTML(p.nome)}</button></h4>
        <p class="card__detalhe">${escaparHTML(p.detalhe)}</p>
        <p class="card__preco">${textoPreco(p)}</p>
        ${botaoDoProduto(p)}
        <button class="card__mais" type="button" data-detalhes="${p.id}">Ver detalhes</button>
      </div>
    </article>`).join("");

  ligarWhatsApp($("#colecoes"));
  ligarWhatsApp($("#lembrancas"));

  // Abas de filtro
  function aplicarFiltro(filtro) {
    $$(".filtro").forEach((botao) => {
      const ativo = botao.dataset.filtro === filtro;
      botao.classList.toggle("is-ativo", ativo);
      botao.setAttribute("aria-pressed", String(ativo));
    });
    $$(".colecao", gruposColecoes).forEach((grupo) => {
      grupo.hidden = filtro !== "todas" && grupo.dataset.colecao !== filtro;
    });
  }

  $$(".filtro").forEach((botao) => {
    botao.addEventListener("click", () => aplicarFiltro(botao.dataset.filtro));
  });

  // Links do menu e do rodapé: mostram tudo antes de rolar, para a coleção estar visível
  colecoes.map((c) => "#" + c.id).concat("#colecoes").forEach((ancora) => {
    $$(`a[href="${ancora}"]`).forEach((link) => link.addEventListener("click", () => aplicarFiltro("todas")));
  });

  /* ===== DETALHES DO PRODUTO ===== */
  const modalProduto = $("#produto-modal");
  const corpoModal = $("#produto-modal-corpo");
  modalProduto.inert = true;

  function abrirDetalhes(id, gatilho) {
    const p = buscarProduto(id);
    if (!p) return;
    const colecao = colecoes.find((c) => c.id === p.colecao);
    const nome = escaparHTML(p.nome);
    const fotos = p.imagens || [];

    corpoModal.innerHTML = `
      <div class="produto-modal__midia">
        <img id="produto-modal-foto" src="${fotoDoProduto(p)}" alt="${nome}"${estiloFoco(p)}>
        ${fotos.length > 1 ? `<div class="produto-modal__miniaturas">${fotos.map((f, i) => `
          <button type="button" data-foto="${f}" aria-label="Ver foto ${i + 1} de ${nome}"><img src="${f}" alt=""></button>`).join("")}</div>` : ""}
      </div>
      <div class="produto-modal__info">
        ${p.selo ? `<span class="selo selo--inline">${escaparHTML(p.selo)}</span>` : ""}
        <h2 class="produto-modal__nome" id="produto-modal-nome">${nome}</h2>
        ${p.subtitulo ? `<p class="card__subtitulo">${escaparHTML(p.subtitulo)}</p>` : ""}
        ${p.detalhe ? `<p class="card__detalhe">${escaparHTML(p.detalhe)}</p>` : ""}
        <p class="produto-modal__preco">${textoPreco(p)}</p>
        ${p.descricao ? `<p class="produto-modal__descricao">${escaparHTML(p.descricao)}</p>` : ""}
        ${colecao && colecao.nota ? `<p class="produto-modal__nota">${escaparHTML(colecao.nota)}</p>` : ""}
        ${temPrecoFixo(p) ? `<p class="produto-modal__nota">Opcional na sacola: sacola pra presente + caixa com laço (+ ${formatarPreco(ADICIONAL_PRESENTE)})</p>` : ""}
        <div class="produto-modal__acao">${botaoDoProduto(p)}</div>
      </div>`;
    ligarWhatsApp(corpoModal);
    abrirGaveta(modalProduto, null);
    if (gatilho) focoAnterior = gatilho;
  }

  $("#fechar-produto").addEventListener("click", () => fecharGaveta());

  corpoModal.addEventListener("click", (e) => {
    const miniatura = e.target.closest("[data-foto]");
    if (miniatura) $("#produto-modal-foto").src = miniatura.dataset.foto;
  });

  // Cliques nos produtos, em qualquer seção
  document.addEventListener("click", (e) => {
    const detalhes = e.target.closest("[data-detalhes]");
    if (detalhes) {
      abrirDetalhes(detalhes.dataset.detalhes, detalhes);
      return;
    }
    const botao = e.target.closest("[data-adicionar]");
    if (botao) adicionarNaSacola(botao.dataset.adicionar, botao);
  });

  /* ===== SACOLA ===== */
  const CHAVE_SACOLA = "vagalumi_sacola";
  const CHAVE_OBS = "vagalumi_observacoes";

  const sacola = $("#sacola");
  const botaoSacola = $("#abrir-sacola");
  const listaSacola = $("#sacola-lista");
  const sacolaVazia = $("#sacola-vazia");
  const subtotalEl = $("#sacola-subtotal");
  const contador = $("#contador-sacola");
  const obs = $("#sacola-obs");
  const botaoFinalizar = $("#finalizar-pedido");

  sacola.inert = true;

  // Itens salvos: [{ id, qtd, presente }]. Ignora produtos que saíram do catálogo ou deixaram de ter preço fixo.
  let itens = armazenamento.ler(CHAVE_SACOLA, []).filter((item) => item && temPrecoFixo(buscarProduto(item.id)));

  obs.value = armazenamento.ler(CHAVE_OBS, "");
  obs.addEventListener("input", () => armazenamento.salvar(CHAVE_OBS, obs.value));

  const totalItens = () => itens.reduce((soma, item) => soma + item.qtd, 0);
  const valorDoItem = (item) => (buscarProduto(item.id).preco + (item.presente ? ADICIONAL_PRESENTE : 0)) * item.qtd;
  const subtotal = () => itens.reduce((soma, item) => soma + valorDoItem(item), 0);

  function salvarSacola() {
    armazenamento.salvar(CHAVE_SACOLA, itens);
  }

  function renderizarSacola() {
    listaSacola.innerHTML = itens.map((item) => {
      const p = buscarProduto(item.id);
      const nome = escaparHTML(p.nome);
      return `
        <li class="item-sacola" data-id="${p.id}">
          <img src="${(p.imagens && p.imagens[0]) || "assets/img/placeholder.svg"}" alt="${nome}" width="72" height="72">
          <div>
            <p class="item-sacola__nome">${nome}</p>
            <p class="item-sacola__preco">${formatarPreco(p.preco)} cada</p>
            <div class="item-sacola__acoes">
              <div class="quantidade" role="group" aria-label="Quantidade de ${nome}">
                <button class="quantidade__botao" data-alterar="-1" aria-label="Diminuir quantidade de ${nome}">
                  <svg width="14" height="14" aria-hidden="true"><use href="#i-menos"/></svg>
                </button>
                <span class="quantidade__valor">${item.qtd}</span>
                <button class="quantidade__botao" data-alterar="1" aria-label="Aumentar quantidade de ${nome}">
                  <svg width="14" height="14" aria-hidden="true"><use href="#i-mais"/></svg>
                </button>
              </div>
              <button class="item-sacola__remover" data-remover aria-label="Remover ${nome} da sacola">Remover</button>
            </div>
            <label class="item-sacola__presente">
              <input type="checkbox" data-presente${item.presente ? " checked" : ""}>
              <span>Sacola pra presente + caixa com laço (+ ${formatarPreco(ADICIONAL_PRESENTE)})</span>
            </label>
            ${p.pedePalavra ? `
            <label class="item-sacola__palavra">
              <span>Qual palavra vai na sua vela?</span>
              <input type="text" data-palavra maxlength="40" placeholder="Ex.: ${escaparHTML(p.palavras.join(", "))}" value="${escaparHTML(item.palavra || "")}">
            </label>` : ""}
          </div>
        </li>`;
    }).join("");

    const vazia = itens.length === 0;
    sacolaVazia.hidden = !vazia;
    botaoFinalizar.disabled = vazia;
    subtotalEl.textContent = formatarPreco(subtotal());

    const total = totalItens();
    contador.textContent = total;
    contador.dataset.vazio = String(total === 0);
    botaoSacola.setAttribute("aria-label", `Abrir sacola, ${total} ${total === 1 ? "item" : "itens"}`);
  }

  function alterarQuantidade(id, delta) {
    const item = itens.find((i) => i.id === id);
    if (!item) return;
    item.qtd += delta;
    if (item.qtd <= 0) itens = itens.filter((i) => i.id !== id);
    salvarSacola();
    renderizarSacola();
  }

  listaSacola.addEventListener("click", (e) => {
    const linha = e.target.closest(".item-sacola");
    if (!linha) return;
    const id = linha.dataset.id;
    const alterar = e.target.closest("[data-alterar]");

    if (alterar) {
      alterarQuantidade(id, Number(alterar.dataset.alterar));
      // devolve o foco ao mesmo botão depois de redesenhar a lista
      const mesmoBotao = $(`.item-sacola[data-id="${id}"] [data-alterar="${alterar.dataset.alterar}"]`, listaSacola);
      (mesmoBotao || botaoFinalizar).focus();
    } else if (e.target.closest("[data-remover]")) {
      itens = itens.filter((i) => i.id !== id);
      salvarSacola();
      renderizarSacola();
      (listaSacola.querySelector("[data-remover]") || $("#fechar-sacola")).focus();
    }
  });

  listaSacola.addEventListener("change", (e) => {
    if (!e.target.matches("[data-presente]")) return;
    const id = e.target.closest(".item-sacola").dataset.id;
    const item = itens.find((i) => i.id === id);
    if (!item) return;
    item.presente = e.target.checked;
    salvarSacola();
    subtotalEl.textContent = formatarPreco(subtotal());
  });

  listaSacola.addEventListener("input", (e) => {
    if (!e.target.matches("[data-palavra]")) return;
    const item = itens.find((i) => i.id === e.target.closest(".item-sacola").dataset.id);
    if (!item) return;
    item.palavra = e.target.value;
    salvarSacola();
  });

  function adicionarNaSacola(id, botao) {
    if (!temPrecoFixo(buscarProduto(id))) return;

    const existente = itens.find((i) => i.id === id);
    if (existente) existente.qtd += 1;
    else itens.push({ id, qtd: 1, presente: false });

    salvarSacola();
    renderizarSacola();

    // contador "pula"
    contador.classList.add("is-pulando");
    setTimeout(() => contador.classList.remove("is-pulando"), 250);

    mostrarToast("Adicionado à sacola ✓");

    // botão mostra "Pronto!" por 2 segundos
    if (botao && !botao.classList.contains("is-pronto")) {
      const textoOriginal = botao.textContent;
      botao.classList.add("is-pronto");
      botao.textContent = "Pronto!";
      setTimeout(() => {
        botao.classList.remove("is-pronto");
        botao.textContent = textoOriginal;
      }, 2000);
    }
  }

  botaoSacola.addEventListener("click", () => abrirGaveta(sacola, botaoSacola));
  $("#fechar-sacola").addEventListener("click", () => fecharGaveta());
  $$("[data-fecha-sacola]").forEach((el) => el.addEventListener("click", () => {
    aplicarFiltro("todas");
    fecharGaveta(false);
  }));

  /* ===== FINALIZAR PEDIDO PELO WHATSAPP ===== */
  botaoFinalizar.addEventListener("click", () => {
    if (!itens.length) return;

    const linhas = itens.map((item) => {
      const p = buscarProduto(item.id);
      const palavra = item.palavra && item.palavra.trim() ? ` (palavra: ${item.palavra.trim()})` : "";
      const presente = item.presente ? " (com sacola pra presente + caixa com laço)" : "";
      return `• ${item.qtd}x ${p.nome}${palavra}${presente} – ${formatarPreco(valorDoItem(item))}`;
    });

    const observacoes = obs.value.trim();
    const mensagem = [
      "Olá, Gabi! Quero fazer este pedido pelo site:",
      ...linhas,
      `Subtotal: ${formatarPreco(subtotal())}`,
      observacoes ? `Observações: ${observacoes}` : null,
      "Pode me passar o frete e a forma de pagamento?"
    ].filter(Boolean).join("\n");

    window.open(linkWhatsApp(mensagem), "_blank", "noopener");
  });

  /* ===== NOTIFICAÇÃO (toast) ===== */
  const toast = $("#toast");
  let timerToast;
  function mostrarToast(texto) {
    toast.textContent = texto;
    toast.classList.add("is-visivel");
    clearTimeout(timerToast);
    timerToast = setTimeout(() => toast.classList.remove("is-visivel"), 2200);
  }

  /* ===== DEPOIMENTOS: rolagem infinita =====
     A lista é repetida 4 vezes e a animação anda exatamente uma lista (25%), então nunca aparece emenda. */
  const trilhoPolaroides = $("#polaroides");
  const polaroidesOriginais = Array.from(trilhoPolaroides.children);
  for (let i = 0; i < 3; i++) {
    polaroidesOriginais.forEach((item) => {
      const copia = item.cloneNode(true);
      copia.setAttribute("aria-hidden", "true");
      trilhoPolaroides.appendChild(copia);
    });
  }

  /* ===== NEWSLETTER =====
     Se o form tiver um action (Formspree), envia por fetch sem sair da página.
     Para Mailchimp, remova este bloco ou o "preventDefault" e deixe o form enviar normalmente. */
  const formNews = $("#form-newsletter");
  const avisoNews = $("#aviso-newsletter");

  formNews.addEventListener("submit", async (e) => {
    e.preventDefault();
    const endpoint = formNews.getAttribute("action");

    if (!endpoint) {
      avisoNews.textContent = "Nossa lista está quase pronta! Enquanto isso, acompanhe as novidades no Instagram @vagalumi.velas.";
      return;
    }

    const botao = $("button", formNews);
    botao.disabled = true;
    try {
      const resposta = await fetch(endpoint, {
        method: "POST",
        body: new FormData(formNews),
        headers: { Accept: "application/json" }
      });
      if (!resposta.ok) throw new Error("falha no envio");
      formNews.reset();
      avisoNews.textContent = "Que alegria ter você por aqui! Você entrou para a lista de luz ✦";
    } catch (erro) {
      avisoNews.textContent = "Não conseguimos enviar agora. Tente de novo em instantes.";
    } finally {
      botao.disabled = false;
    }
  });

  /* ===== ANIMAÇÕES DE ENTRADA ===== */
  let observador = null;
  if (!reduzMovimento && "IntersectionObserver" in window) {
    observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("is-visivel");
          observador.unobserve(entrada.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
  }

  function observarRevelar(elementos) {
    elementos.forEach((el) => {
      if (observador) observador.observe(el);
      else el.classList.add("is-visivel");
    });
  }

  /* ===== INÍCIO ===== */
  renderizarSacola();
  observarRevelar($$(".revelar"));
  $$(".hero__video").forEach(iniciarVideo);

  // Se a pessoa chegou por um link direto (ex.: #significados), rola até lá depois de montar as coleções
  if (location.hash && $(location.hash)) $(location.hash).scrollIntoView();
})();
