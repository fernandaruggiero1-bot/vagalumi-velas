/* =====================================================================
   CATÁLOGO DA VAGALUMI VELAS
   ---------------------------------------------------------------------
   Este é o único arquivo que você precisa mexer para cuidar dos produtos.
   As seções Nossas Coleções e Lembranças Personalizadas são montadas
   automaticamente a partir daqui.

   ➜ O QUE APARECE ONDE
     No card: nome, "detalhe" (palavras-chave curtas) e preço.
     Ao clicar no produto: abre a janela com "descricao" e todas as fotos.

   ➜ COMO EDITAR O PREÇO
     Use PONTO no lugar da vírgula (preco: 42.9 aparece como R$ 42,90)
     e escolha o tipo em "precoTipo":
       "fixo"      → R$ 89,90, com o botão "Adicionar à sacola"
       "a_partir"  → a partir de R$ 9,90, com o botão "Quero orçamento"
       "consulta"  → Sob consulta (preco: null), com o botão "Quero orçamento"
     unidade: true acrescenta "a unidade" depois do preço.

   ➜ COMO ADICIONAR UM PRODUTO
     Copie um bloco { ... } inteiro (com a vírgula no final), cole embaixo
     do último da mesma coleção e troque as informações. O "id" precisa ser
     único, sem acento e sem espaço (ex.: "vela-baunilha").

   ➜ COLEÇÕES ACEITAS (campo "colecao")
     "pontos-de-luz", "significados", "momento-pausa",
     "lembrancas" e "brilho-da-fe"

   ➜ COMO TROCAR A FOTO
     Salve a foto em .webp na pasta indicada em "imagens" e escreva o nome
     do arquivo. A primeira é a do card. "foco" (opcional) escolhe a parte
     da foto que fica à vista: primeiro a horizontal, depois a vertical.

   ➜ OUTROS CAMPOS
     selo: texto curto no canto da foto. Use null para não mostrar.
           Use selos só quando forem verdade.
     palavras: (só Significados) exemplos de palavras que já viraram vela.
     pedePalavra: true mostra na sacola o campo "Qual palavra?".
   ===================================================================== */

/* Títulos das coleções */
const COLECOES = [
  {
    id: "pontos-de-luz",
    nome: "Pontos de Luz",
    frase: "Velas decorativas para acender um cantinho da sua casa.",
    // Aparece na janela de detalhes dos produtos desta coleção.
    // [CONFIRMAR COM A GABI]: Lavanda Inglesa aparece nos stories, mas não no catálogo.
    nota: "Aromas da casa: Chá Branco & Bambu · Tâmaras & Damasco · Cereja & Avelã · Flor de Cerejeira & Ameixa · Lavanda Inglesa"
  },
  {
    id: "significados",
    nome: "Significados",
    frase: "Velas que traduzem o que não conseguimos dizer em palavras.",
    produtoUnico: true,
    imagemAdicional: "assets/img/produtos/adicional-sacola.webp",
    sugestao: {
      botao: "Sugerir uma palavra",
      mensagem: "Olá, Gabi! Tenho uma palavra que merece virar vela: "
    }
  },
  {
    id: "momento-pausa",
    nome: "Momento Pausa",
    frase: "Um pequeno ritual de aconchego, para você ou para quem você ama."
  }
];

