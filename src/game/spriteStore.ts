/**
 * Echoward: Reino das Cinzas - Custom Sprite & Animation Frame Store
 * 
 * High-capacity, 100% permanent storage using IndexedDB + localStorage fallback + Embedded Code Export.
 * Supports custom frame-by-frame sprites for Nox, NPCs (interação e idle), and Enemies.
 */

import { EMBEDDED_SPRITES_DATABASE, generateEmbeddedSpritesCode } from './embeddedSprites';

export type AnimationStateName =
  // Nox (Jogador)
  | 'idle'
  | 'andar'
  | 'correr'
  | 'pulo_inicio'
  | 'pulo_ar'
  | 'pular'
  | 'queda_ar'
  | 'queda'
  | 'aterrissagem'
  | 'dash'
  | 'dash_aereo'
  | 'escalada'
  | 'mergulho'
  | 'espada'
  | 'lamina'
  | 'lamina_vertical'
  | 'lamina_baixo'
  | 'ataque_horizontal'
  | 'ataque_vertical'
  | 'ataque_baixo'
  | 'entrar_porta'
  | 'interagir'
  | 'falar'
  | 'curar'
  | 'dano'
  | 'morrer'
  // NPCs
  | 'npc_idle'
  | 'npc_interagir'
  | 'npc_kaelen'
  | 'npc_vael'
  | 'npc_sola'
  | 'npc_orin'
  // Inimigos
  | 'enemy_crawler'
  | 'enemy_specter'
  | 'enemy_sentinel'
  | 'enemy_diver'
  | 'enemy_boss_guardian'
  | 'enemy_boss_shade'
  | 'enemy_dano'
  | 'enemy_morte';

export interface CustomFrame {
  id: string;
  dataUrl: string;
  imageElement?: HTMLImageElement;
}

export type CategoryGroup = 'nox' | 'npc' | 'enemy';

export interface AnimationCategoryInfo {
  key: AnimationStateName;
  label: string;
  desc: string;
  group: CategoryGroup;
  defaultFps: number;
}

