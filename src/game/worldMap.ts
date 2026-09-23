import { GameRoom } from './types';

export const GAME_ROOMS: Record<string, GameRoom> = {
  // 1. Vila de Lumen - O Refúgio Silencioso
  room_lumen_haven: {
    id: 'room_lumen_haven',
    regionId: 'lumen_village',
    name: 'Vila de Lumen · Santuário',
    width: 1400,
    height: 700,
    spawns: {
      default: { x: 200, y: 520 },
      from_crossroads: { x: 1300, y: 520 },
    },
    platforms: [
      // Ground floor
      { x: 0, y: 600, width: 1400, height: 100, type: 'solid' },
      // Left border wall
      { x: -50, y: 0, width: 50, height: 700, type: 'solid' },
      // Ceiling
      { x: 0, y: -50, width: 1400, height: 50, type: 'solid' },
      // Architecture & dwellings
      { x: 160, y: 460, width: 220, height: 20, type: 'solid' },
      { x: 480, y: 400, width: 240, height: 20, type: 'solid' },
      { x: 800, y: 480, width: 200, height: 20, type: 'solid' },
      // Ancient bell platform
      { x: 1050, y: 340, width: 180, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'right',
        rect: { x: 1380, y: 450, width: 30, height: 150 },
        targetRoomId: 'room_lumen_crossroads',
        targetSpawn: { x: 80, y: 520 },
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
        author: 'Escriba de Lumen'
      }
    ],
    totems: [
      {
        id: 'totem_lumen',
        x: 180,
        y: 540,
        name: 'Totem do Repouso de Lumen',
        activated: true,
      }
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
          'O reino abaixo geme sob o peso da Ressonância corrompida. Se você quer descer, avance pelo Bosque do Eco à direita.',
          'Pressione [C] ou [J] para golpear. Se atingir inimigos no ar enquanto segura para baixo [S], você ricocheteará neles!',
          'E lembre-se: concentre o seu Pulso segurando [F] ou [E] para restaurar as trincas de sua máscara.'
        ]
      }
    ],
    collectibles: [],
  },

  // 2. Encruzilhada Superior
  room_lumen_crossroads: {
    id: 'room_lumen_crossroads',
    regionId: 'lumen_village',
    name: 'Encruzilhada dos Peregrinos',
    width: 1600,
    height: 900,
    spawns: {
      default: { x: 80, y: 720 },
      from_haven: { x: 80, y: 720 },
      from_forest: { x: 1500, y: 720 },
      from_mines: { x: 800, y: 80 },
    },
    platforms: [
      // Ground
      { x: 0, y: 800, width: 1600, height: 100, type: 'solid' },
      // Left barrier with passage
      { x: 0, y: 0, width: 40, height: 650, type: 'solid' },
      // Right barrier with passage
      { x: 1560, y: 0, width: 40, height: 650, type: 'solid' },
      // Stepping stones
      { x: 200, y: 680, width: 180, height: 20, type: 'solid' },
      { x: 440, y: 560, width: 220, height: 20, type: 'solid' },
      { x: 740, y: 440, width: 200, height: 20, type: 'solid' },
      { x: 1020, y: 340, width: 220, height: 20, type: 'solid' },
      { x: 1300, y: 480, width: 180, height: 20, type: 'solid' },
      // Wall climbable surface (Garra de Cinza)
      { x: 960, y: 200, width: 20, height: 240, type: 'wall_climbable' },
      // Fragile floor (Mergulho Abissal) leading down to Mines shortcut
      { x: 700, y: 800, width: 200, height: 30, type: 'fragile', hp: 1 },
      // Spikes hazard
      { x: 500, y: 775, width: 140, height: 25, type: 'spike' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_lumen_haven',
        targetSpawn: { x: 1300, y: 520 },
      },
      {
        side: 'right',
        rect: { x: 1560, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_echo_entrance',
        targetSpawn: { x: 80, y: 620 },
      },
      {
        side: 'bottom',
        rect: { x: 700, y: 830, width: 200, height: 50 },
        targetRoomId: 'room_varron_descent',
        targetSpawn: { x: 600, y: 120 },
      }
    ],
    enemies: [
      { id: 'en_cr_1', type: 'crawler', x: 300, y: 750, patrolDist: 140 },
      { id: 'en_cr_2', type: 'crawler', x: 1100, y: 750, patrolDist: 180 },
    ],
    tablets: [],
    totems: [],
    npcs: [],
    collectibles: [
      {
        id: 'shard_crossroads_1',
        x: 1100,
        y: 290,
        type: 'shard',
        label: 'Fragmento de Pulso',
        collected: false
      }
    ],
  },

  // 3. Bosque do Eco - Entrada
  room_echo_entrance: {
    id: 'room_echo_entrance',
    regionId: 'echo_forest',
    name: 'Bosque do Eco · Trilha Fúngica',
    width: 1800,
    height: 800,
    spawns: {
      default: { x: 80, y: 620 },
      from_crossroads: { x: 80, y: 620 },
      from_canopy: { x: 1700, y: 620 },
    },
    platforms: [
      { x: 0, y: 700, width: 1800, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 550, type: 'solid' },
      { x: 1760, y: 0, width: 40, height: 550, type: 'solid' },
      // Fungal arches
      { x: 260, y: 550, width: 180, height: 24, type: 'solid' },
      { x: 520, y: 440, width: 220, height: 24, type: 'solid' },
      // Bouncy Resonance Mushrooms (Pogo to bounce up!)
      { x: 800, y: 670, width: 70, height: 30, type: 'bouncy_mushroom' },
      { x: 1100, y: 520, width: 70, height: 30, type: 'bouncy_mushroom' },
      // High canopy branch
      { x: 880, y: 320, width: 260, height: 24, type: 'solid' },
      { x: 1240, y: 420, width: 200, height: 24, type: 'solid' },
      { x: 1500, y: 540, width: 180, height: 24, type: 'solid' },
      // Spikes pit
      { x: 880, y: 675, width: 200, height: 25, type: 'spike' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 550, width: 40, height: 150 },
        targetRoomId: 'room_lumen_crossroads',
        targetSpawn: { x: 1500, y: 720 },
      },
      {
        side: 'right',
        rect: { x: 1760, y: 550, width: 40, height: 150 },
        targetRoomId: 'room_echo_canopy',
        targetSpawn: { x: 80, y: 620 },
      },
    ],
    enemies: [
      { id: 'en_sp_1', type: 'specter', x: 600, y: 320, patrolDist: 100 },
      { id: 'en_cr_3', type: 'crawler', x: 300, y: 650, patrolDist: 120 },
      { id: 'en_sp_2', type: 'specter', x: 1350, y: 350, patrolDist: 120 },
    ],
    tablets: [
      {
        id: 'tab_echo_1',
        x: 980,
        y: 280,
        title: 'Canto das Raízes',
        text: '“Os cogumelos de Echoward não crescem para a luz. Eles absorvem os acordes da terra e os devolvem em impulso cinético. Golpeie-os por cima para ascender.”',
        author: 'Herborista de Varron'
      }
    ],
    totems: [],
    npcs: [],
    collectibles: [
      {
        id: 'shard_echo_1',
        x: 1000,
        y: 180,
        type: 'shard',
        label: 'Eco de Ressonância (+Geo)',
        collected: false,
      }
    ],
  },

  // 4. Bosque do Eco - Dossel e Desbloqueio do Passo Fantasma (Dash)
  room_echo_canopy: {
    id: 'room_echo_canopy',
    regionId: 'echo_forest',
    name: 'Bosque do Eco · Dossel Sagrado',
    width: 1600,
    height: 800,
    spawns: {
      default: { x: 80, y: 620 },
      from_entrance: { x: 80, y: 620 },
      from_cathedral: { x: 1500, y: 620 },
    },
    platforms: [
      { x: 0, y: 700, width: 1600, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 550, type: 'solid' },
      { x: 1560, y: 0, width: 40, height: 550, type: 'solid' },
      // Floating moss platforms
      { x: 220, y: 560, width: 160, height: 20, type: 'solid' },
      { x: 450, y: 440, width: 180, height: 20, type: 'solid' },
      // Altar of Dash
      { x: 720, y: 380, width: 220, height: 30, type: 'solid' },
      // Ethereal Resonance Barrier (Requires Passo Fantasma to cross)
      { x: 1100, y: 500, width: 30, height: 200, type: 'resonance_barrier' },
      { x: 1200, y: 580, width: 240, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 550, width: 40, height: 150 },
        targetRoomId: 'room_echo_entrance',
        targetSpawn: { x: 1700, y: 620 },
      },
      {
        side: 'right',
        rect: { x: 1560, y: 550, width: 40, height: 150 },
        targetRoomId: 'room_cathedral_gate',
        targetSpawn: { x: 80, y: 620 },
      },
    ],
    enemies: [
      { id: 'en_sp_canopy', type: 'specter', x: 450, y: 320, patrolDist: 150 },
      { id: 'en_cr_canopy', type: 'crawler', x: 1300, y: 650, patrolDist: 120 },
    ],
    tablets: [],
    totems: [
      {
        id: 'totem_canopy',
        x: 300,
        y: 640,
        name: 'Totem do Repouso Fúngico',
        activated: false,
      }
    ],
    npcs: [
      {
        id: 'npc_kael',
        name: 'Kael, Sentinela Silencioso',
        title: 'Guarda da Espinheira',
        x: 1000,
        y: 630,
        portraitIcon: '🛡️',
        interacted: false,
        dialogue: [
          'À frente jaz a barreira de ressonância da Catedral Quebrada.',
          'Nenhum corpo físico a atravessa sem se desfazer em cinzas.',
          'Mas sobre o altar acima... repousa a relíquia do [Passo Fantasma].',
          'Tome-a. Pressione [SHIFT] ou [K] para disparar através do espaço e de ataques inimigos!'
        ]
      }
    ],
    collectibles: [
      {
        id: 'ability_dash',
        x: 820,
        y: 320,
        type: 'ability',
        abilityName: 'dash',
        label: 'Passo Fantasma (Dash)',
        collected: false,
      }
    ],
  },

  // 5. Portão da Catedral Quebrada (Desbloqueio de Salto de Ressonância)
  room_cathedral_gate: {
    id: 'room_cathedral_gate',
    regionId: 'broken_cathedral',
    name: 'Catedral Quebrada · Átrio das Cinzas',
    width: 1700,
    height: 900,
    spawns: {
      default: { x: 80, y: 720 },
      from_canopy: { x: 80, y: 720 },
      from_boss: { x: 1600, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1700, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 1660, y: 0, width: 40, height: 650, type: 'solid' },
      // Gothic cathedral pillars & broken platforms
      { x: 260, y: 660, width: 160, height: 24, type: 'solid' },
      { x: 500, y: 520, width: 180, height: 24, type: 'solid' },
      { x: 760, y: 400, width: 220, height: 24, type: 'solid' },
      { x: 1080, y: 520, width: 180, height: 24, type: 'solid' },
      { x: 1340, y: 640, width: 180, height: 24, type: 'solid' },
      // Double Jump Relic Altar
      { x: 810, y: 260, width: 120, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_echo_canopy',
        targetSpawn: { x: 1500, y: 620 },
      },
      {
        side: 'right',
        rect: { x: 1660, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_cathedral_nave',
        targetSpawn: { x: 100, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_vsent_1', type: 'varron_sentinel', x: 600, y: 740, patrolDist: 100 },
      { id: 'en_sp_cathed', type: 'specter', x: 900, y: 460, patrolDist: 140 },
    ],
    tablets: [
      {
        id: 'tab_cathed_1',
        x: 400,
        y: 760,
        title: 'Liturgia dos Sinos Rachados',
        text: '“Aquele que salta duas vezes não desafia o peso do mundo; ele se apoia nas ondas invisíveis do som antigo.”',
        author: 'Sumo Sacerdote de Ner'
      }
    ],
    totems: [],
    npcs: [],
    collectibles: [
      {
        id: 'ability_double_jump',
        x: 860,
        y: 200,
        type: 'ability',
        abilityName: 'doubleJump',
        label: 'Salto de Ressonância (Pulo Duplo)',
        collected: false,
      }
    ],
  },

  // 6. Catedral Quebrada - Nave Central (ARENA DO CHEFE: O Guardião do Silêncio)
  room_cathedral_nave: {
    id: 'room_cathedral_nave',
    regionId: 'broken_cathedral',
    name: 'Catedral Quebrada · Altar do Guardião',
    width: 1800,
    height: 900,
    isBossRoom: true,
    bossId: 'boss_guardian_1',
    spawns: {
      default: { x: 120, y: 720 },
      from_gate: { x: 120, y: 720 },
      from_abyss: { x: 1680, y: 720 },
    },
    platforms: [
      // Floor
      { x: 0, y: 800, width: 1800, height: 100, type: 'solid' },
      // Walls
      { x: 0, y: 0, width: 40, height: 900, type: 'solid' },
      { x: 1760, y: 0, width: 40, height: 650, type: 'solid' },
      // High arches for boss battle maneuvering
      { x: 200, y: 580, width: 220, height: 24, type: 'solid' },
      { x: 600, y: 440, width: 220, height: 24, type: 'solid' },
      { x: 1000, y: 440, width: 220, height: 24, type: 'solid' },
      { x: 1380, y: 580, width: 220, height: 24, type: 'solid' },
    ],
    transitions: [
      {
        side: 'right',
        rect: { x: 1760, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_abyss_threshold',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      {
        id: 'boss_guardian_1',
        type: 'boss_guardian',
        x: 1200,
        y: 660,
        patrolDist: 400,
      }
    ],
    tablets: [],
    totems: [
      {
        id: 'totem_cathedral',
        x: 120,
        y: 740,
        name: 'Totem dos Penitentes',
        activated: false,
      }
    ],
    npcs: [],
    collectibles: [
      {
        id: 'ability_ground_pound',
        x: 1550,
        y: 720,
        type: 'ability',
        abilityName: 'groundPound',
        label: 'Mergulho Abissal (Ground Slam)',
        collected: false,
      }
    ],
  },

  // 7. Minas de Varron - Descida (Área de atalho & Garra de Cinza)
  room_varron_descent: {
    id: 'room_varron_descent',
    regionId: 'varron_mines',
    name: 'Minas de Varron · Poço de Fundição',
    width: 1400,
    height: 1000,
    spawns: {
      default: { x: 600, y: 120 },
      from_crossroads: { x: 600, y: 120 },
      from_submerged: { x: 1250, y: 820 },
    },
    platforms: [
      { x: 0, y: 900, width: 1400, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 1000, type: 'solid' },
      { x: 1360, y: 0, width: 40, height: 750, type: 'solid' },
      // Iron machinery platforms
      { x: 100, y: 760, width: 240, height: 24, type: 'solid' },
      { x: 420, y: 640, width: 200, height: 24, type: 'solid' },
      { x: 740, y: 520, width: 220, height: 24, type: 'solid' },
      { x: 1040, y: 400, width: 220, height: 24, type: 'solid' },
      // Wall climbable shaft
      { x: 40, y: 200, width: 24, height: 350, type: 'wall_climbable' },
      { x: 1336, y: 200, width: 24, height: 350, type: 'wall_climbable' },
      // Wall climb ability altar
      { x: 200, y: 260, width: 160, height: 20, type: 'solid' },
    ],
    transitions: [
      {
        side: 'right',
        rect: { x: 1360, y: 750, width: 40, height: 150 },
        targetRoomId: 'room_submerged_archives',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_vs_mines', type: 'varron_sentinel', x: 500, y: 840, patrolDist: 200 },
      { id: 'en_cr_mines', type: 'crawler', x: 800, y: 840, patrolDist: 150 },
    ],
    tablets: [
      {
        id: 'tab_mines_1',
        x: 600,
        y: 860,
        title: 'Registro da Escavação 44',
        text: '“Quanto mais fundo batemos nossos martelos, mais a pedra devolve um eco consciente. A terra não é inerte; ela lembra.”',
        author: 'Mestre Varron'
      }
    ],
    totems: [],
    npcs: [],
    collectibles: [
      {
        id: 'ability_wall_climb',
        x: 270,
        y: 200,
        type: 'ability',
        abilityName: 'wallClimb',
        label: 'Garra de Cinza (Escalada em Paredes)',
        collected: false,
      }
    ],
  },

  // 8. Cidade Submersa - Arquivos Afogados
  room_submerged_archives: {
    id: 'room_submerged_archives',
    regionId: 'submerged_city',
    name: 'Cidade Submersa · Arquivos Afogados',
    width: 1600,
    height: 850,
    spawns: {
      default: { x: 80, y: 720 },
      from_mines: { x: 80, y: 720 },
      from_abyss: { x: 1500, y: 720 },
    },
    platforms: [
      { x: 0, y: 780, width: 1600, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 1560, y: 0, width: 40, height: 650, type: 'solid' },
      // Aqueduct arches
      { x: 200, y: 640, width: 200, height: 24, type: 'solid' },
      { x: 500, y: 500, width: 240, height: 24, type: 'solid' },
      { x: 850, y: 400, width: 200, height: 24, type: 'solid' },
      { x: 1150, y: 520, width: 220, height: 24, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 40, height: 130 },
        targetRoomId: 'room_varron_descent',
        targetSpawn: { x: 1250, y: 820 },
      },
      {
        side: 'right',
        rect: { x: 1560, y: 650, width: 40, height: 130 },
        targetRoomId: 'room_abyss_threshold',
        targetSpawn: { x: 80, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_sp_sub_1', type: 'specter', x: 600, y: 420, patrolDist: 140 },
      { id: 'en_sp_sub_2', type: 'specter', x: 1000, y: 320, patrolDist: 150 },
    ],
    tablets: [
      {
        id: 'tab_sub_1',
        x: 880,
        y: 350,
        title: 'Tratado da Ressonância Líquida',
        text: '“A água é o melhor condutor da memória. As cidades que se afogaram não morreram; continuam revivendo o mesmo amanhecer sob as marés escuras.”',
        author: 'Cronista das Águas'
      }
    ],
    totems: [
      {
        id: 'totem_submerged',
        x: 300,
        y: 720,
        name: 'Totem dos Arquivos',
        activated: false,
      }
    ],
    npcs: [],
    collectibles: [
      {
        id: 'shard_submerged_1',
        x: 870,
        y: 320,
        type: 'shard',
        label: 'Relíquia Submersa',
        collected: false,
      }
    ],
  },

  // 9. Limiar do Abismo de Ner - O Vazio Sem Ecos
  room_abyss_threshold: {
    id: 'room_abyss_threshold',
    regionId: 'ner_abyss',
    name: 'Abismo de Ner · Limiar das Sombras',
    width: 1800,
    height: 900,
    spawns: {
      default: { x: 80, y: 720 },
      from_cathedral: { x: 80, y: 720 },
      from_submerged: { x: 80, y: 720 },
    },
    platforms: [
      { x: 0, y: 800, width: 1800, height: 100, type: 'solid' },
      { x: 0, y: 0, width: 40, height: 650, type: 'solid' },
      { x: 1760, y: 0, width: 40, height: 900, type: 'solid' },
      // Somber abyssal rocks
      { x: 300, y: 650, width: 180, height: 24, type: 'solid' },
      { x: 600, y: 520, width: 200, height: 24, type: 'solid' },
      { x: 920, y: 400, width: 220, height: 24, type: 'solid' },
      { x: 1240, y: 300, width: 240, height: 24, type: 'solid' },
      // Final Monolith
      { x: 1540, y: 480, width: 180, height: 24, type: 'solid' },
    ],
    transitions: [
      {
        side: 'left',
        rect: { x: 0, y: 650, width: 40, height: 150 },
        targetRoomId: 'room_cathedral_nave',
        targetSpawn: { x: 1680, y: 720 },
      },
    ],
    enemies: [
      { id: 'en_abyss_diver_1', type: 'abyss_diver', x: 750, y: 380, patrolDist: 200 },
      { id: 'en_abyss_diver_2', type: 'abyss_diver', x: 1400, y: 220, patrolDist: 220 },
    ],
    tablets: [
      {
        id: 'tab_abyss_core',
        x: 1600,
        y: 440,
        title: 'O Silêncio Revelado',
        text: '“Você agora vê, Nox? Não há saída de Echoward. O reino inteiro é a sua concha. Quando as três trincas da sua máscara se unirem, você não será um prisioneiro deste abismo... você será o próprio coração que o fará despertar.”',
        author: 'A Consciência das Cinzas'
      }
    ],
    totems: [
      {
        id: 'totem_abyss',
        x: 400,
        y: 740,
        name: 'Totem da Escuridão Eterna',
        activated: false,
      }
    ],
    npcs: [],
    collectibles: [
      {
        id: 'ability_rewind',
        x: 1350,
        y: 240,
        type: 'ability',
        abilityName: 'rewind',
        label: 'Eco Reverso (Voltar no Tempo)',
        collected: false,
      },
      {
        id: 'ability_vision',
        x: 980,
        y: 340,
        type: 'ability',
        abilityName: 'memoryVision',
        label: 'Visão de Memória',
        collected: false,
      }
    ],
  },
};
