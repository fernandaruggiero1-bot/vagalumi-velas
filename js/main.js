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

  /* ===== VÍDEOS =====
     Tocam sozinhos quando aparecem na tela, pausam fora dela e recomeçam ao terminar. */
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

    gaveta.classList.add(gaveta.id === "sacola" ? "is-aberta" : "is-aberto");
    gaveta.setAttribute("aria-hidden", "false");
    gaveta.inert = false;
    if (botaoAbrir) botaoAbrir.setAttribute("aria-expanded", "true");
    document.body.classList.add(gaveta.id === "sacola" ? "sacola-aberta" : "menu-aberto");

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
    if (gaveta.id === "sacola" || !desktop.matches) gaveta.inert = true;
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
    if (p.emBreve) {
      return `<a class="botao botao--contorno" target="_blank" rel="noopener" data-whatsapp="${escaparHTML(p.mensagem || "Olá, Gabi! Quero ser avisada quando " + p.nome + " chegar ✨")}">Quero ser avisada</a>`;
    }
    if (temPrecoFixo(p)) {
      return `<button class="botao" data-adicionar="${p.id}">Adicionar à sacola</button>`;
    }
    return `<a class="botao botao--contorno" target="_blank" rel="noopener" data-whatsapp="${escaparHTML("Olá, Gabi! Vim pelo site e quero um orçamento de " + p.nome + ".")}">Quero orçamento</a>`;
  }

  function montarMidia(p) {
    const nome = escaparHTML(p.nome);
    const foto = (p.imagens && p.imagens[0]) || "assets/img/placeholder.svg";
    const foco = p.foco ? ` style="object-position: ${p.foco}"` : "";
    if (p.video) {
      return `<video data-auto autoplay muted loop playsinline webkit-playsinline preload="metadata" poster="${foto}" aria-label="${nome}"${foco}><source src="${p.video}" type="video/mp4"></video>`;
    }
    return `<img src="${foto}" alt="${nome}" width="800" height="1000" loading="lazy"${foco}>`;
  }

  function montarCard(p, classe = "") {
    return `
      <li class="card revelar ${classe}">
        <div class="card__foto">
          ${p.selo ? `<span class="selo">${escaparHTML(p.selo)}</span>` : ""}
          ${montarMidia(p)}
        </div>
        <div class="card__corpo">
          <h4 class="card__nome">${escaparHTML(p.nome)}</h4>
          ${p.subtitulo ? `<p class="card__subtitulo">${escaparHTML(p.subtitulo)}</p>` : ""}
          ${p.descricao ? `<p class="card__descricao">${escaparHTML(p.descricao)}</p>` : ""}
          ${p.detalhe ? `<p class="card__detalhe">${escaparHTML(p.detalhe)}</p>` : ""}
          ${p.emBreve ? "" : `<p class="card__preco${p.precoTipo === "consulta" ? " card__preco--consulta" : ""}">${textoPreco(p)}</p>`}
          <div class="card__acoes">${botaoDoProduto(p)}</div>
        </div>
      </li>`;
  }

  const montarVideoFaixa = (v, i) => `
    <video class="faixa__video${i === 0 ? "" : " faixa__video--estreito"}" data-auto autoplay muted loop playsinline webkit-playsinline preload="metadata"
           poster="${v.poster}" width="${v.largura}" height="${v.altura}" aria-label="${escaparHTML(v.rotulo)}">
      <source src="${v.src}" type="video/mp4">
    </video>`;

  // Nossas Coleções: cada coleção com a faixa de título, os cards e os blocos extras
  const gruposColecoes = $("#colecoes-grupos");
  gruposColecoes.innerHTML = colecoes.map((c) => `
    <section class="colecao" id="${c.id}" data-colecao="${c.id}" aria-labelledby="titulo-${c.id}">
      <header class="faixa revelar${c.videos ? " faixa--midia" : ""}">
        <div class="faixa__textos">
          <h3 class="faixa__nome" id="titulo-${c.id}">${escaparHTML(c.nome)}</h3>
          <p class="faixa__frase">${escaparHTML(c.frase)}</p>
        </div>
        ${c.videos ? `<div class="faixa__videos">${c.videos.map(montarVideoFaixa).join("")}</div>` : ""}
      </header>
      <ul class="grade-colecao">
        ${catalogo.filter((p) => p.colecao === c.id).map((p) => montarCard(p)).join("")}
      </ul>
      ${c.nota ? `<p class="nota-centro revelar">${escaparHTML(c.nota)}</p>` : ""}
      ${c.chamada ? `
        <div class="chamada revelar">
          <p class="chamada__texto">${escaparHTML(c.chamada.texto)}</p>
          <a class="botao botao--contorno" target="_blank" rel="noopener" data-whatsapp="${escaparHTML(c.chamada.mensagem)}">${escaparHTML(c.chamada.botao)}</a>
        </div>` : ""}
    </section>`).join("");

  // Lembranças Personalizadas e Brilho da Fé
  $("#lembrancas-grade").innerHTML = catalogo.filter((p) => p.colecao === "lembrancas").map((p) => montarCard(p, "card--lado")).join("");

  $("#brilho-card").innerHTML = catalogo.filter((p) => p.colecao === "brilho-da-fe").map((p) => `
    <article class="fe__card revelar">
      <div class="fe__foto">
        <img src="${p.imagens[0]}" alt="${escaparHTML(p.nome)}" width="929" height="1200" loading="lazy">
        <svg class="fe__contorno" viewBox="0 0 400 533" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <path transform="translate(200 270) scale(1.03) translate(-200 -270)" vector-effect="non-scaling-stroke" d="M200 14C204 30 236 38 290 46C352 56 388 92 388 140V505C388 521 376 533 360 533H40C24 533 12 521 12 505V140C12 92 48 56 110 46C164 38 196 30 200 14Z"/>
        </svg>
      </div>
      <div class="fe__texto">
        <h4 class="fe__nome">${escaparHTML(p.nome)}</h4>
        <p class="card__detalhe">${escaparHTML(p.detalhe)}</p>
        <p class="card__descricao">${escaparHTML(p.descricao)}</p>
        <p class="card__preco">${textoPreco(p)}</p>
        ${botaoDoProduto(p)}
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

  $("#colecoes").addEventListener("click", (e) => {
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
      const presente = item.presente ? " (com sacola pra presente + caixa com laço)" : "";
      return `• ${item.qtd}x ${p.nome}${presente} – ${formatarPreco(valorDoItem(item))}`;
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
  $$(".hero__video, video[data-auto]").forEach(iniciarVideo);

  // Se a pessoa chegou por um link direto (ex.: #significados), rola até lá depois de montar as coleções
  if (location.hash && $(location.hash)) $(location.hash).scrollIntoView();
})();