export const ANIMATION_CATEGORIES: AnimationCategoryInfo[] = [
  // --- NOX (JOGADOR) ---
  { key: 'correr', label: 'Correr (Movimento Contínuo)', desc: 'Movimentação principal em velocidade', group: 'nox', defaultFps: 5 },
  { key: 'andar', label: 'Andar (Passos Lentos)', desc: 'Movimentação cautelosa', group: 'nox', defaultFps: 4 },
  { key: 'idle', label: 'Parado (Idle)', desc: 'Respiração sutil do personagem parado', group: 'nox', defaultFps: 3 },
  { key: 'pulo_inicio', label: 'Pulo ao Apertar (Impulso)', desc: 'Compressão e saída rápida do solo', group: 'nox', defaultFps: 8 },
  { key: 'pulo_ar', label: 'Pulo no Ar (Ascensão)', desc: 'Subida elástica pelo ar', group: 'nox', defaultFps: 6 },
  { key: 'pular', label: 'Pulo Geral (Fallback)', desc: 'Animação padrão no ar', group: 'nox', defaultFps: 6 },
  { key: 'queda_ar', label: 'Queda no Ar (Descida)', desc: 'Flutuação da capa em paraquedas durante queda', group: 'nox', defaultFps: 5 },
  { key: 'queda', label: 'Queda Geral', desc: 'Descida no ar', group: 'nox', defaultFps: 5 },
  { key: 'aterrissagem', label: 'Aterrissagem ao Chão', desc: 'Absorção de impacto ao tocar o solo', group: 'nox', defaultFps: 8 },
  { key: 'dash', label: 'Passo Fantasma (Dash Solo)', desc: 'Deslocamento horizontal súbito no solo', group: 'nox', defaultFps: 10 },
  { key: 'dash_aereo', label: 'Dash Aéreo', desc: 'Investida rápida no ar', group: 'nox', defaultFps: 10 },
  { key: 'espada', label: 'Ataque de Espada (Pose de Nox)', desc: 'Pose corporal do personagem atacando', group: 'nox', defaultFps: 8 },
  { key: 'lamina', label: 'Lâmina / Slash FX (Horizontal)', desc: 'Efeito visual do rastro cortante no ar', group: 'nox', defaultFps: 12 },
  { key: 'lamina_vertical', label: 'Lâmina / Slash FX (Cima)', desc: 'Corte ascendente no ar', group: 'nox', defaultFps: 12 },
  { key: 'lamina_baixo', label: 'Lâmina / Slash FX (Pogo Baixo)', desc: 'Corte descendente de quique no ar', group: 'nox', defaultFps: 12 },
  { key: 'ataque_horizontal', label: 'Ataque Horizontal Completo', desc: 'Personagem golpeando para os lados', group: 'nox', defaultFps: 8 },
  { key: 'ataque_vertical', label: 'Ataque Ascendente (Cima)', desc: 'Personagem golpeando para cima', group: 'nox', defaultFps: 8 },
  { key: 'ataque_baixo', label: 'Ataque Descendente (Pogo)', desc: 'Golpe para baixo para quicar', group: 'nox', defaultFps: 8 },
  { key: 'escalada', label: 'Garra de Cinza (Escalada)', desc: 'Deslizar e segurar em paredes', group: 'nox', defaultFps: 4 },
  { key: 'mergulho', label: 'Mergulho Abissal', desc: 'Descida pesada que destrói pisos frágeis', group: 'nox', defaultFps: 8 },
  { key: 'curar', label: 'Cura de Alma / Foco', desc: 'Concentração brilhante de Pulso', group: 'nox', defaultFps: 6 },
  { key: 'entrar_porta', label: 'Entrando em Portas', desc: 'Transição ao entrar em portais e passagens', group: 'nox', defaultFps: 5 },
  { key: 'interagir', label: 'Interagindo com Altares/Totens', desc: 'Ativação de totens de descanso e tábuas', group: 'nox', defaultFps: 5 },
  { key: 'falar', label: 'Conversando com NPCs', desc: 'Diálogo e escuta atenta', group: 'nox', defaultFps: 4 },
  { key: 'dano', label: 'Receber Dano', desc: 'Reação de impacto ao ser atingido', group: 'nox', defaultFps: 8 },
  { key: 'morrer', label: 'Desfalecer / Morte', desc: 'Máscara quebrando e dissolução de cinzas', group: 'nox', defaultFps: 4 },

  // --- NPCS (HABITANTES DE ECHOWARD) ---
  { key: 'npc_idle', label: 'NPC Geral (Parado / Idle)', desc: 'Animação padrão para todos os habitantes no mapa', group: 'npc', defaultFps: 4 },
  { key: 'npc_interagir', label: 'NPC em Interação / Diálogo', desc: 'Animação ativada quando o jogador conversa com o NPC', group: 'npc', defaultFps: 5 },
  { key: 'npc_kaelen', label: 'Ancião Kaelen (Vila Lumen)', desc: 'O sábio guardião do vilarejo de cinzas', group: 'npc', defaultFps: 4 },
  { key: 'npc_vael', label: 'Mercador Vael (Comerciante)', desc: 'O vendedor errante de fragmentos e relíquias', group: 'npc', defaultFps: 4 },
  { key: 'npc_sola', label: 'Cartógrafa Sola', desc: 'A exploradora que desenha os mapas do reino', group: 'npc', defaultFps: 4 },
  { key: 'npc_orin', label: 'Arquivista Orin', desc: 'O guardião das memórias antigas de Ner', group: 'npc', defaultFps: 3 },

  // --- INIMIGOS & MONSTROS ---
  { key: 'enemy_crawler', label: 'Besouro das Cinzas (Crawler)', desc: 'Monstro rastejante comum dos túneis', group: 'enemy', defaultFps: 5 },
  { key: 'enemy_specter', label: 'Mariposa de Ressonância (Specter)', desc: 'Inimigo voador luminoso que persegue no ar', group: 'enemy', defaultFps: 6 },
  { key: 'enemy_sentinel', label: 'Sentinela de Cobre (Varron)', desc: 'Guardião pesado com escudo impenetrável', group: 'enemy', defaultFps: 4 },
  { key: 'enemy_diver', label: 'Mergulhador do Abismo', desc: 'Morcego sombrio que realiza voos rasantes', group: 'enemy', defaultFps: 6 },
  { key: 'enemy_boss_guardian', label: 'Chefe: Guardião do Silêncio', desc: 'O colosso ancestral da Catedral Quebrada', group: 'enemy', defaultFps: 4 },
  { key: 'enemy_boss_shade', label: 'Chefe: A Sombra de Ner', desc: 'A entidade abissal de pura escuridão', group: 'enemy', defaultFps: 5 },
  { key: 'enemy_dano', label: 'Efeito de Dano no Inimigo', desc: 'Reação rápida quando qualquer inimigo toma golpe', group: 'enemy', defaultFps: 8 },
  { key: 'enemy_morte', label: 'Efeito de Morte do Inimigo', desc: 'Dissolução e explosão de partículas ao ser derrotado', group: 'enemy', defaultFps: 6 },
];