const PRODUTOS = [
  /* ===== COLEÇÃO PONTOS DE LUZ ===== */
  {
    id: "redoma",
    nome: "Redoma",
    colecao: "pontos-de-luz",
    detalhe: "Tampa de cortiça · pavio de madeira",
    descricao: "Nossa peça mais icônica: vidro arredondado, tampa de cortiça em esfera e pavio de madeira. Uma vela que decora mesmo apagada. Cera 100% vegetal, produto artesanal.",
    preco: 89.9,
    precoTipo: "fixo",
    unidade: false,
    selo: "A MAIS VENDIDA",
    imagens: ["assets/img/produtos/redoma.webp"],
    foco: "50% 82%"
  },
  {
    id: "tamaras-damasco",
    nome: "Tâmaras & Damasco",
    colecao: "pontos-de-luz",
    detalhe: "Pote canelado · pavio de madeira",
    descricao: "",
    preco: 59.9,
    precoTipo: "fixo",
    unidade: false,
    selo: null,
    imagens: ["assets/img/produtos/tamaras-damasco.webp"]
  },
  {
    id: "potes-de-cristal",
    nome: "Potes de Cristal",
    colecao: "pontos-de-luz",
    // [COMPLETAR COM A GABI]: detalhes dos Potes de Cristal.
    detalhe: "Vidro lapidado com tampa",
    descricao: "",
    preco: null,
    precoTipo: "consulta",
    unidade: false,
    selo: null,
    imagens: ["assets/img/produtos/potes-de-cristal.webp"]
  },

  /* ===== COLEÇÃO SIGNIFICADOS: um produto só, com a palavra que a pessoa escolher ===== */
  {
    id: "vela-significados",
    nome: "Vela Significados",
    subtitulo: "Vela com significado",
    colecao: "significados",
    detalhe: "Cera 100% vegetal · tampa de madeira com laço de fita",
    descricao: "Cada vela traz no rótulo o significado de uma palavra que importa. Lar, Fé, Amizade e Família são algumas que já viraram vela, e você pode sugerir a sua.",
    palavras: ["Lar", "Fé", "Amizade", "Família"],
    pedePalavra: true,
    preco: 39.9,
    precoTipo: "fixo",
    unidade: false,
    selo: null,
    imagens: ["assets/img/produtos/significados-palavras.webp", "assets/img/produtos/lar.webp"]
  },

  /* ===== COLEÇÃO MOMENTO PAUSA ===== */
  {
    id: "kit-momento-pausa",
    nome: "Kit Momento Pausa",
    colecao: "momento-pausa",
    detalhe: "Vela + sabonete ou escalda-pés · caixa de presente",
    descricao: "Vela em pote com tampa de madeira e laço de fita, sabonete de glicerina ou escalda-pés, tudo em uma caixa de presente com potinho de fósforo. Fitas e aromas variam conforme o kit.",
    preco: 39.9,
    precoTipo: "a_partir",
    unidade: false,
    selo: "PRONTO PARA PRESENTEAR",
    imagens: ["assets/img/produtos/kit-momento-pausa.webp"]
  },
  {
    id: "kit-banheiro-chique",
    nome: "Kit Banheiro Chique",
    colecao: "momento-pausa",
    detalhe: "3 peças · aromas Plenitude · Essência",
    descricao: "Três peças para deixar o banheiro elegante e perfumado: vela aromática, sabonete líquido com o mesmo aroma e bandeja de madeira.",
    preco: 99.9,
    precoTipo: "fixo",
    unidade: false,
    selo: null,
    imagens: ["assets/img/produtos/kit-banheiro-chique.webp"]
  },

  /* ===== LEMBRANÇAS PERSONALIZADAS ===== */
  {
    id: "vela-lata-organza",
    nome: "Vela em lata com saquinho de organza",
    colecao: "lembrancas",
    detalhe: "Maternidade & chá de bebê",
    descricao: "",
    preco: 9.9,
    precoTipo: "a_partir",
    unidade: true,
    selo: null,
    imagens: ["assets/img/lembrancas/vela-lata-organza.webp"]
  },
  {
    id: "vela-vidro-jateado",
    nome: "Vela em vidro jateado",
    colecao: "lembrancas",
    detalhe: "Batizado · aniversário · casamento",
    descricao: "",
    preco: 16,
    precoTipo: "a_partir",
    unidade: true,
    selo: null,
    imagens: ["assets/img/lembrancas/vela-vidro-jateado.webp"]
  },
  {
    id: "alcool-gel",
    nome: "Álcool em gel com rótulo personalizado",
    colecao: "lembrancas",
    detalhe: "",
    descricao: "",
    preco: null,
    precoTipo: "consulta",
    unidade: false,
    selo: null,
    imagens: ["assets/img/lembrancas/alcool-gel.webp"]
  },
  {
    id: "lembrancinha-card",
    nome: "Lembrancinha card",
    colecao: "lembrancas",
    detalhe: "Flor de cera com cartão",
    descricao: "",
    preco: 9.9,
    precoTipo: "a_partir",
    unidade: true,
    selo: null,
    imagens: ["assets/img/lembrancas/lembrancinha-card.webp"]
  },

  /* ===== BRILHO DA FÉ ===== */
  {
    id: "valei-me-sao-jose",
    nome: "Valei-me, São José",
    colecao: "brilho-da-fe",
    detalhe: "Lata · oração · mini terço · organza",
    descricao: "Lembrança com a imagem e a oração do santo de devoção, para batizados, primeira comunhão, agradecimentos e momentos de fé. Outras devoções sob encomenda.",
    preco: 22,
    precoTipo: "a_partir",
    unidade: false,
    selo: null,
    imagens: ["assets/img/lembrancas/valei-me-sao-jose.webp"]
  }
];
