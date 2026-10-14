import type { Content } from './types';

/**
 * Conteúdo inicial. Fotografias, músicas e peças do museu começam vazias:
 * dependem de material pessoal e são adicionadas pela área administrativa.
 */
export const defaultContent: Content = {
  version: 1,

  home: {
    title: 'Para Annelise.',
    subtitle: 'Algumas coisas merecem ser lidas com calma.',
    footer: 'Feito para você, com atenção aos detalhes.',
  },

  book: {
    dedication: 'Para você, Annelise.\n\nUma carta e dez textos, reunidos num só lugar.',
  },

  photos: [],
  tracks: [],
  spotifyPlaylist: 'https://open.spotify.com/playlist/728BdbXNyL00ybhvCK8R97',

  radio: {
    interludes: [
      'Você está ouvindo a Frequência Annelise. Não há anúncios nem previsão do tempo.',
      'Esta estação transmite para uma pessoa só. A audiência é pequena, mas é exatamente a que importa.',
      'Intervalo de alguns segundos. Dá tempo de beber um copo d’água.',
      'A próxima faixa foi escolhida por um motivo. Se quiser saber qual, é só perguntar.',
    ],
  },

  stars: [
    {
      id: 's-texto-2',
      kind: 'texto',
      category: 'texto',
      title: 'Um texto',
      body: '',
      fragment: 2,
      photoId: '',
      trackId: '',
      x: 22,
      y: 30,
    },
    {
      id: 's-pergunta-1',
      kind: 'pergunta',
      category: 'pergunta',
      title: 'Uma pergunta',
      body: 'Se você pudesse acrescentar uma música à lista deste site, qual seria?',
      fragment: 0,
      photoId: '',
      trackId: '',
      x: 41,
      y: 17,
    },
    {
      id: 's-memoria',
      kind: 'foto',
      category: 'memoria',
      title: 'Uma fotografia',
      body: '',
      fragment: 0,
      photoId: '',
      trackId: '',
      x: 63,
      y: 26,
    },
    {
      id: 's-carta',
      kind: 'carta',
      category: 'texto',
      title: 'Uma carta curta',
      body: 'Este mapa tem poucas estrelas de propósito. Preferi deixar algumas coisas bem escolhidas a encher a tela de frases. Esta aqui é só para dizer que, enquanto montava o resto, era em você que eu pensava.',
      fragment: 0,
      photoId: '',
      trackId: '',
      x: 79,
      y: 44,
    },
    {
      id: 's-musica',
      kind: 'musica',
      category: 'musica',
      title: 'Uma música',
      body: '',
      fragment: 0,
      photoId: '',
      trackId: '',
      x: 66,
      y: 66,
    },
    {
      id: 's-texto-8',
      kind: 'texto',
      category: 'texto',
      title: 'Outro texto',
      body: '',
      fragment: 8,
      photoId: '',
      trackId: '',
      x: 40,
      y: 58,
    },
    {
      id: 's-pergunta-2',
      kind: 'pergunta',
      category: 'pergunta',
      title: 'Outra pergunta',
      body: 'Qual foi a última coisa que você aprendeu e teve vontade de contar para alguém?',
      fragment: 0,
      photoId: '',
      trackId: '',
      x: 18,
      y: 72,
    },
    {
      id: 's-segredo',
      kind: 'segredo',
      category: 'texto',
      title: 'Mensagem guardada',
      body: 'Esta estrela só acende depois das outras. Achei justo que a última mensagem do mapa fosse a mais simples: obrigado por ter olhado com atenção.',
      fragment: 0,
      photoId: '',
      trackId: '',
      x: 51,
      y: 84,
    },
  ],

  oracle: {
    hiddenCard:
      'O lótus cresce na lama e floresce acima da água. Na tradição budista, ele costuma representar a possibilidade de clareza mesmo em condições difíceis. Ele ficou escondido no baralho porque a parte mais importante desta leitura não está nas cartas: está no que cada pessoa decide fazer.',
  },

  envelopes: [
    {
      id: 'saudade',
      label: 'Abra quando sentir saudade',
      body: 'Se você abriu este envelope, talvez esteja com saudade. Pode ser de mim, de uma época ou de alguma coisa que nem tem nome. Não precisa saber exatamente de quê.\n\nEu também sinto. Não escrevo isso para pedir nada. Só achei que seria bom você saber que esse sentimento não está só do seu lado.',
    },
    {
      id: 'sorrir',
      label: 'Abra quando precisar sorrir',
      body: 'Instruções de uso deste envelope:\n\n1. Leia.\n2. Se não sorrir, leia de novo com voz de narrador de documentário.\n3. Se ainda assim não funcionar, a culpa é do texto, não sua.\n\nObservação: este foi o envelope mais difícil de escrever. Ser sério é bem mais fácil do que ser engraçado de propósito.',
    },
    {
      id: 'penso',
      label: 'Abra quando quiser saber o que penso de você',
      body: 'Penso que você é difícil de resumir, e isso nunca foi um defeito.\n\nPenso que você percebe coisas que eu demoro a perceber.\n\nPenso que eu deveria ter dito isso mais vezes quando estava perto.',
    },
    {
      id: 'duvida',
      label: 'Abra quando estiver em dúvida',
      body: 'Se estiver em dúvida sobre mim, sobre nós ou até sobre este site, faz sentido. Eu não fiz nada disso esperando que as suas dúvidas desaparecessem.\n\nDúvida não é uma resposta errada. Se em algum momento quiser conversar sobre ela, eu escuto. Se não quiser, também está tudo bem.',
    },
    {
      id: 'sem-resposta',
      label: 'Abra quando quiser ler algo sem precisar responder',
      body: 'Esta mensagem não espera resposta.\n\nEspero que o seu dia tenha tido pelo menos uma parte boa. Espero que você esteja dormindo bem, comendo direito e rindo de alguma coisa.\n\nÉ só isso.',
    },
  ],

  dictionary: [
    {
      id: 'd-autonomia',
      word: 'Autonomia',
      grammar: 's.f.',
      definition:
        'A parte de você que existe antes de qualquer relação e continua existindo depois. Não está aberta a negociação.',
      example: '',
    },
    {
      id: 'd-calma',
      word: 'Calma',
      grammar: 's.f.',
      definition: 'Ritmo recomendado para ler este site. Não é obrigatório, mas ajuda.',
      example: '',
    },
    {
      id: 'd-contradicao',
      word: 'Contradição',
      grammar: 's.f.',
      definition:
        'Duas coisas verdadeiras sobre a mesma pessoa que não cabem na mesma frase. No seu caso, não é um problema a ser resolvido.',
      example: '',
    },
    {
      id: 'd-conviccao',
      word: 'Convicção',
      grammar: 's.f.',
      definition:
        'Opinião que não muda só porque alguém insistiu. Pode mudar quando aparece um bom motivo, e isso é diferente.',
      example: 'Discutir com alguém de convicção dá mais trabalho e costuma valer mais a pena.',
    },
    {
      id: 'd-detalhe',
      word: 'Detalhe',
      grammar: 's.m.',
      definition: 'Parte pequena de alguma coisa que costuma dizer mais do que o todo.',
      example: 'Ver também: Coisas que merecem registro.',
    },
    {
      id: 'd-exagero',
      word: 'Exagero',
      grammar: 's.m.',
      definition: 'Fazer um livro, um mapa, um rádio e um baralho quando uma carta talvez bastasse.',
      example: 'Ver também: este dicionário.',
    },
    {
      id: 'd-interioridade',
      word: 'Interioridade',
      grammar: 's.f.',
      definition: 'Tudo o que acontece dentro de alguém e nunca chega a virar frase. Não precisa virar.',
      example: '',
    },
    {
      id: 'd-nuance',
      word: 'Nuance',
      grammar: 's.f.',
      definition: 'Diferença pequena demais para ser vista de longe. Exige que a pessoa se aproxime e preste atenção.',
      example: '',
    },
    {
      id: 'd-paciencia',
      word: 'Paciência',
      grammar: 's.f.',
      definition: 'O que este site pede de quem o fez, não de quem o lê.',
      example: '',
    },
    {
      id: 'd-raciocinio',
      word: 'Raciocínio',
      grammar: 's.m.',
      definition:
        'O percurso que leva alguém a uma conclusão. No seu, o percurso costuma ser mais interessante do que o ponto de chegada.',
      example: '',
    },
    {
      id: 'd-significado',
      word: 'Significado',
      grammar: 's.m.',
      definition: 'O peso que cada pessoa dá às coisas. Nem sempre é visível de fora, e não cabe a mais ninguém medir.',
      example: '',
    },
    {
      id: 'd-silencio',
      word: 'Silêncio',
      grammar: 's.m.',
      definition: 'Também é uma forma de dizer alguma coisa. Não precisa ser traduzido para ser respeitado.',
      example: '',
    },
  ],

  museum: [],

  future: [
    {
      id: 'f-refeicao',
      title: 'Preparar uma refeição',
      lines: [
        { who: 'hoje', text: 'Como é cozinhar juntos?' },
        { who: 'adiante', text: 'A receita dizia quarenta minutos. Levou uma hora e meia.' },
        {
          who: 'adiante',
          text: 'Alguém esqueceu de comprar alho, e o jantar ficou um pouco sem graça. Ninguém se importou muito.',
        },
        { who: 'adiante', text: 'A louça ficou para depois, como sempre fica.' },
      ],
    },
    {
      id: 'f-moveis',
      title: 'Escolher móveis para uma casa',
      lines: [
        { who: 'hoje', text: 'E escolher os móveis?' },
        {
          who: 'adiante',
          text: 'Três sábados olhando sofás. Um era bonito e desconfortável, o outro era confortável e feio.',
        },
        { who: 'adiante', text: 'No fim, a decisão foi sobre a mesa, não sobre o sofá. A mesa precisava caber gente.' },
      ],
    },
    {
      id: 'f-viagem',
      title: 'Organizar uma viagem',
      lines: [
        { who: 'hoje', text: 'Vocês viajam?' },
        { who: 'adiante', text: 'Às vezes. O planejamento dura mais do que a viagem.' },
        {
          who: 'adiante',
          text: 'Uma pessoa faz a planilha. A outra muda tudo no segundo dia. Funciona melhor assim do que deveria.',
        },
      ],
    },
    {
      id: 'f-dia-dificil',
      title: 'No fim de um dia difícil',
      lines: [
        { who: 'hoje', text: 'E quando o dia é ruim?' },
        { who: 'adiante', text: 'Ninguém tenta resolver nada na hora.' },
        {
          who: 'adiante',
          text: 'Primeiro um banho, depois alguma coisa para comer. A conversa vem depois, se vier. Às vezes só sentar perto já resolve metade.',
        },
      ],
    },
    {
      id: 'f-desentendimento',
      title: 'Um desentendimento',
      lines: [
        { who: 'hoje', text: 'Vocês brigam?' },
        { who: 'adiante', text: 'Discordam. De vez em quando a discussão esquenta.' },
        {
          who: 'adiante',
          text: 'A diferença é que agora alguém diz “espera, deixa eu entender o que você quis dizer” antes de responder. Nem sempre na primeira tentativa.',
        },
        { who: 'adiante', text: 'E ninguém fica dias em silêncio para provar um ponto.' },
      ],
    },
    {
      id: 'f-filhos',
      title: 'A possibilidade de ter filhos',
      lines: [
        { who: 'hoje', text: 'Vocês pensam em ter filhos?' },
        { who: 'adiante', text: 'Pensam. Ainda não decidiram tudo.' },
        {
          who: 'adiante',
          text: 'Conversaram sobre nomes, sobre medo, sobre dinheiro e sobre quem acorda de madrugada. A lista de nomes é longa e ninguém concorda com ela inteira.',
        },
        { who: 'adiante', text: 'É uma possibilidade, não uma obrigação. A decisão, se vier, vai ser dos dois.' },
      ],
    },
    {
      id: 'f-rotina',
      title: 'Uma rotina comum',
      lines: [
        { who: 'hoje', text: 'Como é um dia comum?' },
        { who: 'adiante', text: 'Café, trabalho, mensagens curtas no meio da tarde. Mercado na quinta.' },
        { who: 'adiante', text: 'Nada de extraordinário. É justamente isso que ficou bom.' },
      ],
    },
  ],

  puzzle: { photoId: '', size: 3, message: '' },

  garden: {
    messages: [
      'A água voltou a ficar parada.',
      'Uma pétala chegou à margem.',
      'O vento mudou um pouco de direção.',
      'Alguma coisa se moveu embaixo da folha.',
      'As ondas se cruzaram e desapareceram.',
    ],
  },

  secret: { requires: ['livro', 'atlas', 'oraculo', 'cartas'] },

  story: { lines: {}, choices: {} },
};