const DB_NAME = 'echoward_permanent_assets_v3';
const DB_VERSION = 1;
const STORE_NAME = 'custom_sprites';
const KEY_DATA = 'sprites_payload';
const LOCAL_BACKUP_KEY = 'echoward_custom_sprites_meta';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

class SpriteStore {
  public customSprites: Record<AnimationStateName, CustomFrame[]> = {
    // Nox
    idle: [],
    andar: [],
    correr: [],
    pulo_inicio: [],
    pulo_ar: [],
    pular: [],
    queda_ar: [],
    queda: [],
    aterrissagem: [],
    dash: [],
    dash_aereo: [],
    escalada: [],
    mergulho: [],
    espada: [],
    lamina: [],
    lamina_vertical: [],
    lamina_baixo: [],
    ataque_horizontal: [],
    ataque_vertical: [],
    ataque_baixo: [],
    entrar_porta: [],
    interagir: [],
    falar: [],
    curar: [],
    dano: [],
    morrer: [],
    // NPCs
    npc_idle: [],
    npc_interagir: [],
    npc_kaelen: [],
    npc_vael: [],
    npc_sola: [],
    npc_orin: [],
    // Inimigos
    enemy_crawler: [],
    enemy_specter: [],
    enemy_sentinel: [],
    enemy_diver: [],
    enemy_boss_guardian: [],
    enemy_boss_shade: [],
    enemy_dano: [],
    enemy_morte: [],
  };

  public useCustomSprites: boolean = false;
  public isReady: boolean = false;
  public storageType: 'indexeddb' | 'localstorage' = 'indexeddb';
  public globalFps: number = 5;
  public categoryFps: Partial<Record<AnimationStateName, number>> = {};
  private listeners: Set<() => void> = new Set();
  private saveDebounceTimer: any = null;

  constructor() {
    this.initStore();
  }

  public getFps(category?: AnimationStateName | string): number {
    if (category && (this.categoryFps as any)[category] && (this.categoryFps as any)[category] > 0) {
      return (this.categoryFps as any)[category];
    }
    return this.globalFps || 5;
  }

  public setGlobalFps(fps: number) {
    this.globalFps = Math.max(1, Math.min(30, Math.round(fps)));
    this.saveToStorage();
    this.notify();
  }

  public setCategoryFps(category: AnimationStateName | string, fps: number | null) {
    if (fps === null || fps <= 0) {
      delete (this.categoryFps as any)[category];
    } else {
      (this.categoryFps as any)[category] = Math.max(1, Math.min(30, Math.round(fps)));
    }
    this.saveToStorage();
    this.notify();
  }

  public setAllCategoriesFps(fps: number) {
    const validFps = Math.max(1, Math.min(30, Math.round(fps)));
    this.globalFps = validFps;
    for (const cat of ANIMATION_CATEGORIES) {
      (this.categoryFps as any)[cat.key] = validFps;
    }
    this.saveToStorage();
    this.notify();
  }

