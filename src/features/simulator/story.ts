import {
  all,
  any,
  atLeast,
  has,
  not,
  type Backdrop,
  type Ending,
  type Line,
  type Scene,
  type StoryState,
} from './engine';

/**
 * "Depois da chuva" — uma história curta e ficcional.
 *
 * Você recebe, depois de quatro meses de silêncio, uma mensagem de Teo.
 * Ao mesmo tempo, precisa decidir sobre uma residência de seis meses em
 * Lisboa. Nenhum desfecho é tratado como o certo: a história só acompanha
 * as consequências das escolhas.
 */

export const storyTitle = 'Depois da chuva';

export const chapters = ['A mensagem', 'O reencontro', 'A conversa', 'O que é seu', 'O que fica'];

export const START = 'abertura';

export const speakerNames: Record<string, string> = {
  teo: 'Teo',
  lia: 'Lia',
  voce: 'Você',
  'msg-teo': 'Mensagem de Teo',
  'msg-voce': 'Sua mensagem',
};

/* ---------- atalhos de escrita ---------- */
const N = (text: string, cond?: Line['if']): Line => ({ who: 'narracao', text, if: cond });
const P = (text: string, cond?: Line['if']): Line => ({ who: 'pensamento', text, if: cond });
const T = (text: string, cond?: Line['if']): Line => ({ who: 'teo', text, if: cond });
const L = (text: string, cond?: Line['if']): Line => ({ who: 'lia', text, if: cond });
const V = (text: string, cond?: Line['if']): Line => ({ who: 'voce', text, if: cond });
const MT = (text: string, cond?: Line['if']): Line => ({ who: 'msg-teo', text, if: cond });
const MV = (text: string, cond?: Line['if']): Line => ({ who: 'msg-voce', text, if: cond });

/** Onde acontece a conversa principal, conforme o caminho percorrido. */
const meetingPlace = (s: StoryState) =>
  s.flags.aceitouCafe ? 'Café Aurora' : s.flags.caminhou ? 'Beira do rio' : 'Galeria, terceira sala';
const meetingTime = (s: StoryState) =>
  s.flags.aceitouCafe ? (s.flags.pediuTempo ? 'Sábado, 10h' : 'Quarta-feira, 18h') : 'Sábado, 20h';
const meetingBackdrop = (s: StoryState): Backdrop =>
  s.flags.aceitouCafe ? 'cafe' : s.flags.caminhou ? 'rua' : 'galeria';

/** Cenas em casa acontecem na sala (sábado à noite) ou na cozinha (domingo), conforme o caminho. */
const homePlace = (s: StoryState) => (s.flags.liaManha ? 'Cozinha' : 'Sala');
const homeBackdrop = (s: StoryState): Backdrop => (s.flags.liaManha ? 'manha' : 'sala-chuva');
const homeTime = (night: string, day: string) => (s: StoryState) => (s.flags.liaManha ? day : night);

/** As três respostas possíveis a um convite de Teo. */
const inviteChoices = [
  { id: 'aceitar', label: 'Aceitar: um café na quarta-feira, depois do trabalho.', set: ['aceitouCafe'], to: 'cafe' },
  { id: 'dias', label: '“Talvez. Me dá alguns dias.”', set: ['pediuTempo'], to: 'alguns_dias' },
  { id: 'nao', label: '“Acho que ainda não.”', set: ['disseAindaNao'], to: 'ainda_nao' },
];

