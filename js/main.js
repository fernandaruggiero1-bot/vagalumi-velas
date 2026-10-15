/* =====================================================================
   VAGALUMI VELAS · SCRIPT PRINCIPAL
   ===================================================================== */

/* Número do WhatsApp (só números: 55 + DDD + número). Troque aqui e vale para o site todo. */
const WHATSAPP = "5521993681791";

(function () {
  "use strict";

  /* ===== UTILIDADES ===== */
  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
  const $$ = (seletor, raiz = document) => Array.from(raiz.querySelectorAll(seletor));

  const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const formatoReal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  // Troca o espaço especial do Intl por espaço comum (fica melhor no WhatsApp)
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
  const buscarProduto = (id) => catalogo.find((p) => p.id === id);

  /* ===== LINKS DE WHATSAPP =====
     Todo elemento com data-whatsapp="mensagem" recebe o link pronto. */
  $$("[data-whatsapp]").forEach((el) => {
    el.href = linkWhatsApp(el.dataset.whatsapp);
  });

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

  const SELETOR_FOCAVEL = 'a[href], button:not([disabled]), textarea, input, [tabindex]:not([tabindex="-1"])';

  function abrirGaveta(gaveta, botaoAbrir) {
    if (gavetaAberta) fecharGaveta(false);
    gavetaAberta = { gaveta, botaoAbrir };
    focoAnterior = document.activeElement;

    gaveta.classList.add(gaveta.id === "sacola" ? "is-aberta" : "is-aberto");
    gaveta.setAttribute("aria-hidden", "false");
    gaveta.inert = false;
    if (botaoAbrir) botaoAbrir.setAttribute("aria-expanded", "true");
    if (gaveta.id === "sacola") document.body.classList.add("sacola-aberta");

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
    if (gavetaEhModal(gaveta)) gaveta.inert = true;
    if (botaoAbrir) botaoAbrir.setAttribute("aria-expanded", "false");
    document.body.classList.remove("sacola-aberta", "trava-rolagem");

    fundoEscuro.classList.remove("is-visivel");
    setTimeout(() => { if (!gavetaAberta) fundoEscuro.hidden = true; }, 300);

    gavetaAberta = null;
    if (devolverFoco && focoAnterior) focoAnterior.focus();
  }

  // O menu só é gaveta (modal) no celular/tablet; no desktop ele fica fixo na página
  const desktop = window.matchMedia("(min-width: 1024px)");
  const gavetaEhModal = (gaveta) => gaveta.id === "sacola" || !desktop.matches;

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

  /* ===== CATÁLOGO: QUERIDINHAS DA VAGALUMI ===== */
  const grade = $("#grade-produtos");

  function montarCard(produto) {
    const temPreco = typeof produto.preco === "number";
    const imagens = produto.imagens || [];
    const fotoPrincipal = imagens[0] || "assets/img/placeholder.svg";
    const fotoDois = imagens[1];
    const nome = escaparHTML(produto.nome);

    const acao = temPreco
      ? `<button class="botao" data-adicionar="${produto.id}">Adicionar à sacola</button>`
      : `<a class="botao botao--contorno" target="_blank" rel="noopener"
            href="${linkWhatsApp("Olá! Vim pelo site e quero saber mais sobre a " + produto.nome + ".")}">Consultar pelo WhatsApp</a>`;

    return `
      <li class="card revelar" data-categoria="${produto.categoria}">
        <div class="card__foto${fotoDois ? " card__foto--dupla" : ""}">
          ${produto.selo ? `<span class="selo">${escaparHTML(produto.selo)}</span>` : ""}
          <img src="${fotoPrincipal}" alt="${nome}" width="800" height="800" loading="lazy">
          ${fotoDois ? `<img class="card__foto-2" src="${fotoDois}" alt="" width="800" height="800" loading="lazy">` : ""}
        </div>
        <h3 class="card__nome">${nome}</h3>
        ${produto.notas ? `<p class="card__notas" title="${escaparHTML(produto.notas)}">${escaparHTML(produto.notas)}</p>` : ""}
        <p class="card__preco${temPreco ? "" : " card__preco--consulta"}">${temPreco ? formatarPreco(produto.preco) : "Sob consulta"}</p>
        <div class="card__acoes">${acao}</div>
      </li>`;
  }

  function mostrarProdutos(filtro) {
    const lista = filtro === "todas" ? catalogo : catalogo.filter((p) => p.categoria === filtro);
    grade.innerHTML = lista.length
      ? lista.map(montarCard).join("")
      : '<li class="grade-produtos__vazia">Em breve, novidades por aqui ✦</li>';
    observarRevelar($$(".revelar", grade));
  }

  function aplicarFiltro(filtro) {
    $$(".filtro").forEach((botao) => {
      const ativo = botao.dataset.filtro === filtro;
      botao.classList.toggle("is-ativo", ativo);
      botao.setAttribute("aria-pressed", String(ativo));
    });
    mostrarProdutos(filtro);
  }

  $$(".filtro").forEach((botao) => {
    botao.addEventListener("click", () => aplicarFiltro(botao.dataset.filtro));
  });

  // Links "Kits" e "Velas" do menu já chegam com o filtro certo
  $$('a[href="#kits"]').forEach((link) => link.addEventListener("click", () => aplicarFiltro("kits")));
  $$('a[href="#velas"]').forEach((link) => link.addEventListener("click", () => aplicarFiltro("todas")));

  grade.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-adicionar]");
    if (botao) adicionarNaSacola(botao.dataset.adicionar, 1, botao);
  });

  /* ===== PRODUTO EM DESTAQUE ===== */
  const blocoDestaque = $(".destaque__info");
  const produtoDestaque = buscarProduto(blocoDestaque.dataset.produto);
  const qtdDestaque = $("#qtd-destaque");
  let quantidadeDestaque = 1;

  if (produtoDestaque && typeof produtoDestaque.preco === "number") {
    $("[data-preco]", blocoDestaque).textContent = formatarPreco(produtoDestaque.preco);
  }

  $$(".quantidade__botao", blocoDestaque).forEach((botao) => {
    botao.addEventListener("click", () => {
      quantidadeDestaque = Math.min(99, Math.max(1, quantidadeDestaque + Number(botao.dataset.qtd)));
      qtdDestaque.textContent = quantidadeDestaque;
    });
  });

  $("#adicionar-destaque").addEventListener("click", (e) => {
    adicionarNaSacola(blocoDestaque.dataset.produto, quantidadeDestaque, e.currentTarget);
    quantidadeDestaque = 1;
    qtdDestaque.textContent = 1;
  });

  // "Ver mais detalhes" expande o texto
  const verMais = $("#ver-mais");
  const maisDetalhes = $("#mais-detalhes");
  verMais.addEventListener("click", () => {
    const abrir = maisDetalhes.hidden;
    maisDetalhes.hidden = !abrir;
    verMais.setAttribute("aria-expanded", String(abrir));
    verMais.textContent = abrir ? "Ver menos" : "Ver mais detalhes";
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

  // Itens salvos: [{ id, qtd }]. Ignora produtos que saíram do catálogo ou ficaram sem preço.
  let itens = armazenamento.ler(CHAVE_SACOLA, [])
    .filter((item) => item && buscarProduto(item.id) && typeof buscarProduto(item.id).preco === "number");

  obs.value = armazenamento.ler(CHAVE_OBS, "");
  obs.addEventListener("input", () => armazenamento.salvar(CHAVE_OBS, obs.value));

  const totalItens = () => itens.reduce((soma, item) => soma + item.qtd, 0);
  const subtotal = () => itens.reduce((soma, item) => soma + buscarProduto(item.id).preco * item.qtd, 0);

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

  function adicionarNaSacola(id, qtd, botao) {
    const produto = buscarProduto(id);
    if (!produto || typeof produto.preco !== "number") return;

    const existente = itens.find((i) => i.id === id);
    if (existente) existente.qtd += qtd;
    else itens.push({ id, qtd });

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
  $$("[data-fecha-sacola]").forEach((el) => el.addEventListener("click", () => fecharGaveta(false)));

  /* ===== FINALIZAR PEDIDO PELO WHATSAPP ===== */
  botaoFinalizar.addEventListener("click", () => {
    if (!itens.length) return;

    const linhas = itens.map((item) => {
      const p = buscarProduto(item.id);
      return `• ${item.qtd}x ${p.nome} – ${formatarPreco(p.preco * item.qtd)}`;
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

  /* ===== CARROSSEL DE DEPOIMENTOS ===== */
  const trilho = $("#carrossel");
  $$("[data-carrossel]").forEach((seta) => {
    seta.addEventListener("click", () => {
      const card = $(".depoimento", trilho);
      const passo = card ? card.offsetWidth + 12 : trilho.clientWidth;
      trilho.scrollBy({ left: passo * Number(seta.dataset.carrossel), behavior: reduzMovimento ? "auto" : "smooth" });
    });
  });

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

  /* ===== AVISO DE COOKIES ===== */
  const CHAVE_COOKIES = "vagalumi_cookies_ok";
  const avisoCookies = $("#cookies");

  function atualizarAlturaCookies() {
    const altura = avisoCookies.hidden ? 0 : avisoCookies.offsetHeight;
    document.documentElement.style.setProperty("--altura-cookies", altura + "px");
  }

  if (!armazenamento.ler(CHAVE_COOKIES, false)) {
    avisoCookies.hidden = false;
    atualizarAlturaCookies();
    window.addEventListener("resize", atualizarAlturaCookies);
  }

  $("#aceitar-cookies").addEventListener("click", () => {
    armazenamento.salvar(CHAVE_COOKIES, true);
    avisoCookies.hidden = true;
    atualizarAlturaCookies();
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
  aplicarFiltro("todas");
  renderizarSacola();
  observarRevelar($$(".revelar:not(.card)"));
})();