  public subscribe(cb: () => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('SpriteStore listener error:', err);
      }
    });
  }

  public hasFrames(state: AnimationStateName | string): boolean {
    const arr = (this.customSprites as any)[state];
    return Array.isArray(arr) && arr.length > 0;
  }

  public getTotalFrameCount(): number {
    return Object.values(this.customSprites).reduce(
      (acc, frames) => acc + (frames?.length || 0),
      0
    );
  }

  public addFrame(state: AnimationStateName, dataUrl: string) {
    const img = new Image();
    img.src = dataUrl;
    const frame: CustomFrame = {
      id: `${state}_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      dataUrl,
      imageElement: img,
    };

    if (!this.customSprites[state]) {
      this.customSprites[state] = [];
    }
    this.customSprites[state].push(frame);
    this.useCustomSprites = true;

    this.saveToStorage();
    this.notify();
  }

  public removeFrame(state: AnimationStateName, frameId: string) {
    if (this.customSprites[state]) {
      this.customSprites[state] = this.customSprites[state].filter((f) => f.id !== frameId);
      this.saveToStorage();
      this.notify();
    }
  }

  public clearCategory(state: AnimationStateName) {
    if (this.customSprites[state]) {
      this.customSprites[state] = [];
      this.saveToStorage();
      this.notify();
    }
  }

  public setUseCustom(val: boolean) {
    this.useCustomSprites = val;
    this.saveToStorage();
    this.notify();
  }

  public getFrame(
    state: AnimationStateName | string,
    timeInSeconds: number,
    fpsOverride?: number
  ): HTMLImageElement | null {
    if (!this.useCustomSprites) return null;
    const frames = (this.customSprites as any)[state];
    if (!frames || frames.length === 0) return null;

    const fps = fpsOverride && fpsOverride > 0 ? fpsOverride : this.getFps(state);
    const frameIndex = Math.floor(timeInSeconds * fps) % frames.length;
    const target = frames[frameIndex];

    if (!target) return null;

    if (!target.imageElement) {
      const img = new Image();
      img.src = target.dataUrl;
      target.imageElement = img;
    }

    if (target.imageElement.complete && target.imageElement.naturalWidth > 0) {
      return target.imageElement;
    }

    return null;
  }

  public saveToStorage() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.executeSave();
    }, 250);
  }

  private async executeSave() {
    const serializedSprites: Record<string, string[]> = {};
    for (const [key, frames] of Object.entries(this.customSprites)) {
      if (Array.isArray(frames)) {
        serializedSprites[key] = frames.map((f) => f.dataUrl);
      }
    }

    const payload = {
      useCustomSprites: this.useCustomSprites,
      globalFps: this.globalFps,
      categoryFps: this.categoryFps,
      sprites: serializedSprites,
      savedAt: Date.now(),
    };

    try {
      localStorage.setItem('echoward_animation_global_fps', String(this.globalFps));
      localStorage.setItem('echoward_animation_category_fps', JSON.stringify(this.categoryFps));
    } catch {}

    try {
      const db = await openIndexedDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(payload, KEY_DATA);
      this.storageType = 'indexeddb';
    } catch (e) {
      console.warn('IndexedDB write failed, falling back to localStorage:', e);
      try {
        localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(payload));
        this.storageType = 'localstorage';
      } catch (err) {
        console.error('LocalStorage quota exceeded as well:', err);
      }
    }
  }

  private async initStore() {
    try {
      // 1. Try loading from Embedded Code Database first if present
      if (EMBEDDED_SPRITES_DATABASE && Object.keys(EMBEDDED_SPRITES_DATABASE).length > 0) {
        for (const [catKey, frames] of Object.entries(EMBEDDED_SPRITES_DATABASE)) {
          const typedKey = catKey as AnimationStateName;
          if (Array.isArray(frames) && frames.length > 0 && this.customSprites[typedKey]) {
            this.customSprites[typedKey] = frames.map((f) => {
              const img = new Image();
              img.src = f.dataUrl;
              return { id: f.id, dataUrl: f.dataUrl, imageElement: img };
            });
            this.useCustomSprites = true;
          }
        }
      }

      // 2. Try hydrating from IndexedDB (User overrides)
      try {
        const db = await openIndexedDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(KEY_DATA);

        await new Promise<void>((resolve) => {
          req.onsuccess = () => {
            if (req.result) {
              this.hydrateFromPayload(req.result);
              this.storageType = 'indexeddb';
            }
            resolve();
          };
          req.onerror = () => resolve();
        });
      } catch {
        const localData = localStorage.getItem(LOCAL_BACKUP_KEY);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);
            this.hydrateFromPayload(parsed);
            this.storageType = 'localstorage';
          } catch {}
        }
      }

      // 3. Hydrate FPS values
      const rawFps = localStorage.getItem('echoward_animation_global_fps');
      if (rawFps) {
        const val = parseInt(rawFps, 10);
        if (!isNaN(val) && val > 0) {
          this.globalFps = val;
        }
      }

      const rawCatFps = localStorage.getItem('echoward_animation_category_fps');
      if (rawCatFps) {
        try {
          const parsed = JSON.parse(rawCatFps);
          if (parsed && typeof parsed === 'object') {
            this.categoryFps = parsed;
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Could not complete sprite hydration:', e);
    } finally {
      this.isReady = true;
      this.notify();
    }
  }

  private hydrateFromPayload(payload: {
    sprites: Record<string, string[]>;
    useCustomSprites?: boolean;
    globalFps?: number;
    categoryFps?: Partial<Record<AnimationStateName, number>>;
  }) {
    if (payload.useCustomSprites !== undefined) {
      this.useCustomSprites = payload.useCustomSprites;
    }
    if (payload.globalFps !== undefined && typeof payload.globalFps === 'number' && payload.globalFps > 0) {
      this.globalFps = payload.globalFps;
    }
    if (payload.categoryFps && typeof payload.categoryFps === 'object') {
      this.categoryFps = payload.categoryFps;
    }

    if (payload.sprites) {
      for (const [key, urls] of Object.entries(payload.sprites)) {
        const stateKey = key as AnimationStateName;
        if ((this.customSprites as any)[stateKey] && Array.isArray(urls) && urls.length > 0) {
          this.customSprites[stateKey] = urls.map((url) => {
            const img = new Image();
            img.src = url;
            return {
              id: `${stateKey}_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
              dataUrl: url,
              imageElement: img,
            };
          });
        }
      }
    }
  }

  /**
   * Export code for embeddedSprites.ts so user can embed sprites permanently in source code
   */
  public exportAsEmbeddedCode(): string {
    const formatted: Record<string, { id: string; dataUrl: string }[]> = {};
    for (const [key, frames] of Object.entries(this.customSprites)) {
      if (Array.isArray(frames) && frames.length > 0) {
        formatted[key] = frames.map((f) => ({ id: f.id, dataUrl: f.dataUrl }));
      }
    }
    return generateEmbeddedSpritesCode(formatted);
  }

  public exportBackup(): string {
    const serialized: Record<string, string[]> = {};
    for (const [key, frames] of Object.entries(this.customSprites)) {
      if (Array.isArray(frames)) {
        serialized[key] = frames.map((f) => f.dataUrl);
      }
    }
    const backup = {
      app: 'Echoward: Reino das Cinzas',
      type: 'echoward_complete_sprites_pack',
      exportedAt: new Date().toISOString(),
      useCustomSprites: this.useCustomSprites,
      totalFrames: this.getTotalFrameCount(),
      sprites: serialized,
    };
    return JSON.stringify(backup, null, 2);
  }

  public async importBackup(jsonString: string): Promise<{ success: boolean; frameCount: number }> {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !data.sprites) {
        throw new Error('Formato de backup inválido.');
      }
      this.hydrateFromPayload(data);
      this.useCustomSprites = true;
      this.saveToStorage();
      this.notify();
      return { success: true, frameCount: this.getTotalFrameCount() };
    } catch (err) {
      console.error('Falha ao importar backup:', err);
      return { success: false, frameCount: 0 };
    }
  }
}

export const spriteStore = new SpriteStore();
