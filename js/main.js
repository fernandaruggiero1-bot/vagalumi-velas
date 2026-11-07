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

  const formatoReal = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  // Troca o espaço especial do Intl por espaço comum
  const formatarPreco = (valor) => formatoReal.format(valor).replace(/\s/g, " ");

  const linkWhatsApp = (mensagem) =>
    "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(mensagem);

  const escaparHTML = (texto) =>
    String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const catalogo = typeof PRODUTOS !== "undefined" ? PRODUTOS : [];
  const buscarProduto = (id) => catalogo.find((p) => p.id === id);

  /* ===== LINKS DE WHATSAPP =====
     Todo elemento com data-whatsapp="mensagem" recebe o link pronto. */
  $$("[data-whatsapp]").forEach((el) => {
    el.href = linkWhatsApp(el.dataset.whatsapp);
  });

  /* ===== VÍDEO DA PRIMEIRA DOBRA =====
     Toca sozinho quando aparece na tela, pausa fora dela e recomeça ao terminar. */
  const videoHero = $(".hero__video");
  if (videoHero) {
    let naTela = false;
    videoHero.muted = true; // alguns celulares só tocam sozinho se o vídeo estiver mudo

    const tocar = () => {
      const tentativa = videoHero.play();
      if (tentativa) tentativa.catch(() => { /* bloqueado pelo aparelho: tenta de novo no próximo toque */ });
    };

    new IntersectionObserver((entradas) => {
      naTela = entradas[0].isIntersecting;
      if (naTela) tocar();
      else videoHero.pause();
    }, { threshold: 0.2 }).observe(videoHero);

    videoHero.addEventListener("ended", () => {
      videoHero.currentTime = 0;
      tocar();
    });

    // Plano B (ex.: iPhone em modo de pouca bateria): o primeiro toque na página libera o vídeo
    ["touchstart", "touchend", "pointerdown", "click", "keydown"].forEach((evento) => {
      document.addEventListener(evento, () => {
        if (naTela && videoHero.paused) tocar();
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

  /* ===== GAVETA DO MENU: abrir, fechar, Esc e foco ===== */
  const fundoEscuro = $("#fundo-escuro");
  let gavetaAberta = null;
  let focoAnterior = null;

  const SELETOR_FOCAVEL = 'a[href], button:not([disabled])';

  function abrirGaveta(gaveta, botaoAbrir) {
    if (gavetaAberta) fecharGaveta(false);
    gavetaAberta = { gaveta, botaoAbrir };
    focoAnterior = document.activeElement;

    gaveta.classList.add("is-aberto");
    gaveta.setAttribute("aria-hidden", "false");
    gaveta.inert = false;
    if (botaoAbrir) botaoAbrir.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-aberto");

    fundoEscuro.hidden = false;
    requestAnimationFrame(() => fundoEscuro.classList.add("is-visivel"));
    document.body.classList.add("trava-rolagem");

    const primeiro = $(SELETOR_FOCAVEL, gaveta);
    if (primeiro) setTimeout(() => primeiro.focus(), 50);
  }

  function fecharGaveta(devolverFoco = true) {
    if (!gavetaAberta) return;
    const { gaveta, botaoAbrir } = gavetaAberta;

    gaveta.classList.remove("is-aberto");
    gaveta.setAttribute("aria-hidden", "true");
    if (!desktop.matches) gaveta.inert = true;
    if (botaoAbrir) botaoAbrir.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-aberto", "trava-rolagem");

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

  /* ===== CATÁLOGO: QUERIDINHAS DA VAGALUMI ===== */
  const grade = $("#grade-produtos");

  function montarCard(produto) {
    const temPreco = typeof produto.preco === "number";
    const imagens = produto.imagens || [];
    const fotoPrincipal = imagens[0] || "assets/img/placeholder.svg";
    const fotoDois = imagens[1];
    const nome = escaparHTML(produto.nome);

    // Com preço: encomenda direta. Sem preço: consulta. Os dois abrem o WhatsApp com o nome do produto.
    const acao = temPreco
      ? `<a class="botao" target="_blank" rel="noopener"
            href="${linkWhatsApp("Olá! Vim pelo site e quero encomendar: " + produto.nome + ".")}">Encomendar pelo WhatsApp</a>`
      : `<a class="botao botao--contorno" target="_blank" rel="noopener"
            href="${linkWhatsApp("Olá! Vim pelo site e quero saber mais sobre: " + produto.nome + ".")}">Consultar pelo WhatsApp</a>`;

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

  /* ===== PRODUTO EM DESTAQUE ===== */
  const blocoDestaque = $(".destaque__info");
  const produtoDestaque = buscarProduto(blocoDestaque.dataset.produto);

  if (produtoDestaque && typeof produtoDestaque.preco === "number") {
    $("[data-preco]", blocoDestaque).textContent = formatarPreco(produtoDestaque.preco);
  }

  // "Ver mais detalhes" expande o texto
  const verMais = $("#ver-mais");
  const maisDetalhes = $("#mais-detalhes");
  verMais.addEventListener("click", () => {
    const abrir = maisDetalhes.hidden;
    maisDetalhes.hidden = !abrir;
    verMais.setAttribute("aria-expanded", String(abrir));
    verMais.textContent = abrir ? "Ver menos" : "Ver mais detalhes";
  });

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
  aplicarFiltro("todas");
  observarRevelar($$(".revelar:not(.card)"));
})();
