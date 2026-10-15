/* =====================================================================
   CATÁLOGO DA VAGALUMI VELAS
   ---------------------------------------------------------------------
   Este é o único arquivo que você precisa mexer para cuidar dos produtos.

   ➜ COMO ADICIONAR UM PRODUTO
     Copie um bloco { ... } inteiro (de uma chave até a outra, com a
     vírgula no final), cole embaixo do último e troque as informações.
     O "id" precisa ser único, sem acento e sem espaço (ex.: "vela-baunilha").

   ➜ COMO EDITAR O PREÇO
     Troque o valor de "preco" por um número, usando PONTO no lugar da
     vírgula:  preco: 42.9   →  aparece no site como R$ 42,90
     Deixe  preco: null  para mostrar "Sob consulta" com o botão
     "Consultar pelo WhatsApp".

   ➜ COMO TROCAR A FOTO
     Salve a foto (quadrada, de preferência 800x800 px, formato .webp)
     dentro da pasta  assets/img/produtos/  e escreva o nome do arquivo
     em "imagens". A primeira foto é a principal; a segunda (opcional)
     aparece quando a pessoa passa o mouse por cima do card.
     Enquanto a foto não existir, o site mostra um quadrado creme.

   ➜ CATEGORIAS ACEITAS (usadas pelos filtros)
     "aromaticas"  → Velas aromáticas
     "lata"        → Velas em lata
     "kits"        → Kits

   ➜ SELO
     Texto curto no canto da foto (ex.: "NOVO", "NATAL", "MAIS VENDIDA").
     Use null para não mostrar selo. Use selos só quando forem verdade.
   ===================================================================== */

const PRODUTOS = [
  {
    id: "vela-cha-branco-bambu",
    nome: "Vela Chá Branco & Bambu",
    categoria: "aromaticas",
    notas: "Chá branco · bambu",
    descricao: "Vela aromática em pote de vidro com tampa de cortiça.",
    preco: null,
    selo: null,
    imagens: ["assets/img/produtos/cha-branco-bambu.webp"]
  },
  {
    id: "vela-tamaras-damasco",
    nome: "Vela Tâmaras & Damasco",
    categoria: "aromaticas",
    notas: "Tâmaras · damasco",
    descricao: "Vela aromática artesanal com cera 100% vegetal.",
    preco: null,
    selo: null,
    imagens: ["assets/img/produtos/tamaras-damasco.webp"]
  },
  {
    id: "vela-lavanda-inglesa",
    nome: "Vela Lavanda Inglesa",
    categoria: "aromaticas",
    notas: "Lavanda inglesa",
    descricao: "Vela aromática artesanal com cera 100% vegetal.",
    preco: null,
    selo: null,
    imagens: ["assets/img/produtos/lavanda-inglesa.webp"]
  },
  {
    id: "vela-lata-vagalumi",
    nome: "Vela em lata Vagalumi",
    categoria: "lata",
    notas: "Aromas variados, consulte",
    descricao: "Vela aromática em lata, prática para presentear e levar na bolsa.",
    preco: null,
    selo: null,
    imagens: ["assets/img/produtos/vela-lata.webp"]
  },
  {
    id: "kit-auto-cuidado",
    nome: "Kit Auto Cuidado",
    categoria: "kits",
    notas: "Vela aromática + sachê aromático",
    descricao: "Um momento de pausa para você ou para quem você ama: vela aromática artesanal e sachê aromático, embalados com carinho.",
    preco: 35,
    selo: "MAIS VENDIDO",
    imagens: ["assets/img/produtos/kit-auto-cuidado.webp"]
  },
  {
    id: "kit-presente-coracao",
    nome: "Kit Presente Coração",
    categoria: "kits",
    notas: "Presente em caixa de coração",
    descricao: "Kit presente montado em uma delicada caixa de coração.",
    preco: null,
    selo: null,
    imagens: ["assets/img/produtos/kit-coracao.webp"]
  }
];
