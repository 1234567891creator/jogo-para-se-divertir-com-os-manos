/**
 * Echoward: Reino das Cinzas - Player Animation Customization Store
 * Manages procedural animation styles, custom overrides, speeds, and interactive poses for other players.
 */

import { RemoteAnimationStyle } from './types';

export interface AnimationStylePreset {
  id: RemoteAnimationStyle;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  color: string;
  trailColor: string;
  tags: string[];
}

export const ANIMATION_STYLE_PRESETS: AnimationStylePreset[] = [
  {
    id: 'padrao',
    name: 'Andarilho das Cinzas',
    tagline: 'Fidelidade Clássica Sombria',
    description: 'Capa drapeada esvoaçante com rasgos, chifres de porcelana, máscara esculpida, respiração fluida e golpes de lâmina com reflexo de ressonância.',
    badge: '⚔️ Clássico',
    color: '#38bdf8',
    trailColor: 'rgba(56, 189, 248, 0.4)',
    tags: ['Fluido', 'Capa Dinâmica', 'Lâmina Esmagadora'],
  },
  {
    id: 'espectral',
    name: 'Espírito Celestial',
    tagline: 'Fantasma Esmaltado Astral',
    description: 'Levitação suave com ondulação espectral, corpo translúcido com poeira estelar, cauda fantasmagórica sem passos terrestres e rastros astrais cintilantes.',
    badge: '✨ Astral',
    color: '#c084fc',
    trailColor: 'rgba(192, 132, 252, 0.5)',
    tags: ['Levitação', 'Translúcido', 'Partículas Astrais'],
  },
  {
    id: 'shinobi',
    name: 'Sombra Ninja do Abismo',
    tagline: 'Agilidade Furtiva & Cortes Relâmpago',
    description: 'Postura ágil e rebaixada, cachecol rubro flutuando ao vento, clones de sombra com desfoque de movimento em corridas e cortes rápidos de katana.',
    badge: '🥷 Shinobi',
    color: '#f43f5e',
    trailColor: 'rgba(244, 63, 94, 0.45)',
    tags: ['Pós-Imagens', 'Cachecol Rubro', 'Lâmina Rápida'],
  },
  {
    id: 'chibi',
    name: 'Chibi Cósmico Saltitante',
    tagline: 'Pulos Elásticos & Expressividade',
    description: 'Proporções lúdicas e fofas com squash & stretch elástico ao saltar e pousar, olhos gigantes e expressivos brilhantes, anéis de estrelas e ataque giratório.',
    badge: '⭐ Chibi',
    color: '#fbbf24',
    trailColor: 'rgba(251, 191, 36, 0.5)',
    tags: ['Squash & Stretch', 'Estrelas', 'Ataque Giratório'],
  },
  {
    id: 'glitch',
    name: 'Anomalia Cyber-Void',
    tagline: 'Scanlines & Holograma Glitch',
    description: 'Efeito holográfico cibernético com aberração cromática (offset ciano e magenta), varreduras de scanlines, cubos digitais de dados e visor laser pulsante.',
    badge: '👾 Glitch',
    color: '#06b6d4',
    trailColor: 'rgba(6, 182, 212, 0.6)',
    tags: ['Scanlines', 'Aberração Cromática', 'Cubos Matrix'],
  },
  {
    id: 'fogo',
    name: 'Chamas Ancestrais',
    tagline: 'Fogo Primordial & Brasas Vivas',
    description: 'Capa incandescente em gradiente de fogo vivo, chifres de tocha ardente, faíscas de brasas contínuas nos ombros e corte de fogo incandescente.',
    badge: '🔥 Chamas',
    color: '#f97316',
    trailColor: 'rgba(249, 115, 22, 0.6)',
    tags: ['Fogo Vivo', 'Brasas Voando', 'Lâmina de Fogo'],
  },
  {
    id: 'danca',
    name: 'Dançarino Festivo do Vazio',
    tagline: 'Groove Contínuo & Ritmo Celebratório',
    description: 'Ginga constante e animada com passinhos laterais ritmados, notas musicais flutuando pela cabeça, holofote luminoso no chão e confetes mágicos.',
    badge: '💃 Dança',
    color: '#ec4899',
    trailColor: 'rgba(236, 72, 153, 0.5)',
    tags: ['Passinho Rítmico', 'Notas Musicais', 'Confete Cósmico'],
  },
];

export interface InteractivePoseTrigger {
  id: string;
  name: string;
  icon: string;
  duration: number; // in seconds
  description: string;
}