export const scenes: Record<string, Scene> = {
  /* =================================================================
     I — A MENSAGEM
  ================================================================= */
  abertura: {
    id: 'abertura',
    chapter: 1,
    place: 'Sala',
    time: 'Sábado, 22h14',
    backdrop: 'sala-chuva',
    lines: [
      N('Sábado, fim de outubro. A chuva começou no meio da tarde e ainda não decidiu parar.'),
      N(
        'Você está no sofá, com um livro aberto na mesma página há vinte minutos. Sobre a mesa, o computador mostra um e-mail que você já leu três vezes: a confirmação de uma residência artística de seis meses em Lisboa. A resposta precisa ser enviada até sexta.',
      ),
      N('O celular acende ao lado da xícara.'),
      N('É Teo. Faz quatro meses que vocês não se falam.'),
      MT(
        'Passei hoje pela livraria da Rua das Acácias. O livro de capa cinza continua na vitrine — aquele que você dizia que um dia ia ler.',
      ),
      MT('Não precisa responder. Só achei mais honesto dizer que lembrei de você do que fingir que não.'),
    ],
    choices: [
      { id: 'agora', label: 'Responder agora.', add: { proximidade: 1 }, set: ['respondeu'], to: 'responder_agora' },
      { id: 'amanha', label: 'Deixar para amanhã, com a cabeça mais clara.', add: { clareza: 1 }, to: 'manha' },
      { id: 'lia', label: 'Ligar para Lia.', set: ['falouComLia'], to: 'lia_noite' },
      { id: 'livro', label: 'Virar o celular para baixo e voltar ao livro.', set: ['silencio'], to: 'livro' },
    ],
  },

  responder_agora: {
    id: 'responder_agora',
    chapter: 1,
    place: homePlace,
    time: homeTime('Sábado, 22h31', 'Domingo, 10h50'),
    backdrop: homeBackdrop,
    lines: [
      N('Você escreve, apaga, escreve de novo. As primeiras versões dizem demais; as seguintes, quase nada.'),
      P('O que, de fato, você quer que ele saiba?'),
    ],
    choices: [
      {
        id: 'lembrei',
        label: '“Eu também lembrei de você, algumas vezes.”',
        add: { proximidade: 1 },
        set: ['disseQueLembrou'],
        to: 'teo_quente',
      },
      { id: 'leve', label: '“Obrigada por avisar. Ainda não li.”', to: 'teo_leve' },
      { id: 'porque', label: '“Por que agora?”', add: { clareza: 1 }, set: ['perguntouPorQue'], to: 'teo_porque' },
    ],
  },

  teo_quente: {
    id: 'teo_quente',
    chapter: 1,
    place: homePlace,
    time: homeTime('Sábado, 22h33', 'Domingo, 10h55'),
    backdrop: homeBackdrop,
    lines: [
      MV('Eu também lembrei de você, algumas vezes.'),
      N('Os três pontinhos aparecem e somem duas vezes antes da resposta.'),
      MT('Fico contente em saber. De verdade.'),
      MT(
        'Se em algum momento você quiser tomar um café, eu gostaria. Sem nenhuma expectativa além do café — e, se a resposta for não, também está tudo bem.',
      ),
    ],
    choices: inviteChoices,
  },

  teo_leve: {
    id: 'teo_leve',
    chapter: 1,
    place: homePlace,
    time: homeTime('Sábado, 22h33', 'Domingo, 10h55'),
    backdrop: homeBackdrop,
    lines: [
      MV('Obrigada por avisar. Ainda não li.'),
      MT('Devia. Acho que você ia gostar do último capítulo — é o único em que ninguém tem razão.'),
      N('Uma pausa curta. Depois, outra mensagem.'),
      MT('Desculpa se a mensagem foi estranha. Faz tempo que não sei bem como falar com você.'),
    ],
    choices: [
      { id: 'nao-estranha', label: '“Não foi estranha.”', add: { proximidade: 1 }, to: 'convite_leve' },
      {
        id: 'um-pouco',
        label: '“Foi um pouco. Mas foi honesta.”',
        add: { confianca: 1, clareza: 1 },
        set: ['franqueza'],
        to: 'convite_leve',
      },
      { id: 'boa-noite', label: '“Boa noite, Teo.”', to: 'boa_noite' },
    ],
  },

  convite_leve: {
    id: 'convite_leve',
    chapter: 1,
    place: homePlace,
    time: homeTime('Sábado, 22h40', 'Domingo, 11h'),
    backdrop: homeBackdrop,
    lines: [
      MV('Não foi estranha.', not('franqueza')),
      MV('Foi um pouco. Mas foi honesta.', has('franqueza')),
      MT('Honesta eu aceito. Estranha também, se vier junto.', has('franqueza')),
      MT(
        'Então vou arriscar uma coisa: se um dia você quiser conversar pessoalmente, eu gostaria. Sem pressa. Sem roteiro.',
      ),
    ],
    choices: inviteChoices,
  },

  teo_porque: {
    id: 'teo_porque',
    chapter: 1,
    place: homePlace,
    time: homeTime('Sábado, 22h33', 'Domingo, 10h55'),
    backdrop: homeBackdrop,
    lines: [
      MV('Por que agora?'),
      N('A resposta demora. Quando chega, é mais longa do que você esperava.'),
      MT(
        'Porque passei quatro meses tentando não escrever, e hoje percebi que fingir que não lembrei seria menos honesto do que dizer.',
      ),
      MT(
        'Mas talvez a pergunta verdadeira seja outra: se eu tenho o direito de escrever. Não sei se tenho. Por isso disse que você não precisava responder.',
      ),
    ],
    choices: [
      { id: 'quer', label: '“Não é sobre direito. É sobre o que você quer.”', add: { clareza: 1 }, to: 'teo_quer' },
      {
        id: 'pensar',
        label: '“Preciso pensar antes de responder qualquer coisa.”',
        set: ['pediuTempo'],
        to: 'alguns_dias',
      },
      { id: 'nao-sei', label: '“Não sei se quero essa conversa.”', set: ['disseAindaNao'], to: 'ainda_nao' },
    ],
  },

  teo_quer: {
    id: 'teo_quer',
    chapter: 1,
    place: homePlace,
    time: homeTime('Sábado, 22h41', 'Domingo, 11h'),
    backdrop: homeBackdrop,
    lines: [
      MV('Não é sobre direito. É sobre o que você quer.'),
      MT(
        'Quero conversar com você. Pessoalmente, se você quiser também. E quero ouvir mais do que falar — isso eu aprendi tarde.',
      ),
    ],
    choices: inviteChoices,
  },

  boa_noite: {
    id: 'boa_noite',
    chapter: 1,
    place: homePlace,
    time: homeTime('Sábado, 22h50', 'Domingo, 11h05'),
    backdrop: homeBackdrop,
    lines: [
      MV('Boa noite, Teo.'),
      MT('Boa noite.'),
      N('Ele não insiste. Você repara nisso mais do que gostaria de reparar.'),
    ],
    next: 'semana',
  },

  manha: {
    id: 'manha',
    chapter: 1,
    place: 'Cozinha',
    time: 'Domingo, 9h',
    backdrop: 'manha',
    lines: [
      N('Domingo. A chuva parou durante a madrugada e deixou a cidade com cheiro de terra.'),
      N(
        'Você relê a mensagem durante o café da manhã. À luz do dia, ela parece menor — e, ao mesmo tempo, mais difícil de ignorar.',
      ),
      N('Ao lado, o e-mail de Lisboa continua aberto. Duas perguntas sobre a mesma mesa.'),
    ],
    choices: [
      { id: 'calma', label: 'Responder a Teo, com calma.', set: ['respondeu'], to: 'manha_resposta' },
      { id: 'lia', label: 'Conversar com Lia antes.', set: ['falouComLia', 'liaManha'], to: 'lia_manha' },
      {
        id: 'lisboa',
        label: 'Pensar primeiro em Lisboa. Teo pode esperar.',
        add: { clareza: 1 },
        set: ['cuidouDeLisboa'],
        to: 'lisboa_primeiro',
      },
    ],
  },

  manha_resposta: {
    id: 'manha_resposta',
    chapter: 1,
    place: 'Cozinha',
    time: 'Domingo, 9h40',
    backdrop: 'manha',
    lines: [
      MV(
        'Recebi sua mensagem ontem. Preferi responder com calma. Ainda não li o livro — e ainda não sei bem o que pensar.',
      ),
      MT('Obrigado por responder. Sei que não era obrigação.'),
      MT('Se em algum momento você quiser conversar pessoalmente, eu gostaria. No seu tempo.'),
    ],
    choices: inviteChoices,
  },

  lisboa_primeiro: {
    id: 'lisboa_primeiro',
    chapter: 1,
    place: 'Cozinha',
    time: 'Domingo, 11h',
    backdrop: 'manha',
    lines: [
      N(
        'Você fecha a conversa com Teo e abre o e-mail. Seis meses. Um ateliê perto do rio. Um projeto que é inteiramente seu.',
      ),
      N(
        'Você escreve à coordenação perguntando sobre as datas e o alojamento. Ainda não é uma resposta definitiva, mas é um passo — o primeiro do dia que não depende de ninguém.',
      ),
      N('À tarde, responde a Teo com uma linha só.'),
      MV('Recebi. Obrigada. Talvez a gente converse em algum momento.'),
      MT('Quando e se você quiser.'),
    ],
    next: 'semana',
  },

  lia_noite: {
    id: 'lia_noite',
    chapter: 1,
    place: 'Sala',
    time: 'Sábado, 22h40',
    backdrop: 'sala-chuva',
    lines: [
      N('Lia atende no segundo toque, com barulho de louça ao fundo.'),
      L('Você só me liga a esta hora quando aconteceu alguma coisa. O que foi?'),
      N('Você lê a mensagem em voz alta. Do outro lado, um silêncio atento.'),
      L('E o que você sentiu quando leu?'),
    ],
    choices: [
      {
        id: 'saudade',
        label: '“Saudade, eu acho.”',
        add: { proximidade: 1 },
        set: ['sentiuSaudade'],
        to: 'lia_resposta',
      },
      {
        id: 'raiva',
        label: '“Um pouco de raiva. Ele some e reaparece com uma vitrine.”',
        add: { clareza: 1 },
        set: ['sentiuRaiva'],
        to: 'lia_resposta',
      },
      { id: 'nao-sei', label: '“Não sei ainda.”', set: ['incerteza'], to: 'lia_resposta' },
    ],
  },

  lia_manha: {
    id: 'lia_manha',
    chapter: 1,
    place: 'Cozinha',
    time: 'Domingo, 10h',
    backdrop: 'manha',
    lines: [
      N('Lia chega com dois pães ainda quentes e nenhuma pressa. Senta-se no balcão, como sempre.'),
      N('Você lhe mostra a mensagem. Ela lê duas vezes, devolve o celular e pega um pão.'),
      L('E o que você sentiu quando leu?'),
    ],
    choices: [
      {
        id: 'saudade',
        label: '“Saudade, eu acho.”',
        add: { proximidade: 1 },
        set: ['sentiuSaudade'],
        to: 'lia_resposta',
      },
      {
        id: 'raiva',
        label: '“Um pouco de raiva. Ele some e reaparece com uma vitrine.”',
        add: { clareza: 1 },
        set: ['sentiuRaiva'],
        to: 'lia_resposta',
      },
      { id: 'nao-sei', label: '“Não sei ainda.”', set: ['incerteza'], to: 'lia_resposta' },
    ],
  },

  lia_resposta: {
    id: 'lia_resposta',
    chapter: 1,
    place: (s) => (s.flags.liaManha ? 'Cozinha' : 'Sala'),
    time: (s) => (s.flags.liaManha ? 'Domingo, 10h20' : 'Sábado, 22h52'),
    backdrop: (s) => (s.flags.liaManha ? 'manha' : 'sala-chuva'),
    lines: [
      L(
        'Saudade é legítimo. Só não deixe que ela decida sozinha — saudade costuma lembrar das partes boas com uma memória muito seletiva.',
        has('sentiuSaudade'),
      ),
      L(
        'Raiva também é informação. Talvez ela esteja dizendo que ainda há coisas por dizer. Ou que você não quer mais dizê-las a ele. As duas coisas são possíveis.',
        has('sentiuRaiva'),
      ),
      L('Tudo bem não saber. Você não precisa responder hoje — nem esta semana.', has('incerteza')),
      L(
        'Você não deve nada a ele, nem mesmo uma resposta. Mas também não precisa fugir de uma conversa só porque ela pode ser difícil.',
      ),
      L('E Lisboa? Você já respondeu?'),
      N('Não respondeu. Lia percebe pelo tamanho do silêncio.'),
      L('Então me prometa só uma coisa: decida Lisboa pensando em Lisboa. O resto a gente vê depois.'),
    ],
    choices: [
      { id: 'prometo', label: '“Prometo.”', add: { clareza: 1 }, set: ['prometeuLia'], to: 'lia_fim' },
      { id: 'misturo', label: '“Não sei se consigo separar as duas coisas.”', set: ['misturou'], to: 'lia_fim' },
    ],
  },

  lia_fim: {
    id: 'lia_fim',
    chapter: 1,
    place: (s) => (s.flags.liaManha ? 'Cozinha' : 'Sala'),
    time: (s) => (s.flags.liaManha ? 'Domingo, 10h40' : 'Sábado, 23h05'),
    backdrop: (s) => (s.flags.liaManha ? 'manha' : 'sala-chuva'),
    lines: [
      L('Então ao menos repare quando estiver misturando. Já é muita coisa.', has('misturou')),
      L('Combinado. Vou cobrar.', has('prometeuLia')),
      L('Sábado que vem é a abertura da minha exposição. Se quiser companhia que não pergunte nada, estou lá.'),
      N('Depois que ela se despede, você fica olhando para o celular por um tempo.', has('liaManha')),
      N('Depois de desligar, você fica olhando para o celular por um tempo.', not('liaManha')),
    ],
    choices: [
      { id: 'responder', label: 'Responder a Teo agora.', set: ['respondeu'], to: 'responder_agora' },
      { id: 'esperar', label: 'Deixar a mensagem sem resposta, por enquanto.', set: ['silencio'], to: 'semana' },
    ],
  },

  livro: {
    id: 'livro',
    chapter: 1,
    place: 'Sala',
    time: 'Sábado, 23h',
    backdrop: 'sala-chuva',
    lines: [
      N('Você vira o celular para baixo. O livro continua na mesma página, mas pelo menos agora você está lendo.'),
      N('Lá fora, a chuva engrossa por alguns minutos e depois volta ao ritmo de antes.'),
      P('Algumas mensagens não pedem resposta. Pedem apenas tempo para que se saiba o que fazer com elas.'),
    ],
    next: 'semana',
  },

  alguns_dias: {
    id: 'alguns_dias',
    chapter: 1,
    place: 'Cidade',
    time: 'Durante a semana',
    backdrop: 'rua',
    lines: [
      MT('Claro. Quantos você precisar.'),
      N(
        'Os dias seguintes são comuns: trabalho, mercado, um filme começado e não terminado. Você pensa nele menos do que temia e mais do que gostaria.',
      ),
      N('Na quinta-feira, entre uma reunião e outra, percebe que já sabe a resposta.'),
    ],
    choices: [
      { id: 'cafe', label: 'Propor um café no sábado de manhã.', set: ['aceitouCafe'], to: 'cafe' },
      { id: 'nao', label: 'Escrever que prefere não se encontrar agora.', set: ['disseAindaNao'], to: 'ainda_nao' },
    ],
  },

  ainda_nao: {
    id: 'ainda_nao',
    chapter: 1,
    place: (s) => (s.flags.pediuTempo ? 'Cidade' : 'Sala'),
    time: (s) => (s.flags.pediuTempo ? 'Quinta-feira, 13h' : 'Sábado, 22h45'),
    backdrop: (s) => (s.flags.pediuTempo ? 'rua' : 'sala-chuva'),
    lines: [
      MV('Acho que ainda não. Não é um não para sempre — é um não para agora.'),
      MT('Entendo. Obrigado por responder com sinceridade.'),
      N(
        'Nenhuma insistência, nenhum ponto de interrogação. A conversa termina ali, e é curioso como isso a tranquiliza.',
      ),
    ],
    next: 'semana',
  },

  /* =================================================================
     II — O REENCONTRO
  ================================================================= */
  semana: {
    id: 'semana',
    chapter: 2,
    place: 'Galeria',
    time: 'Sábado seguinte, 19h',
    backdrop: 'galeria',
    onEnter: { set: ['foiAGaleria'] },
    lines: [
      N('Uma semana depois. A galeria ocupa o térreo de um prédio antigo, com piso de taco e paredes brancas demais.'),
      N(
        'As fotografias de Lia ocupam três salas: janelas de apartamentos vizinhos, sempre à noite, sempre com alguém de costas.',
      ),
      L('Você veio. Não vou perguntar nada, prometi.', has('falouComLia')),
      L('Você veio! Pegue uma taça e finja que entende de fotografia, como todo mundo.', not('falouComLia')),
      N('Na terceira sala, diante da maior fotografia, está Teo.'),
      N(
        'Ele a vê. Faz um aceno breve com a cabeça e permanece onde está — respeitando, ao que parece, o “ainda não” que você escreveu.',
        has('disseAindaNao'),
      ),
      N(
        'Ele a vê, hesita, e parece decidir não se aproximar sem um sinal seu.',
        all(has('silencio'), not('disseAindaNao')),
      ),
      N('Ele ainda não a viu.', all(not('silencio'), not('disseAindaNao'))),
    ],
    choices: [
      { id: 'ir', label: 'Ir até ele.', add: { proximidade: 1 }, to: 'galeria_aproxima' },
      { id: 'esperar', label: 'Esperar e ver o que ele faz.', to: 'galeria_espera' },
      { id: 'sair', label: 'Ir embora antes de qualquer conversa.', add: { clareza: 1 }, to: 'galeria_sai' },
    ],
  },

  galeria_espera: {
    id: 'galeria_espera',
    chapter: 2,
    place: 'Galeria',
    time: 'Sábado, 19h20',
    backdrop: 'galeria',
    lines: [
      N(
        'Os minutos passam. Teo continua diante da fotografia e só olha na sua direção uma vez. Ele não vai atravessar a sala — não sem que você queira.',
        any(has('disseAindaNao'), has('silencio')),
      ),
      N(
        'Teo se vira, a vê e, depois de um instante, atravessa a sala devagar.',
        all(not('disseAindaNao'), not('silencio')),
      ),
      T('Oi. Eu não sabia se você viria.', all(not('disseAindaNao'), not('silencio'))),
    ],
    choices: [
      {
        id: 'cumprimentar',
        label: 'Cumprimentá-lo.',
        if: all(not('disseAindaNao'), not('silencio')),
        to: 'galeria_conversa',
      },
      {
        id: 'ir',
        label: 'Ir até ele, afinal.',
        if: any(has('disseAindaNao'), has('silencio')),
        to: 'galeria_aproxima',
      },
      { id: 'sair', label: 'Ir embora sem falar com ele.', add: { clareza: 1 }, to: 'galeria_sai' },
    ],
  },

  galeria_aproxima: {
    id: 'galeria_aproxima',
    chapter: 2,
    place: 'Galeria',
    time: 'Sábado, 19h25',
    backdrop: 'galeria',
    lines: [
      N('Você atravessa a sala. Ele percebe a sua presença antes de vê-la — os ombros mudam primeiro.'),
      T('Oi.'),
      T('Não quis me aproximar. Você tinha dito “ainda não”, e eu levei a sério.', has('disseAindaNao')),
      T(
        'Não sabia se devia vir falar com você. Imaginei que o silêncio fosse uma resposta.',
        all(has('silencio'), not('disseAindaNao')),
      ),
      T('Eu não sabia se você viria.', all(not('silencio'), not('disseAindaNao'))),
    ],
    next: 'galeria_conversa',
  },

  galeria_conversa: {
    id: 'galeria_conversa',
    chapter: 2,
    place: 'Galeria, terceira sala',
    time: 'Sábado, 19h30',
    backdrop: 'galeria',
    onEnter: { set: ['encontroAcaso'] },
    lines: [
      N(
        'Vocês olham juntos para a fotografia: uma janela acesa, uma mulher de costas, uma xícara esquecida no parapeito.',
      ),
      T(
        'A Lia sempre fotografa as pessoas de costas. Uma vez ela me disse que é o único jeito de não decidir por elas o que estão sentindo.',
      ),
      N('O comentário fica no ar um pouco mais do que deveria.'),
      T('Quer caminhar um pouco? Está abafado aqui dentro. Se preferir ficar, eu entendo.'),
    ],
    choices: [
      { id: 'caminhar', label: 'Aceitar a caminhada.', set: ['caminhou'], to: 'caminhada' },
      {
        id: 'aqui',
        label: '“Prefiro conversar aqui mesmo, por alguns minutos.”',
        add: { clareza: 1 },
        set: ['estabeleceuLimite'],
        to: 'conversa',
      },
      { id: 'hoje-nao', label: '“Hoje não. Mas foi bom te ver.”', to: 'galeria_sai_gentil' },
    ],
  },

  galeria_sai: {
    id: 'galeria_sai',
    chapter: 2,
    place: 'Rua',
    time: 'Sábado, 19h40',
    backdrop: 'rua',
    lines: [
      N('Você deixa a taça numa mesa lateral e sai em silêncio, como quem não quer interromper nada.'),
      N('Na rua, o ar está frio e limpo. Você caminha sem pressa até a esquina, depois até a seguinte.'),
      P('Não é fuga. É só que, hoje, a pessoa com quem você precisa conversar é você mesma.'),
      N('Em casa, o e-mail de Lisboa continua aberto.'),
    ],
    choices: [
      { id: 'aceitar', label: 'Aceitar a residência.', set: ['vaiAceitar'], add: { clareza: 1 }, to: 'fim_proprio' },
      { id: 'fechar', label: 'Fechar o computador e deixar as decisões para outro dia.', to: 'fim_noite' },
    ],
  },

  galeria_sai_gentil: {
    id: 'galeria_sai_gentil',
    chapter: 2,
    place: 'Galeria',
    time: 'Sábado, 19h35',
    backdrop: 'galeria',
    lines: [
      T('Foi bom te ver também. De verdade.'),
      N('Ele não pede para marcar nada, não pergunta quando. Apenas sorri — um sorriso sem cobrança.'),
      N('Você volta para casa a pé. No caminho, percebe que o encontro durou quatro minutos e ocupou a noite inteira.'),
    ],
    choices: [
      {
        id: 'escrever',
        label: 'Escrever para ele, dias depois, propondo um café.',
        add: { proximidade: 1 },
        set: ['aceitouCafe', 'pediuTempo'],
        to: 'cafe',
      },
      { id: 'bastar', label: 'Deixar que esse encontro baste.', set: ['deixouBastar'], to: 'fim_paz' },
    ],
  },

  cafe: {
    id: 'cafe',
    chapter: 2,
    place: 'Café Aurora',
    time: (s) => (s.flags.pediuTempo ? 'Sábado, 10h' : 'Quarta-feira, 18h'),
    backdrop: 'cafe',
    lines: [
      N(
        'O Café Aurora tem mesas pequenas demais e janelas grandes demais. Você chega cinco minutos atrasada, de propósito.',
      ),
      N('Teo já está lá. Dois cardápios fechados sobre a mesa, um copo d’água intocado.'),
      T('Oi. Obrigado por vir.'),
      T('E obrigado pelos dias. Acho que eu também precisava deles.', has('pediuTempo')),
      N(
        'Ele parece o mesmo e não parece. Talvez seja o cabelo mais curto. Talvez seja o jeito de esperar que você fale primeiro.',
      ),
    ],
    choices: [
      {
        id: 'trivial',
        label: 'Começar pelo trivial: o livro, o trabalho, a cidade.',
        add: { proximidade: 1 },
        to: 'cafe_trivial',
      },
      { id: 'direto', label: 'Ir direto ao assunto.', add: { clareza: 1 }, to: 'conversa' },
      { id: 'como', label: 'Perguntar como ele está — de verdade.', add: { confianca: 1 }, to: 'cafe_como_esta' },
    ],
  },

  cafe_trivial: {
    id: 'cafe_trivial',
    chapter: 2,
    place: 'Café Aurora',
    time: (s) => (s.flags.pediuTempo ? 'Sábado, 10h20' : 'Quarta-feira, 18h20'),
    backdrop: 'cafe',
    onEnter: { set: ['humor'] },
    lines: [
      N(
        'Vocês falam do livro de capa cinza, que nenhum dos dois leu. Da obra que interditou a rua dele. Do gato da vizinha, que aprendeu a abrir janelas.',
      ),
      N('Em algum momento você ri — uma risada curta, involuntária — e ele ri também, aliviado.'),
      N('Mas o assunto verdadeiro continua sentado à mesa, esperando a vez.'),
      T('Posso dizer uma coisa que eu preparei? Prometo que é curta.'),
    ],
    choices: [
      { id: 'pode', label: '“Pode.”', to: 'conversa' },
      {
        id: 'comum',
        label: '“Hoje eu queria só isto: um café comum. Pode ser?”',
        add: { clareza: 1 },
        set: ['estabeleceuLimite'],
        to: 'cafe_comum',
      },
    ],
  },

  cafe_comum: {
    id: 'cafe_comum',
    chapter: 2,
    place: 'Café Aurora',
    time: (s) => (s.flags.pediuTempo ? 'Sábado, 11h' : 'Quarta-feira, 19h'),
    backdrop: 'cafe',
    lines: [
      T('Pode. Claro que pode.'),
      N(
        'E é. Um café comum, com pausas e assuntos pequenos. Ele não tenta encaixar o discurso preparado em nenhuma brecha.',
      ),
      T('Se em algum momento você quiser continuar — este ou outro assunto —, me avise.'),
    ],
    next: 'proposta',
  },

  cafe_como_esta: {
    id: 'cafe_como_esta',
    chapter: 2,
    place: 'Café Aurora',
    time: (s) => (s.flags.pediuTempo ? 'Sábado, 10h15' : 'Quarta-feira, 18h15'),
    backdrop: 'cafe',
    onEnter: { set: ['sabeDaTerapia'] },
    lines: [
      V('Como você está? Não a resposta educada.'),
      N('Ele demora. Gira o copo d’água sobre a mesa.'),
      T('Melhor do que em junho. Pior do que eu gostaria de admitir.'),
      T(
        'Comecei terapia em agosto. Não por sua causa — quer dizer, também, mas não só. Percebi que eu brigava como quem precisa vencer, mesmo quando não havia nada para ganhar.',
      ),
    ],
    choices: [
      { id: 'pratica', label: '“E o que mudou, na prática?”', set: ['perguntouMudanca'], to: 'perguntar_mudanca' },
      { id: 'feliz', label: '“Fico feliz por você. De verdade.”', add: { proximidade: 1 }, to: 'conversa' },
    ],
  },

  caminhada: {
    id: 'caminhada',
    chapter: 2,
    place: 'A caminho do rio',
    time: 'Sábado, 19h50',
    backdrop: 'rua',
    lines: [
      N(
        'Vocês descem a rua em direção ao rio. As calçadas ainda estão molhadas e refletem os postes em manchas alongadas.',
      ),
      N('Durante uma quadra inteira, ninguém fala. Não é desconfortável — é só cuidadoso.'),
      T('Eu ensaiei várias coisas para dizer, se te encontrasse. Agora nenhuma parece adequada.'),
    ],
    next: 'conversa',
  },

  /* =================================================================
     III — A CONVERSA
  ================================================================= */
  conversa: {
    id: 'conversa',
    chapter: 3,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    lines: [
      T(
        'Eu queria te pedir desculpas. Não do jeito de antes — aquele jeito que já vinha com uma explicação grudada no final.',
      ),
      T(
        'Só desculpas. Pelo modo como eu reagia quando você dizia que algo doía. Por transformar conversas em disputas sobre quem tinha razão.',
      ),
      N('Ele para. Não acrescenta nenhum “mas”.'),
    ],
    choices: [
      {
        id: 'doeu',
        label: 'Dizer o que doeu, com as suas palavras.',
        add: { clareza: 1 },
        set: ['falouDoPassado'],
        to: 'dizer_doeu',
      },
      {
        id: 'entendeu',
        label: 'Perguntar o que ele entendeu desde então.',
        if: not('perguntouMudanca'),
        set: ['perguntouMudanca'],
        to: 'perguntar_mudanca',
      },
      {
        id: 'limite',
        label: '“Não quero revisitar tudo hoje.”',
        add: { clareza: 1 },
        set: ['estabeleceuLimite'],
        to: 'limite',
      },
      {
        id: 'culpa',
        label: '“Você está aqui por culpa ou por vontade?”',
        if: has('perguntouPorQue'),
        locked: 'Uma pergunta que depende de algo perguntado antes.',
        add: { confianca: 1 },
        to: 'culpa_ou_vontade',
      },
    ],
  },

  dizer_doeu: {
    id: 'dizer_doeu',
    chapter: 3,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    lines: [P('Você poderia dizer muitas coisas. Escolhe uma.')],
    choices: [
      { id: 'escuta', label: '“Eu falava e você já estava respondendo.”', set: ['doeuEscuta'], to: 'doeu_resposta' },
      {
        id: 'silencio',
        label: '“Depois das brigas, o seu silêncio parecia um castigo.”',
        set: ['doeuSilencio'],
        to: 'doeu_resposta',
      },
      {
        id: 'insistir',
        label: '“Eu precisava insistir para ser levada a sério.”',
        set: ['doeuInsistir'],
        to: 'doeu_resposta',
      },
    ],
  },

  doeu_resposta: {
    id: 'doeu_resposta',
    chapter: 3,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    onEnter: { add: { confianca: 1 } },
    lines: [
      V(
        'Eu falava e você já estava respondendo. Às vezes eu nem terminava a frase. Eu me sentia uma interrupção na sua própria conversa.',
        has('doeuEscuta'),
      ),
      V(
        'Depois das brigas, você ficava em silêncio por dias. Eu nunca sabia se era tristeza, orgulho ou castigo. E acabava pedindo desculpas por coisas que nem eram minhas.',
        has('doeuSilencio'),
      ),
      V(
        'Eu precisava dizer a mesma coisa três, quatro vezes, cada vez mais alto, até você levar a sério. E depois parecia que o problema era o tom, não o que eu estava dizendo.',
        has('doeuInsistir'),
      ),
      N(
        'Teo escuta. Você vê o impulso de responder subir e, pela primeira vez, vê também ele decidir não obedecer a esse impulso.',
      ),
      T(
        'Você tem razão. Eu ouvia para responder, não para entender. É uma das coisas que mais tenho tentado mudar — e ainda erro.',
        has('doeuEscuta'),
      ),
      T(
        'Eu chamava aquilo de “esfriar a cabeça”. Mas sei que, do seu lado, parecia abandono. E, de certo modo, era.',
        has('doeuSilencio'),
      ),
      T(
        'E eu ainda reclamava do tom. Desculpa. A sua voz subia porque eu não escutava quando ela estava baixa.',
        has('doeuInsistir'),
      ),
      T('Obrigado por me dizer. Sei que você não tinha obrigação nenhuma de fazer isso.'),
    ],
    next: 'virada',
  },

  perguntar_mudanca: {
    id: 'perguntar_mudanca',
    chapter: 3,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    onEnter: { add: { confianca: 1 } },
    lines: [
      V('E o que você entendeu, desde então? Não o que você sente. O que você entendeu.'),
      T(
        'Que eu tratava discordância como ameaça. Que eu precisava estar certo para me sentir seguro. A terapia não resolveu isso, mas me ensinou a perceber quando está acontecendo.',
        has('sabeDaTerapia'),
      ),
      T(
        'Que eu tratava cada discordância como ameaça. Que precisar ter razão era uma forma de não ter que escutar. Ainda faço isso às vezes — mas agora percebo, e paro.',
        not('sabeDaTerapia'),
      ),
      T(
        'Não vou te prometer que mudei. Isso você só saberia vendo, com o tempo. Posso te dizer o que estou fazendo para mudar.',
      ),
    ],
    choices: [
      { id: 'diga', label: '“Então me diga.”', add: { confianca: 1 }, to: 'teo_concreto' },
      {
        id: 'promessas',
        label: '“Promessas eu já ouvi. Prefiro não ouvir mais nenhuma hoje.”',
        add: { clareza: 1 },
        set: ['ceticismo'],
        to: 'virada',
      },
    ],
  },

  teo_concreto: {
    id: 'teo_concreto',
    chapter: 3,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    lines: [
      T(
        'Quando sinto que estou ficando na defensiva, digo isso em voz alta, em vez de atacar. Parece bobo, mas funciona.',
      ),
      T('Quando alguém diz que eu magoei, espero até o fim antes de responder. Conto até cinco, literalmente.'),
      T('E, quando quero ter razão, me pergunto: razão para quê?'),
      N('Ele não sorri ao dizer isso. Soa mais como um inventário do que como uma propaganda.'),
    ],
    next: 'virada',
  },

  limite: {
    id: 'limite',
    chapter: 3,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    onEnter: { add: { proximidade: 1 } },
    lines: [
      V(
        'Não quero revisitar tudo hoje. Vim para ver se conseguia estar perto de você sem que doesse. Por enquanto, é só isso.',
      ),
      T('Tudo bem. Você decide o ritmo — é o mínimo.'),
      N(
        'Ele muda de assunto com uma delicadeza que você não lembrava. Falam de Lia, das fotografias, de uma viagem que ele cancelou.',
      ),
    ],
    next: 'virada',
  },

  culpa_ou_vontade: {
    id: 'culpa_ou_vontade',
    chapter: 3,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    lines: [
      V('Você está aqui por culpa ou por vontade?'),
      N('Ele não responde de imediato. Você aprecia que ele não responda de imediato.'),
      T(
        'As duas coisas, no começo. A culpa me fez pensar em você todos os dias. Mas a culpa se resolveria com um pedido de desculpas por mensagem.',
      ),
      T('A vontade é o que me fez vir, mesmo sabendo que você poderia dizer não. Ou não aparecer.'),
    ],
    next: 'virada',
  },

  virada: {
    id: 'virada',
    chapter: 3,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    lines: [
      N('A conversa encontra um ritmo. E então, num desvio pequeno, aparece uma frase antiga.'),
      T('É que, às vezes, eu sentia que para você eu nunca acertava.'),
      N('Ele mesmo parece ouvir o eco. Fica em silêncio por um segundo.'),
      T('Não. Espera. Não quero dizer isso como defesa. Posso tentar de novo?', atLeast('confianca', 2)),
      N(
        'Ele não retira a frase. Ela fica sobre a mesa, entre os dois, como um objeto que ninguém quer pegar.',
        (s) => s.vars.confianca < 2,
      ),
    ],
    choices: [
      {
        id: 'ouvir',
        label: '“Pode. Eu quero ouvir o seu lado também.”',
        add: { proximidade: 1 },
        set: ['ouviuTeo'],
        to: 'ouvir_teo',
      },
      { id: 'justificativa', label: '“Isso soa como uma justificativa.”', to: 'apontar' },
      {
        id: 'hoje-nao',
        label: '“Hoje não. Hoje eu precisava que fosse sobre o que eu vim dizer.”',
        if: any(has('falouDoPassado'), has('estabeleceuLimite')),
        locked: 'Uma resposta que pedia algo dito antes, nesta conversa.',
        add: { clareza: 1 },
        to: 'firmeza',
      },
    ],
  },

  ouvir_teo: {
    id: 'ouvir_teo',
    chapter: 3,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    lines: [
      T(
        'Eu sentia que precisava acertar sempre — e, quando errava, parecia o fim do mundo. Isso não era culpa sua. Era o meu medo de não ser suficiente, vestido de orgulho.',
        atLeast('confianca', 2),
      ),
      T(
        'Eu me sentia cobrado o tempo todo. Hoje sei que boa parte da cobrança era minha mesmo. Mas também era cansativo, para nós dois, que tudo virasse uma prova.',
        (s) => s.vars.confianca < 2,
      ),
      N('Você reconhece alguma verdade naquilo. Não toda. Alguma.'),
    ],
    choices: [
      {
        id: 'tambem',
        label: '“Eu também cobrava. Talvez as duas coisas sejam verdade.”',
        add: { confianca: 1 },
        set: ['mutuo'],
        to: 'proposta',
      },
      { id: 'sua-parte', label: '“Entendo. Mas não vou carregar a sua parte.”', add: { clareza: 1 }, to: 'proposta' },
    ],
  },

  apontar: {
    id: 'apontar',
    chapter: 3,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    lines: [
      V('Isso soa como uma justificativa.'),
      T('Você tem razão. Desculpa — esquece o “mas”. Era o velho reflexo.', atLeast('confianca', 2)),
      N('Ele não se ofende. Reconhece, e isso basta para que o ar volte à mesa.', atLeast('confianca', 2)),
      T('Não é justificativa. É só que…', (s) => s.vars.confianca < 2),
      N(
        'Ele para no meio da frase, respira e não termina. O silêncio que fica é mais pesado do que o de antes.',
        (s) => s.vars.confianca < 2,
      ),
    ],
    next: (s) => (s.vars.confianca >= 2 ? 'apontar_reconhece' : 'apontar_tensao'),
  },

  // Cenas de passagem: registram a consequência e seguem adiante.
  apontar_reconhece: {
    id: 'apontar_reconhece',
    chapter: 3,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    onEnter: { set: ['eleReconheceu'], add: { confianca: 1 } },
    lines: [N('Vocês ficam um momento em silêncio. Um silêncio de outro tipo — o de quem não precisa preencher nada.')],
    next: 'proposta',
  },

  apontar_tensao: {
    id: 'apontar_tensao',
    chapter: 3,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    onEnter: { set: ['tensao'] },
    lines: [N('Alguma coisa se fecha, discretamente. Não é uma briga. É a lembrança de como as brigas começavam.')],
    next: 'proposta',
  },

  firmeza: {
    id: 'firmeza',
    chapter: 3,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    onEnter: { set: ['eleReconheceu'], add: { confianca: 1 } },
    lines: [
      V('Hoje não. Hoje eu precisava que fosse sobre o que eu vim dizer.'),
      T('Justo. Muito justo.'),
      N('Ele guarda a frase de volta, seja lá onde a guardava. Desta vez, ela não vira briga — vira pausa.'),
    ],
    next: 'proposta',
  },

  /* =================================================================
     IV — O QUE É SEU
  ================================================================= */
  proposta: {
    id: 'proposta',
    chapter: 4,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    lines: [
      N('Em algum momento, ele pergunta o que você tem feito. A resposta honesta inclui Lisboa.'),
      P('Você já escreveu à coordenação. Já começou a imaginar o ateliê perto do rio.', has('cuidouDeLisboa')),
      P('Você prometeu a Lia decidir Lisboa pensando em Lisboa.', has('prometeuLia')),
    ],
    choices: [
      { id: 'contar', label: 'Contar a ele sobre a residência.', set: ['contouResidencia'], to: 'contar' },
      { id: 'guardar', label: 'Guardar isso para si, por enquanto.', add: { clareza: 1 }, to: 'guardar' },
    ],
  },

  contar: {
    id: 'contar',
    chapter: 4,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    lines: [
      V('Recebi uma proposta. Uma residência de seis meses em Lisboa. Começa em janeiro.'),
      N('Ele desvia o olhar para a janela. Você conhece esse movimento.', has('tensao')),
      T('Seis meses. Então talvez não faça sentido começar nada agora.', has('tensao')),
      N(
        'Por um instante, algo atravessa o rosto dele — e logo depois outra coisa, que parece genuinamente alegria.',
        not('tensao'),
      ),
      T('Lisboa. Isso é enorme. Você vai aceitar?', not('tensao')),
    ],
    choices: [
      { id: 'vou', label: '“Vou aceitar.”', add: { clareza: 1 }, set: ['vaiAceitar'], to: 'contar_aceita' },
      { id: 'decidindo', label: '“Ainda estou decidindo.”', to: 'contar_decidindo' },
      {
        id: 'recusar',
        label: '“Talvez eu recuse. Não sei se é o momento.”',
        set: ['pensouRecusar'],
        to: 'contar_recusa',
      },
    ],
  },

  contar_aceita: {
    id: 'contar_aceita',
    chapter: 4,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    onEnter: { add: { confianca: 1 } },
    lines: [
      T('Claro. Faz sentido.', has('tensao')),
      N('A frase é correta e fria, e vocês dois sabem disso. Ele respira e tenta de novo.', has('tensao')),
      T(
        'Desculpa. É uma notícia boa. Eu reagi como quem perde alguma coisa — e não tenho esse direito.',
        has('tensao'),
      ),
      T('Que bom. Que bom mesmo. Você fala em fazer algo assim desde que eu te conheço.', not('tensao')),
      T('Só não aceite nem recuse nada por minha causa. Isso eu quero deixar claro.'),
    ],
    next: 'despedida',
  },

  contar_decidindo: {
    id: 'contar_decidindo',
    chapter: 4,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    onEnter: { add: { confianca: 1 } },
    lines: [
      T('Posso dizer uma coisa, mesmo sem ter direito a opinião?'),
      T(
        'Não decida por causa de mim. Nem a favor, nem contra. Seria o pior jeito de recomeçar qualquer coisa — se é que haveria alguma coisa a recomeçar.',
      ),
    ],
    next: 'despedida',
  },

  contar_recusa: {
    id: 'contar_recusa',
    chapter: 4,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    onEnter: { add: { confianca: 1 } },
    lines: [
      T('Por causa do momento — ou por causa disto aqui?'),
      N('Ele indica, meio sem jeito, o espaço entre vocês dois.'),
      T(
        'Se for por isto, por favor, não. Não quero ser o motivo de você abrir mão de algo que é seu. Já fui motivo de coisas demais.',
        not('tensao'),
      ),
      T('Eu não deveria opinar. Mas não quero ser motivo de você abrir mão de nada.', has('tensao')),
    ],
    choices: [
      { id: 'vou', label: '“Você tem razão. Eu vou.”', add: { clareza: 1 }, set: ['vaiAceitar'], to: 'despedida' },
      {
        id: 'minha',
        label: '“A decisão é minha, Teo. Mesmo que seja ficar.”',
        add: { clareza: 1 },
        set: ['decidiuFicar'],
        to: 'despedida',
      },
    ],
  },

  guardar: {
    id: 'guardar',
    chapter: 4,
    place: meetingPlace,
    time: meetingTime,
    backdrop: meetingBackdrop,
    onEnter: { set: ['humor'] },
    lines: [
      P('Lisboa é sua antes de ser assunto. Você responde que tem trabalhado muito, o que também é verdade.'),
      N('Ele não insiste. Conta de uma estante que montou sozinho e que ficou torta, e você ri sem querer.'),
    ],
    next: 'despedida',
  },

  /* =================================================================
     V — O QUE FICA
  ================================================================= */
  despedida: {
    id: 'despedida',
    chapter: 5,
    place: (s) => (s.flags.aceitouCafe ? 'Porta do Café Aurora' : 'Esquina do metrô'),
    time: (s) => (s.flags.aceitouCafe ? (s.flags.pediuTempo ? 'Sábado, 12h' : 'Quarta-feira, 20h') : 'Sábado, 21h30'),
    backdrop: 'rua',
    lines: [
      N('Já é tarde quando vocês se levantam.', has('aceitouCafe')),
      N('Na esquina do metrô, vocês param.', not('aceitouCafe')),
      N('Há aquele momento conhecido em que alguém precisa dizer alguma coisa — ou deixar que o silêncio diga.'),
      T(
        'Eu gostaria de te ver de novo. Mas só se você também quiser — e você não precisa saber agora.',
        all(atLeast('confianca', 3), any(not('tensao'), has('eleReconheceu'))),
      ),
      T(
        'Acho que eu ainda tenho coisas para arrumar por dentro. Obrigado por ter vindo, mesmo assim.',
        all(has('tensao'), not('eleReconheceu')),
      ),
      T(
        'Obrigado por hoje. Foi mais do que eu esperava.',
        all((s) => s.vars.confianca < 3, any(not('tensao'), has('eleReconheceu'))),
      ),
    ],
    choices: [
      {
        id: 'recomeco',
        label: 'Propor um novo encontro, sem pressa.',
        if: all(atLeast('confianca', 3), any(not('tensao'), has('eleReconheceu')), not('vaiAceitar')),
        locked:
          'Um passo que dependeria de mais confiança construída nesta conversa — ou de outra decisão sobre Lisboa.',
        to: 'fim_recomeco',
      },
      {
        id: 'cartas',
        label: '“Vou para Lisboa. Podemos nos escrever, sem promessas.”',
        if: all(has('vaiAceitar'), has('contouResidencia'), atLeast('confianca', 2)),
        locked: 'Uma possibilidade que dependeria de Lisboa ter sido dita — e decidida.',
        to: 'fim_distancia',
      },
      {
        id: 'prazer',
        label: 'Estender a mão: “Muito prazer.”',
        if: all(has('estabeleceuLimite'), has('humor'), atLeast('proximidade', 2)),
        locked: 'Um começo diferente, que dependeria de outros gestos ao longo do caminho.',
        to: 'fim_prazer',
      },
      { id: 'paz', label: '“Foi bom te ver. Acho que é aqui que a gente se despede.”', to: 'fim_paz' },
      { id: 'tempo', label: '“Preciso de tempo. Eu te procuro, se for o caso.”', to: 'fim_aberta' },
      {
        id: 'sozinha',
        label: 'Seguir sozinha: Lisboa primeiro, o resto depois.',
        if: any(has('vaiAceitar'), not('contouResidencia')),
        set: ['vaiAceitar'],
        to: 'fim_proprio',
      },
    ],
  },

  fim_recomeco: {
    id: 'fim_recomeco',
    chapter: 5,
    place: 'Rua',
    time: 'Depois',
    backdrop: 'rua',
    ending: 'recomeco',
    lines: [
      V('Eu também gostaria. Sem pressa. Um café de cada vez.'),
      T('Um café de cada vez.'),
      N(
        'Vocês não se abraçam. Ainda não. Mas, ao se afastar, você olha para trás uma vez — e ele também está olhando.',
      ),
      N('Nada foi resolvido. Alguma coisa, no entanto, começou a ser possível.'),
    ],
  },

  fim_distancia: {
    id: 'fim_distancia',
    chapter: 5,
    place: 'Lisboa',
    time: 'Fevereiro',
    backdrop: 'cartas',
    ending: 'distancia',
    lines: [
      V('Vou para Lisboa em janeiro. Podemos nos escrever — cartas, se você tiver paciência. Sem promessas.'),
      T('Tenho paciência. Aprendi a ter, pelo menos um pouco.'),
      N('Em fevereiro chega a primeira carta: duas páginas sobre o inverno, nenhuma pergunta sobre o futuro.'),
      N(
        'Você responde de uma mesa perto do rio, com a janela aberta. Escreve sobre o ateliê, sobre a luz, sobre você. Ele aparece só no fim, numa linha. Parece a proporção certa.',
      ),
    ],
  },

  fim_paz: {
    id: 'fim_paz',
    chapter: 5,
    place: 'Rua',
    time: (s) => (s.flags.deixouBastar ? 'Semanas depois' : 'Depois'),
    backdrop: 'rua',
    ending: 'paz',
    lines: [
      V('Foi bom te ver. Acho que é aqui que a gente se despede.', not('deixouBastar')),
      T('Eu entendo. E fico feliz que tenha sido assim — sem briga, sem porta batida.', not('deixouBastar')),
      N('Ele segue a pé. Você fica mais um pouco, olhando a rua.', not('deixouBastar')),
      N(
        'Você não escreve. Não por orgulho, nem por medo — apenas porque aquele encontro, curto e gentil, disse o que precisava ser dito.',
        has('deixouBastar'),
      ),
      N(
        'Semanas depois, vocês se cruzam de longe numa rua do centro. Um aceno de cada lado. Ninguém atravessa, e está tudo certo.',
        has('deixouBastar'),
      ),
      N(
        'Há coisas que terminam mal e coisas que terminam bem. Esta terminou inteira — e isso, você descobre, também é uma forma de cuidado.',
      ),
    ],
  },

  fim_aberta: {
    id: 'fim_aberta',
    chapter: 5,
    place: 'Casa',
    time: 'Mais tarde',
    backdrop: 'casa-noite',
    ending: 'aberta',
    lines: [
      V('Preciso de tempo. Eu te procuro, se for o caso.'),
      T('Se for o caso, estarei aqui. Se não for, tudo bem também.'),
      N('Nenhuma data marcada. Nenhuma porta fechada.'),
      N('Em casa, você deixa o celular na sala e vai ler na cama. Desta vez, passa da página em que estava.'),
    ],
  },

  fim_prazer: {
    id: 'fim_prazer',
    chapter: 5,
    place: 'Rua',
    time: 'Depois',
    backdrop: 'rua',
    ending: 'prazer',
    lines: [
      N('Você estende a mão, meio séria, meio rindo.'),
      V('Muito prazer. Eu sou eu, agora. Talvez você não me conheça tão bem quanto pensa.'),
      N('Ele entende a brincadeira — e o que não é brincadeira nela. Aperta a sua mão com cerimônia.'),
      T('Muito prazer. Eu também estou tentando ser outra versão de mim. Ainda em obras.'),
      N(
        'Vocês combinam um café, como dois desconhecidos que simpatizaram um com o outro. Talvez seja exatamente isso o que precisavam ser.',
      ),
    ],
  },

  fim_proprio: {
    id: 'fim_proprio',
    chapter: 5,
    place: 'Lisboa',
    time: 'Janeiro',
    backdrop: 'lisboa',
    ending: 'proprio',
    lines: [
      N('Em casa, você responde ao e-mail. Duas linhas: “Aceito. Nos vemos em janeiro.”'),
      N(
        'Em janeiro, o avião atravessa uma noite inteira de nuvens. Você não sabe ainda o que fará com tudo o que ficou para trás — e descobre que não precisa saber agora.',
      ),
      N(
        'Lisboa a recebe com uma luz que você nunca tinha visto. Algumas escolhas não são contra ninguém. São apenas suas.',
      ),
    ],
  },

  fim_noite: {
    id: 'fim_noite',
    chapter: 5,
    place: 'Casa',
    time: 'Sábado, 22h',
    backdrop: 'casa-noite',
    ending: 'noite',
    lines: [
      N('Você fecha o computador. Prepara um chá, coloca uma música baixa, abre o livro.'),
      N('Não decidiu nada sobre Teo, nem sobre Lisboa. E, pela primeira vez em dias, isso não parece um problema.'),
      P('Algumas noites não servem para decidir. Servem para lembrar quem decide.'),
    ],
  },
};

export const endings: Ending[] = [
  { id: 'recomeco', title: 'Recomeço sem pressa', note: 'Um café de cada vez.' },
  { id: 'distancia', title: 'Seis meses e algumas cartas', note: 'A distância como espaço, não como fim.' },
  { id: 'paz', title: 'Um encerramento em paz', note: 'Algo que terminou inteiro.' },
  { id: 'aberta', title: 'Uma conversa ainda aberta', note: 'Nenhuma porta fechada.' },
  { id: 'prazer', title: 'Muito prazer', note: 'Começar de novo, como desconhecidos.' },
  { id: 'proprio', title: 'O próprio caminho', note: 'Uma escolha que não é contra ninguém.' },
  { id: 'noite', title: 'Uma noite só sua', note: 'Nada decidido — e tudo bem.' },
];
