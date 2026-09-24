import { GameRoom } from './types';

export const GAME_ROOMS: Record<string, GameRoom> = {
  // ==========================================
  // REGIÃO 1: VILA DE LUMEN (4 FASES)
  // ==========================================

  // Fase 1: Vila de Lumen · Santuário do Repouso
  room_lumen_haven: {
    id: 'room_lumen_haven',
    regionId: 'lumen_village',
    name: 'Fase 1 · Vila de Lumen (Santuário)',
    width: 1400,
    height: 700,
    spawns: {
      default: { x: 200, y: 520 },
      from_crossroads: { x: 1300, y: 520 },
      from_rooftops: { x: 600, y: 150 },
    },
    platforms: [
      { x: 0, y: 600, width: 1400, height: 100, type: 'solid' },
      { x: -50, y: 0, width: 50, height: 700, type: 'solid' },
      { x: 0, y: -50, width: 1400, height: 50, type: 'solid' },
      { x: 160, y: 460, width: 220, height: 20, type: 'solid' },
      { x: 480, y: 400, width: 240, height: 20, type: 'solid' },
      { x: 800, y: 480, width: 200, height: 20, type: 'solid' },
      { x: 1050, y: 340, width: 180, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'right',
        rect: { x: 1380, y: 450, width: 30, height: 150 },
        targetRoomId: 'room_lumen_crossroads',
        targetSpawn: { x: 80, y: 720 },
      },
      {
        side: 'top',
        rect: { x: 480, y: 0, width: 240, height: 30 },
        targetRoomId: 'room_lumen_rooftops',
        targetSpawn: { x: 400, y: 650 },
      },
    ],
    enemies: [],
    tablets: [
      {
        id: 'tab_lumen_1',
        x: 340,
        y: 560,
        title: 'Monólito da Vigília',
        text: '“Quando O Silêncio devorou as palavras de Echoward, apenas as cinzas guardaram o tom da nossa canção. Não busque o céu, pequeno andarilho; as respostas repousam onde a luz não ousa tocar.”',
        author: 'Escriba de Lumen',
      },
    ],
    totems: [
      {
        id: 'totem_lumen',
        x: 180,
        y: 540,
        name: 'Totem do Repouso de Lumen',
        activated: true,
      },
    ],
    npcs: [
      {
        id: 'npc_elion',
        name: 'Elion, o Guardião de Retalhos',
        title: 'Costureiro de Memórias',
        x: 540,
        y: 530,
        portraitIcon: '🪡',
        interacted: false,
        dialogue: [
          'Ah... uma nova máscara desperta sobre o leito de cinzas.',
          'Você carrega a Lâmina de Eco, pequeno Nox. Há séculos não via um de vocês.',
          'O reino possui 19 fases e 3 grandes chefões corrompidos pelas cinzas.',
          'No leste fica o Bosque do Eco, abaixo as Minas de Varron e mais ao fundo a Catedral e o Abismo.',
          'Lembre-se: concentre o seu Pulso segurando [F] ou [E] para restaurar as trincas de sua máscara.',
        ],
      },
    ],
    collectibles: [],
  },

  // Fase 2: Encruzilhada dos Peregrinos
  room_lumen_crossroads: {
    id: 'room_lumen_crossroads',
    regionId: 'lumen_village',
    name: 'Fase 2 · Encruzilhada dos Peregrinos',
    width: 1600,
    height: 900,
    spawns: {
      default: { x: 80, y: 720 },
      from_haven: { x: 80, y: 720 },
      from_forest: { x: 1500, y: 720 },
      from_catacombs: { x: 800, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1600, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 1560, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 200, y: 680, width: 180, height: 20, type: 'solid' },
      { x: 440, y: 560, width: 220, height: 20, type: 'solid' },
      { x: 740, y: 440, width: 160, height: 20, type: 'fragile' },
      { x: 960, y: 540, width: 200, height: 20, type: 'solid' },
      { x: 1240, y: 660, width: 180, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 30, height: 150 },
        targetRoomId: 'room_lumen_haven',
        targetSpawn: { x: 1300, y: 520 },
      },
      {
        side: 'right',
        rect: { x: 1570, y: 650, width: 30, height: 150 },
        targetRoomId: 'room_echo_entrance',
        targetSpawn: { x: 80, y: 720 },
      },
      {
        side: 'bottom',
        rect: { x: 700, y: 850, width: 200, height: 50 },
        targetRoomId: 'room_lumen_catacombs',
        targetSpawn: { x: 700, y: 100 },
      },
    ],
    enemies: [
      { id: 'en_cross_1', type: 'crawler', x: 500, y: 760, patrolDist: 180 },
      { id: 'en_cross_2', type: 'crawler', x: 1100, y: 760, patrolDist: 200 },
      { id: 'en_cross_3', type: 'specter', x: 800, y: 380, patrolDist: 140 },
    ],
    tablets: [
      {
        id: 'tab_crossroads',
        x: 1000,
        y: 760,
        title: 'Encruzilhada dos Peregrinos',
        text: '“À direita estende-se o Bosque dos Ecos. Abaixo repousam as Catacumbas Esquecidas que levam às Minas de Varron.”',
        author: 'Placa dos Peregrinos',
      },
    ],
    totems: [],
    npcs: [],
    collectibles: [],
  },

  // Fase 3: Telhados de Cinzas de Lumen
  room_lumen_rooftops: {
    id: 'room_lumen_rooftops',
    regionId: 'lumen_village',
    name: 'Fase 3 · Telhados de Cinzas de Lumen',
    width: 1400,
    height: 800,
    spawns: {
      default: { x: 400, y: 650 },
      from_haven: { x: 400, y: 650 },
    },
    platforms: [
      { x: 0, y: 750, width: 1400, height: 50, type: 'solid' },
      { x: 100, y: 600, width: 250, height: 20, type: 'solid' },
      { x: 450, y: 500, width: 220, height: 20, type: 'solid' },
      { x: 780, y: 400, width: 260, height: 20, type: 'solid' },
      { x: 1100, y: 300, width: 200, height: 20, type: 'solid' },
      { x: 600, y: 220, width: 180, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'bottom',
        rect: { x: 300, y: 760, width: 300, height: 40 },
        targetRoomId: 'room_lumen_haven',
        targetSpawn: { x: 500, y: 350 },
      },
    ],
    enemies: [
      { id: 'en_roof_1', type: 'specter', x: 550, y: 440, patrolDist: 150 },
      { id: 'en_roof_2', type: 'specter', x: 900, y: 340, patrolDist: 160 },
    ],
    tablets: [
      {
        id: 'tab_rooftop',
        x: 650,
        y: 180,
        title: 'Mirante dos Observadores',
        text: '“Do alto dos telhados vê-se a névoa cobrindo as ruínas ancestrais de Echoward.”',
        author: 'Guarda do Santuário',
      },
    ],
    totems: [],
    npcs: [],
    collectibles: [
      {
        id: 'shard_rooftop_1',
        x: 1200,
        y: 250,
        type: 'shard',
        label: 'Fragmento de Eco Puro',
        collected: false,
      },
    ],
  },

  // Fase 4: Cripta Antiga dos Esquecidos
  room_lumen_catacombs: {
    id: 'room_lumen_catacombs',
    regionId: 'lumen_village',
    name: 'Fase 4 · Cripta Antiga dos Esquecidos',
    width: 1500,
    height: 800,
    spawns: {
      default: { x: 700, y: 150 },
      from_crossroads: { x: 700, y: 150 },
      from_varron: { x: 1400, y: 680 },
    },
    platforms: [
      { x: 0, y: 720, width: 1500, height: 80, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 800, type: 'solid' },
      { x: 600, y: 220, width: 250, height: 20, type: 'solid' },
      { x: 300, y: 380, width: 220, height: 20, type: 'solid' },
      { x: 750, y: 480, width: 260, height: 20, type: 'solid' },
      { x: 1100, y: 580, width: 220, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'top',
        rect: { x: 650, y: 0, width: 180, height: 30 },
        targetRoomId: 'room_lumen_crossroads',
        targetSpawn: { x: 800, y: 720 },
      },
      {
        side: 'right',
        rect: { x: 1470, y: 600, width: 30, height: 120 },
        targetRoomId: 'room_varron_descent',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_cata_1', type: 'crawler', x: 400, y: 680, patrolDist: 150 },
      { id: 'en_cata_2', type: 'crawler', x: 950, y: 680, patrolDist: 180 },
      { id: 'en_cata_3', type: 'specter', x: 800, y: 420, patrolDist: 120 },
    ],
    tablets: [
      {
        id: 'tab_catacombs',
        x: 350,
        y: 340,
        title: 'Túmulo dos Primeiros Moldadores',
        text: '“Aqui descansam aqueles que esculpiram o cobre e o silêncio.”',
        author: 'Epitáfio Esquecido',
      },
    ],
    totems: [
      {
        id: 'totem_catacombs',
        x: 180,
        y: 660,
        name: 'Totem da Cripta Esquecida',
        activated: false,
      },
    ],
    npcs: [
      {
        id: 'npc_kael',
        name: 'Kael, o Escriba Cego',
        title: 'Leitor das Cinzas Subterrâneas',
        x: 1150,
        y: 650,
        portraitIcon: '📜',
        interacted: false,
        dialogue: [
          'Ouço passos cautelosos... você não teme a escuridão?',
          'À frente jazem as Minas de Varron. O Colosso Forjado guarda a forja mais profunda!',
          'Derrote os 3 chefões para quebrar o ciclo deste mundo cinzento.',
        ],
      },
    ],
    collectibles: [],
  },

  // ==========================================
  // REGIÃO 2: FLORESTA DOS ECOS (4 FASES)
  // ==========================================

  // Fase 5: Entrada do Bosque Ressonante
  room_echo_entrance: {
    id: 'room_echo_entrance',
    regionId: 'echo_forest',
    name: 'Fase 5 · Entrada do Bosque Ressonante',
    width: 1700,
    height: 850,
    spawns: {
      default: { x: 80, y: 720 },
      from_crossroads: { x: 80, y: 720 },
      from_canopy: { x: 1600, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1700, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 1660, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 260, y: 680, width: 140, height: 24, type: 'bouncy_mushroom' },
      { x: 500, y: 520, width: 180, height: 20, type: 'solid' },
      { x: 780, y: 400, width: 140, height: 24, type: 'bouncy_mushroom' },
      { x: 1020, y: 540, width: 200, height: 20, type: 'solid' },
      { x: 1340, y: 660, width: 180, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_lumen_crossroads',
        targetSpawn: { x: 1500, y: 720 },
      },
      {
        side: 'right',
        rect: { x: 1660, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_echo_canopy',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_forest_1', type: 'specter', x: 540, y: 460, patrolDist: 160 },
      { id: 'en_forest_2', type: 'crawler', x: 850, y: 760, patrolDist: 220 },
      { id: 'en_forest_3', type: 'specter', x: 1200, y: 480, patrolDist: 180 },
    ],
    tablets: [
      {
        id: 'tab_forest_1',
        x: 320,
        y: 760,
        title: 'Cântico das Folhas de Salgueiro',
        text: '“Pule sobre os cogumelos luminescentes e golpeie para baixo [S + C] para ser lançado às alturas!”',
        author: 'Guia Botânico dos Salgueiros',
      },
    ],
    totems: [],
    npcs: [],
    collectibles: [],
  },

  // Fase 6: Copa dos Salgueiros de Eco
  room_echo_canopy: {
    id: 'room_echo_canopy',
    regionId: 'echo_forest',
    name: 'Fase 6 · Copa dos Salgueiros de Eco',
    width: 1800,
    height: 900,
    spawns: {
      default: { x: 80, y: 720 },
      from_entrance: { x: 80, y: 720 },
      from_glade: { x: 1700, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1800, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 1760, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 250, y: 660, width: 200, height: 20, type: 'solid' },
      { x: 520, y: 520, width: 180, height: 20, type: 'solid' },
      { x: 800, y: 400, width: 240, height: 24, type: 'solid' },
      { x: 1140, y: 520, width: 180, height: 20, type: 'solid' },
      { x: 1400, y: 650, width: 220, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_echo_entrance',
        targetSpawn: { x: 1600, y: 720 },
      },
      {
        side: 'right',
        rect: { x: 1760, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_echo_glade',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_canopy_1', type: 'specter', x: 600, y: 460, patrolDist: 150 },
      { id: 'en_canopy_2', type: 'specter', x: 1200, y: 460, patrolDist: 180 },
    ],
    tablets: [],
    totems: [
      {
        id: 'totem_canopy',
        x: 300,
        y: 600,
        name: 'Totem da Copa dos Salgueiros',
        activated: false,
      },
    ],
    npcs: [],
    collectibles: [
      {
        id: 'ability_dash',
        x: 920,
        y: 350,
        type: 'ability',
        abilityName: 'dash',
        label: 'Capa da Sombra Veloz (Investida / Dash)',
        collected: false,
      },
    ],
  },

  // Fase 7: Clareira das Fadas de Cinza
  room_echo_glade: {
    id: 'room_echo_glade',
    regionId: 'echo_forest',
    name: 'Fase 7 · Clareira das Fadas de Cinza',
    width: 1600,
    height: 850,
    spawns: {
      default: { x: 80, y: 720 },
      from_canopy: { x: 80, y: 720 },
      from_depths: { x: 800, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1600, height: 80, type: 'solid' },
      { x: 200, y: 650, width: 180, height: 20, type: 'solid' },
      { x: 480, y: 520, width: 160, height: 20, type: 'fragile' },
      { x: 740, y: 420, width: 200, height: 20, type: 'solid' },
      { x: 1050, y: 530, width: 180, height: 20, type: 'fragile' },
      { x: 1300, y: 640, width: 200, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 30, height: 150 },
        targetRoomId: 'room_echo_canopy',
        targetSpawn: { x: 1700, y: 720 },
      },
      {
        side: 'bottom',
        rect: { x: 700, y: 830, width: 200, height: 40 },
        targetRoomId: 'room_echo_depths',
        targetSpawn: { x: 700, y: 100 },
      },
    ],
    enemies: [
      { id: 'en_glade_1', type: 'specter', x: 500, y: 450, patrolDist: 160 },
      { id: 'en_glade_2', type: 'specter', x: 1100, y: 460, patrolDist: 180 },
    ],
    tablets: [
      {
        id: 'tab_glade',
        x: 800,
        y: 380,
        title: 'O Lago de Orvalho Morto',
        text: '“Até as fadas mais luminosas sucumbiram à frieza do esquecimento.”',
        author: 'Peregrino Lírico',
      },
    ],
    totems: [],
    npcs: [],
    collectibles: [
      {
        id: 'shard_glade',
        x: 1400,
        y: 580,
        type: 'shard',
        label: 'Gema Esmeralda de Ressonância',
        collected: false,
      },
    ],
  },

  // Fase 8: Profundezas Fúngicas do Bosque
  room_echo_depths: {
    id: 'room_echo_depths',
    regionId: 'echo_forest',
    name: 'Fase 8 · Profundezas Fúngicas do Bosque',
    width: 1700,
    height: 900,
    spawns: {
      default: { x: 700, y: 150 },
      from_glade: { x: 700, y: 150 },
      from_cathedral: { x: 1600, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1700, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 900, type: 'solid' },
      { x: 1660, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 300, y: 680, width: 140, height: 24, type: 'bouncy_mushroom' },
      { x: 550, y: 550, width: 140, height: 24, type: 'bouncy_mushroom' },
      { x: 800, y: 420, width: 140, height: 24, type: 'bouncy_mushroom' },
      { x: 1100, y: 520, width: 200, height: 20, type: 'solid' },
      { x: 1400, y: 660, width: 200, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'top',
        rect: { x: 650, y: 0, width: 180, height: 30 },
        targetRoomId: 'room_echo_glade',
        targetSpawn: { x: 800, y: 720 },
      },
      {
        side: 'right',
        rect: { x: 1660, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_cathedral_gate',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_depths_1', type: 'crawler', x: 450, y: 760, patrolDist: 200 },
      { id: 'en_depths_2', type: 'crawler', x: 1200, y: 760, patrolDist: 220 },
      { id: 'en_depths_3', type: 'specter', x: 850, y: 360, patrolDist: 150 },
    ],
    tablets: [
      {
        id: 'tab_depths',
        x: 1200,
        y: 480,
        title: 'Passagem para a Catedral Sagrada',
        text: '“Além destas raízes fúngicas erguem-se os arcos pontiagudos da Catedral Quebrada.”',
        author: 'Sentinela do Bosque',
      },
    ],
    totems: [],
    npcs: [],
    collectibles: [],
  },

  // ==========================================
  // REGIÃO 3: MINAS DE VARRON (4 FASES COM CHEFÃO 1)
  // ==========================================

  // Fase 9: Descida às Minas de Cobre
  room_varron_descent: {
    id: 'room_varron_descent',
    regionId: 'varron_mines',
    name: 'Fase 9 · Descida às Minas de Cobre',
    width: 1600,
    height: 900,
    spawns: {
      default: { x: 80, y: 720 },
      from_catacombs: { x: 80, y: 720 },
      from_quarry: { x: 1500, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1600, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 1560, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 220, y: 660, width: 180, height: 24, type: 'solid' },
      { x: 500, y: 520, width: 220, height: 24, type: 'solid' },
      { x: 820, y: 400, width: 200, height: 24, type: 'solid' },
      { x: 1150, y: 540, width: 220, height: 24, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_lumen_catacombs',
        targetSpawn: { x: 1400, y: 680 },
      },
      {
        side: 'right',
        rect: { x: 1560, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_varron_quarry',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_varron_1', type: 'varron_sentinel', x: 600, y: 440, patrolDist: 140 },
      { id: 'en_varron_2', type: 'varron_sentinel', x: 1200, y: 720, patrolDist: 160 },
    ],
    tablets: [
      {
        id: 'tab_varron_copper',
        x: 880,
        y: 360,
        title: 'Tratado dos Mestres de Varron',
        text: '“Forjamos armaduras de bronze e cobre para resistir ao Silêncio, mas o metal tornou-se nossa própria prisão.”',
        author: 'Arquiteto de Varron',
      },
    ],
    totems: [],
    npcs: [],
    collectibles: [],
  },

  // Fase 10: Pedreira dos Autômatos
  room_varron_quarry: {
    id: 'room_varron_quarry',
    regionId: 'varron_mines',
    name: 'Fase 10 · Pedreira dos Autômatos',
    width: 1700,
    height: 850,
    spawns: {
      default: { x: 80, y: 720 },
      from_descent: { x: 80, y: 720 },
      from_foundry: { x: 1600, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1700, height: 80, type: 'solid' },
      { x: 240, y: 660, width: 200, height: 20, type: 'solid' },
      { x: 540, y: 520, width: 220, height: 20, type: 'solid' },
      { x: 860, y: 420, width: 240, height: 20, type: 'solid' },
      { x: 1200, y: 560, width: 200, height: 20, type: 'solid' },
      { x: 1450, y: 680, width: 180, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 30, height: 150 },
        targetRoomId: 'room_varron_descent',
        targetSpawn: { x: 1500, y: 720 },
      },
      {
        side: 'right',
        rect: { x: 1670, y: 650, width: 30, height: 150 },
        targetRoomId: 'room_varron_foundry',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_quarry_1', type: 'varron_sentinel', x: 600, y: 440, patrolDist: 140 },
      { id: 'en_quarry_2', type: 'crawler', x: 950, y: 760, patrolDist: 200 },
      { id: 'en_quarry_3', type: 'varron_sentinel', x: 1300, y: 480, patrolDist: 150 },
    ],
    tablets: [],
    totems: [],
    npcs: [],
    collectibles: [
      {
        id: 'shard_quarry',
        x: 980,
        y: 370,
        type: 'shard',
        label: 'Núcleo de Cobre Polido',
        collected: false,
      },
    ],
  },

  // Fase 11: Forja das Engrenagens
  room_varron_foundry: {
    id: 'room_varron_foundry',
    regionId: 'varron_mines',
    name: 'Fase 11 · Forja das Engrenagens',
    width: 1700,
    height: 900,
    spawns: {
      default: { x: 80, y: 720 },
      from_quarry: { x: 80, y: 720 },
      from_boss: { x: 1600, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1700, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 1660, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 260, y: 660, width: 200, height: 20, type: 'solid' },
      { x: 560, y: 520, width: 220, height: 20, type: 'solid' },
      { x: 880, y: 380, width: 240, height: 20, type: 'solid' },
      { x: 1220, y: 520, width: 200, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_varron_quarry',
        targetSpawn: { x: 1600, y: 720 },
      },
      {
        side: 'right',
        rect: { x: 1660, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_varron_boss',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_foundry_1', type: 'varron_sentinel', x: 650, y: 440, patrolDist: 150 },
      { id: 'en_foundry_2', type: 'varron_sentinel', x: 1300, y: 440, patrolDist: 150 },
    ],
    tablets: [
      {
        id: 'tab_foundry',
        x: 400,
        y: 760,
        title: 'Alerta da Forja Central',
        text: '“CUIDADO: A câmara à direita abriga o Colosso Forjado de Varron, o primeiro dos três grandes guardiões.”',
        author: 'Aviso dos Mineiros',
      },
    ],
    totems: [
      {
        id: 'totem_foundry',
        x: 200,
        y: 740,
        name: 'Totem da Forja de Cobre',
        activated: false,
      },
    ],
    npcs: [],
    collectibles: [
      {
        id: 'ability_wall_climb',
        x: 1000,
        y: 330,
        type: 'ability',
        abilityName: 'wallClimb',
        label: 'Garras de Bronze (Escalar Paredes)',
        collected: false,
      },
    ],
  },

  // Fase 12: Forja Ancestral de Varron · BOSS 1 DE 3
  room_varron_boss: {
    id: 'room_varron_boss',
    regionId: 'varron_mines',
    name: 'Fase 12 · Forja Ancestral · BOSS: Colosso de Varron',
    width: 1800,
    height: 900,
    isBossRoom: true,
    bossId: 'boss_varron_colossus',
    spawns: {
      default: { x: 120, y: 720 },
      from_foundry: { x: 120, y: 720 },
      from_submerged: { x: 900, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1800, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 50, height: 650, type: 'solid' },
      { x: 1750, y: 0, width: 50, height: 900, type: 'solid' },
      { x: 260, y: 640, width: 180, height: 20, type: 'solid' },
      { x: 600, y: 520, width: 200, height: 20, type: 'solid' },
      { x: 1000, y: 520, width: 200, height: 20, type: 'solid' },
      { x: 1360, y: 640, width: 180, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_varron_foundry',
        targetSpawn: { x: 1600, y: 720 },
      },
      {
        side: 'bottom',
        rect: { x: 800, y: 850, width: 200, height: 50 },
        targetRoomId: 'room_submerged_archives',
        targetSpawn: { x: 300, y: 100 },
      },
    ],
    enemies: [
      {
        id: 'boss_colossus_1',
        type: 'boss_varron_colossus',
        x: 1100,
        y: 650,
      },
    ],
    tablets: [
      {
        id: 'tab_boss_colossus',
        x: 300,
        y: 600,
        title: 'O Coração de Bronze',
        text: '“Colosso Forjado de Varron: guardião do vapor e do fogo mineral. Derrube-o para abrir a passagem aos Arquivos Submersos!”',
        author: 'Inscrição da Arena',
      },
    ],
    totems: [],
    npcs: [],
    collectibles: [
      {
        id: 'pulse_colossus_reward',
        x: 900,
        y: 470,
        type: 'pulse_vessel',
        label: 'Vaso de Pulso de Bronze (+25 Pulso Máximo)',
        collected: false,
      },
    ],
  },

  // ==========================================
  // REGIÃO 4: CATEDRAL QUEBRADA (3 FASES COM CHEFÃO 2)
  // ==========================================

  // Fase 13: Portal da Catedral Despedaçada
  room_cathedral_gate: {
    id: 'room_cathedral_gate',
    regionId: 'broken_cathedral',
    name: 'Fase 13 · Portal da Catedral Despedaçada',
    width: 1700,
    height: 900,
    spawns: {
      default: { x: 80, y: 720 },
      from_depths: { x: 80, y: 720 },
      from_nave: { x: 1600, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1700, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 1660, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 240, y: 670, width: 200, height: 24, type: 'solid' },
      { x: 540, y: 540, width: 220, height: 24, type: 'solid' },
      { x: 860, y: 410, width: 240, height: 24, type: 'solid' },
      { x: 1200, y: 550, width: 220, height: 24, type: 'solid' },
      { x: 1460, y: 680, width: 180, height: 24, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_echo_depths',
        targetSpawn: { x: 1600, y: 720 },
      },
      {
        side: 'right',
        rect: { x: 1660, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_cathedral_nave',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_cath_gate_1', type: 'specter', x: 600, y: 480, patrolDist: 180 },
      { id: 'en_cath_gate_2', type: 'varron_sentinel', x: 1000, y: 720, patrolDist: 160 },
      { id: 'en_cath_gate_3', type: 'specter', x: 1300, y: 490, patrolDist: 160 },
    ],
    tablets: [
      {
        id: 'tab_cath_gate',
        x: 400,
        y: 760,
        title: 'Limiar da Fé Esquecida',
        text: '“Aqui cantavam os coros sagrados de Echoward antes de a voz do reino ser roubada pelo Guardião.”',
        author: 'Sacerdote Silenciado',
      },
    ],
    totems: [],
    npcs: [],
    collectibles: [],
  },

  // Fase 14: Nave Solene dos Santos Mudos
  room_cathedral_nave: {
    id: 'room_cathedral_nave',
    regionId: 'broken_cathedral',
    name: 'Fase 14 · Nave Solene dos Santos Mudos',
    width: 1800,
    height: 900,
    spawns: {
      default: { x: 80, y: 720 },
      from_gate: { x: 80, y: 720 },
      from_boss: { x: 1700, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1800, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 1760, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 240, y: 660, width: 220, height: 24, type: 'solid' },
      { x: 560, y: 520, width: 240, height: 24, type: 'solid' },
      { x: 900, y: 390, width: 280, height: 24, type: 'solid' },
      { x: 1280, y: 520, width: 240, height: 24, type: 'solid' },
      { x: 1540, y: 660, width: 200, height: 24, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_cathedral_gate',
        targetSpawn: { x: 1600, y: 720 },
      },
      {
        side: 'right',
        rect: { x: 1760, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_cathedral_boss',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_nave_1', type: 'specter', x: 650, y: 460, patrolDist: 180 },
      { id: 'en_nave_2', type: 'varron_sentinel', x: 1100, y: 720, patrolDist: 180 },
    ],
    tablets: [],
    totems: [
      {
        id: 'totem_nave',
        x: 200,
        y: 740,
        name: 'Totem da Nave Sagrada',
        activated: false,
      },
    ],
    npcs: [],
    collectibles: [
      {
        id: 'ability_double_jump',
        x: 1040,
        y: 330,
        type: 'ability',
        abilityName: 'doubleJump',
        label: 'Asas da Ressonância (Salto Duplo)',
        collected: false,
      },
    ],
  },

  // Fase 15: Altar do Silêncio · BOSS 2 DE 3
  room_cathedral_boss: {
    id: 'room_cathedral_boss',
    regionId: 'broken_cathedral',
    name: 'Fase 15 · Altar do Silêncio · BOSS: Guardião do Silêncio',
    width: 1900,
    height: 900,
    isBossRoom: true,
    bossId: 'boss_guardian',
    spawns: {
      default: { x: 120, y: 720 },
      from_nave: { x: 120, y: 720 },
      from_abyss: { x: 950, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1900, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 50, height: 650, type: 'solid' },
      { x: 1850, y: 0, width: 50, height: 900, type: 'solid' },
      { x: 280, y: 640, width: 200, height: 24, type: 'solid' },
      { x: 650, y: 510, width: 220, height: 24, type: 'solid' },
      { x: 1050, y: 510, width: 220, height: 24, type: 'solid' },
      { x: 1420, y: 640, width: 200, height: 24, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_cathedral_nave',
        targetSpawn: { x: 1700, y: 720 },
      },
      {
        side: 'bottom',
        rect: { x: 850, y: 850, width: 200, height: 50 },
        targetRoomId: 'room_abyss_threshold',
        targetSpawn: { x: 200, y: 100 },
      },
    ],
    enemies: [
      {
        id: 'boss_guardian_1',
        type: 'boss_guardian',
        x: 1250,
        y: 650,
      },
    ],
    tablets: [
      {
        id: 'tab_boss_guardian',
        x: 320,
        y: 600,
        title: 'O Sino do Silêncio',
        text: '“O Guardião do Silêncio empunha a alabarda sacra. Esquive-se de suas ondas de choque e atinja-o quando fincar o sino ao solo!”',
        author: 'Inscrição do Altar',
      },
    ],
    totems: [],
    npcs: [],
    collectibles: [
      {
        id: 'mask_fragment_guardian',
        x: 950,
        y: 460,
        type: 'mask_fragment',
        label: 'Fragmento de Máscara Sagrada (+1 HP Máximo)',
        collected: false,
      },
    ],
  },

  // ==========================================
  // REGIÃO 5: ABISMO SUBMERSO & NÚCLEO DE NER (4 FASES COM CHEFÃO 3 FINAL)
  // ==========================================

  // Fase 16: Arquivos Submersos do Reino
  room_submerged_archives: {
    id: 'room_submerged_archives',
    regionId: 'submerged_city',
    name: 'Fase 16 · Arquivos Submersos do Reino',
    width: 1700,
    height: 900,
    spawns: {
      default: { x: 300, y: 150 },
      from_varron: { x: 300, y: 150 },
      from_threshold: { x: 1600, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1700, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 900, type: 'solid' },
      { x: 1660, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 200, y: 240, width: 240, height: 20, type: 'solid' },
      { x: 500, y: 400, width: 220, height: 20, type: 'solid' },
      { x: 800, y: 550, width: 260, height: 20, type: 'solid' },
      { x: 1150, y: 660, width: 220, height: 20, type: 'solid' },
      { x: 1400, y: 750, width: 200, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'top',
        rect: { x: 220, y: 0, width: 200, height: 30 },
        targetRoomId: 'room_varron_boss',
        targetSpawn: { x: 800, y: 720 },
      },
      {
        side: 'right',
        rect: { x: 1660, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_abyss_threshold',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_sub_1', type: 'abyss_diver', x: 600, y: 350, patrolDist: 180 },
      { id: 'en_sub_2', type: 'abyss_diver', x: 1100, y: 500, patrolDist: 200 },
    ],
    tablets: [
      {
        id: 'tab_submerged',
        x: 850,
        y: 510,
        title: 'As Crônicas das Marés Esquecidas',
        text: '“Toda a história deste reino afundou sob a água escura. Use a Visão de Memória para enxergar as plataformas ocultas.”',
        author: 'Bibliotecário Submerso',
      },
    ],
    totems: [],
    npcs: [],
    collectibles: [
      {
        id: 'ability_memory_vision',
        x: 1250,
        y: 610,
        type: 'ability',
        abilityName: 'memoryVision',
        label: 'Visão de Memória (Revelar o Oculto)',
        collected: false,
      },
    ],
  },

  // Fase 17: Limiar das Sombras Abissais
  room_abyss_threshold: {
    id: 'room_abyss_threshold',
    regionId: 'ner_abyss',
    name: 'Fase 17 · Limiar das Sombras Abissais',
    width: 1800,
    height: 900,
    spawns: {
      default: { x: 80, y: 720 },
      from_archives: { x: 80, y: 720 },
      from_cathedral: { x: 250, y: 150 },
      from_chasm: { x: 1700, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1800, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 1760, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 180, y: 220, width: 220, height: 20, type: 'solid' },
      { x: 300, y: 650, width: 180, height: 24, type: 'solid' },
      { x: 600, y: 520, width: 200, height: 24, type: 'solid' },
      { x: 920, y: 400, width: 220, height: 24, type: 'solid' },
      { x: 1240, y: 530, width: 240, height: 24, type: 'solid' },
      { x: 1540, y: 660, width: 180, height: 24, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_submerged_archives',
        targetSpawn: { x: 1600, y: 720 },
      },
      {
        side: 'top',
        rect: { x: 180, y: 0, width: 220, height: 30 },
        targetRoomId: 'room_cathedral_boss',
        targetSpawn: { x: 950, y: 720 },
      },
      {
        side: 'right',
        rect: { x: 1760, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_abyss_chasm',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_thresh_1', type: 'abyss_diver', x: 700, y: 450, patrolDist: 200 },
      { id: 'en_thresh_2', type: 'abyss_diver', x: 1300, y: 460, patrolDist: 220 },
    ],
    tablets: [],
    totems: [
      {
        id: 'totem_abyss_threshold',
        x: 400,
        y: 740,
        name: 'Totem da Escuridão Eterna',
        activated: false,
      },
    ],
    npcs: [],
    collectibles: [],
  },

  // Fase 18: O Grande Abismo dos Ecos
  room_abyss_chasm: {
    id: 'room_abyss_chasm',
    regionId: 'ner_abyss',
    name: 'Fase 18 · O Grande Abismo dos Ecos',
    width: 1900,
    height: 950,
    spawns: {
      default: { x: 80, y: 720 },
      from_threshold: { x: 80, y: 720 },
      from_boss: { x: 1800, y: 720 },
    },
    platforms: [
      { x: 0, y: 850, width: 1900, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 700, type: 'solid' },
      { x: 1860, y: 0, width: 40, height: 700, type: 'solid' },
      { x: 260, y: 700, width: 200, height: 24, type: 'solid' },
      { x: 580, y: 560, width: 220, height: 24, type: 'solid' },
      { x: 920, y: 420, width: 240, height: 24, type: 'solid' },
      { x: 1260, y: 550, width: 220, height: 24, type: 'solid' },
      { x: 1560, y: 690, width: 200, height: 24, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 700, width: 40, height: 150 },
        targetRoomId: 'room_abyss_threshold',
        targetSpawn: { x: 1700, y: 720 },
      },
      {
        side: 'right',
        rect: { x: 1860, y: 700, width: 40, height: 150 },
        targetRoomId: 'room_abyss_boss',
        targetSpawn: { x: 100, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_chasm_1', type: 'abyss_diver', x: 650, y: 500, patrolDist: 200 },
      { id: 'en_chasm_2', type: 'abyss_diver', x: 1350, y: 480, patrolDist: 220 },
    ],
    tablets: [
      {
        id: 'tab_abyss_chasm',
        x: 400,
        y: 810,
        title: 'O Vazio Ressonante',
        text: '“À frente fica o Trono de Ner, onde repousa o terceiro e derradeiro chefe: A Sombra de Ner!”',
        author: 'Último Arauto',
      },
    ],
    totems: [
      {
        id: 'totem_abyss_chasm',
        x: 200,
        y: 790,
        name: 'Totem do Limiar das Sombras',
        activated: false,
        isSavePoint: true,
      },
    ],
    npcs: [],
    collectibles: [
      {
        id: 'ability_rewind',
        x: 1040,
        y: 360,
        type: 'ability',
        abilityName: 'rewind',
        label: 'Eco Reverso (Voltar no Tempo [R])',
        collected: false,
      },
      {
        id: 'ability_ground_pound',
        x: 1660,
        y: 630,
        type: 'ability',
        abilityName: 'groundPound',
        label: 'Impacto Sísmico de Cinzas',
        collected: false,
      },
    ],
  },

  // Fase 19: Trono das Cinzas de Ner · BOSS 3 DE 3 (CHEFÃO FINAL)
  room_abyss_boss: {
    id: 'room_abyss_boss',
    regionId: 'ner_abyss',
    name: 'Fase 19 · Trono de Ner · BOSS FINAL: A Sombra de Ner',
    width: 2000,
    height: 950,
    isBossRoom: true,
    bossId: 'boss_shade',
    spawns: {
      default: { x: 120, y: 750 },
      from_chasm: { x: 120, y: 750 },
    },
    platforms: [
      { x: 0, y: 850, width: 2000, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 50, height: 700, type: 'solid' },
      { x: 1950, y: 0, width: 50, height: 950, type: 'solid' },
      { x: 280, y: 680, width: 220, height: 24, type: 'solid' },
      { x: 680, y: 540, width: 240, height: 24, type: 'solid' },
      { x: 1100, y: 540, width: 240, height: 24, type: 'solid' },
      { x: 1520, y: 680, width: 220, height: 24, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 700, width: 40, height: 150 },
        targetRoomId: 'room_abyss_chasm',
        targetSpawn: { x: 1800, y: 720 },
      },
    ],
    enemies: [
      {
        id: 'boss_shade_final',
        type: 'boss_shade',
        x: 1300,
        y: 700,
      },
    ],
    tablets: [
      {
        id: 'tab_abyss_final',
        x: 350,
        y: 640,
        title: 'O Despertar de Echoward',
        text: '“Você derrotou o Colosso de Varron e o Guardião da Catedral. Agora enfrente A Sombra de Ner. Quando o Arauto do Vazio cair, a canção de Echoward despertará para sempre!”',
        author: 'A Consciência Eterna das Cinzas',
      },
    ],
    totems: [
      {
        id: 'totem_throne_ner',
        x: 1800,
        y: 790,
        name: 'Totem do Trono Imortal',
        activated: false,
      },
    ],
    npcs: [],
    collectibles: [
      {
        id: 'mask_fragment_ner',
        x: 900,
        y: 480,
        type: 'mask_fragment',
        label: 'A Máscara Primordial de Ner (Vida e Pulso Máximos)',
        collected: false,
      },
    ],
  },
};