export const INTERACTIVE_POSES: InteractivePoseTrigger[] = [
  { id: 'danca', name: 'Dança dos Andarilhos', icon: '💃', duration: 8, description: 'Companheiro entra em passinho de dança ritmado com notas musicais!' },
  { id: 'meditar', name: 'Meditação Levitatória', icon: '🧘', duration: 8, description: 'Flutua em posição de lótus cercado por runas luminescentes.' },
  { id: 'pose_vitoria', name: 'Pose Triunfante', icon: '⚔️', duration: 6, description: 'Ergue a espada para o céu liberando feixes luminosos de vitória.' },
  { id: 'reverencia', name: 'Reverência Nobre', icon: '🙇', duration: 5, description: 'Inclina-se respeitosamente como um cavaleiro das cinzas.' },
  { id: 'acenar', name: 'Acenar Amigavelmente', icon: '🙋', duration: 5, description: 'Ergue a mão e acena com faíscas amigáveis.' },
  { id: 'giro_espada', name: 'Giro Espiral de Lâmina', icon: '🌪️', duration: 4, description: 'Executa um rodopio acrobático cortando o ar ao redor.' },
];

class PlayerAnimationStore {
  public globalOtherPlayersStyle: RemoteAnimationStyle = 'padrao';
  public perPlayerStyles: Record<string, RemoteAnimationStyle> = {};
  public animationSpeed: number = 1.0; // 0.5x to 2.5x
  public effectsIntensity: 'baixo' | 'normal' | 'intenso' = 'normal';
  public activePoses: Map<string, { pose: string; expiresAt: number }> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const savedGlobal = localStorage.getItem('echoward_other_players_style') as RemoteAnimationStyle;
      if (savedGlobal && ANIMATION_STYLE_PRESETS.some((p) => p.id === savedGlobal)) {
        this.globalOtherPlayersStyle = savedGlobal;
      }
      const savedMap = localStorage.getItem('echoward_per_player_styles');
      if (savedMap) {
        this.perPlayerStyles = JSON.parse(savedMap);
      }
      const savedSpeed = localStorage.getItem('echoward_other_players_anim_speed');
      if (savedSpeed) {
        const val = parseFloat(savedSpeed);
        if (!isNaN(val) && val >= 0.5 && val <= 2.5) {
          this.animationSpeed = val;
        }
      }
      const savedIntensity = localStorage.getItem('echoward_anim_effects_intensity');
      if (savedIntensity === 'baixo' || savedIntensity === 'normal' || savedIntensity === 'intenso') {
        this.effectsIntensity = savedIntensity;
      }
    } catch (e) {
      console.warn('Failed loading player animation store:', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('echoward_other_players_style', this.globalOtherPlayersStyle);
      localStorage.setItem('echoward_per_player_styles', JSON.stringify(this.perPlayerStyles));
      localStorage.setItem('echoward_other_players_anim_speed', String(this.animationSpeed));
      localStorage.setItem('echoward_anim_effects_intensity', this.effectsIntensity);
    } catch {}
  }

  public getStyleForPlayer(playerId?: string, playerName?: string): RemoteAnimationStyle {
    if (playerId && this.perPlayerStyles[playerId]) {
      return this.perPlayerStyles[playerId];
    }
    if (playerName && this.perPlayerStyles[playerName]) {
      return this.perPlayerStyles[playerName];
    }
    return this.globalOtherPlayersStyle;
  }

  public setGlobalOtherPlayersStyle(style: RemoteAnimationStyle) {
    this.globalOtherPlayersStyle = style;
    this.saveToStorage();
    this.notify();
  }

  public setPlayerStyle(playerIdOrName: string, style: RemoteAnimationStyle) {
    this.perPlayerStyles[playerIdOrName] = style;
    this.saveToStorage();
    this.notify();
  }

  public resetPlayerStyle(playerIdOrName: string) {
    delete this.perPlayerStyles[playerIdOrName];
    this.saveToStorage();
    this.notify();
  }

  public resetAllToGlobal() {
    this.perPlayerStyles = {};
    this.saveToStorage();
    this.notify();
  }

  public setAnimationSpeed(speed: number) {
    this.animationSpeed = Math.max(0.5, Math.min(2.5, speed));
    this.saveToStorage();
    this.notify();
  }

  public setEffectsIntensity(intensity: 'baixo' | 'normal' | 'intenso') {
    this.effectsIntensity = intensity;
    this.saveToStorage();
    this.notify();
  }

  public triggerPose(targetId: string, pose: string, durationSeconds: number = 6) {
    const expiresAt = Date.now() + durationSeconds * 1000;
    this.activePoses.set(targetId, { pose, expiresAt });
    this.notify();
  }

  public getActivePose(targetId?: string): string | null {
    if (!targetId) return null;
    const item = this.activePoses.get(targetId);
    if (!item) {
      // Also check 'all'
      const allItem = this.activePoses.get('all');
      if (allItem) {
        if (Date.now() > allItem.expiresAt) {
          this.activePoses.delete('all');
          return null;
        }
        return allItem.pose;
      }
      return null;
    }
    if (Date.now() > item.expiresAt) {
      this.activePoses.delete(targetId);
      return null;
    }
    return item.pose;
  }

  public clearPose(targetId: string) {
    this.activePoses.delete(targetId);
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (e) {
        console.error('Error in playerAnimationStore listener:', e);
      }
    }
  }
}

export const playerAnimationStore = new PlayerAnimationStore();
