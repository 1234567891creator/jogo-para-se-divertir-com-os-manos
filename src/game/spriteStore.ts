/**
 * Echoward: Reino das Cinzas - Custom Sprite & Animation Frame Store
 * 
 * High-capacity, 100% permanent storage using IndexedDB + localStorage fallback.
 * Allows importing custom user sprites for Nox frame-by-frame (e.g. without background PNGs)
 * and supports JSON backup export/import so user changes are NEVER lost.
 */

export type AnimationStateName =
  | 'idle'
  | 'andar'
  | 'correr'
  | 'pulo_inicio'        // Pulo ao apertar (impulso/saída do chão)
  | 'pulo_ar'            // Pulo no ar (subida/ascensão)
  | 'pular'              // Fallback geral de pulo
  | 'queda_ar'           // Queda no ar (descida)
  | 'queda'              // Fallback geral de queda
  | 'aterrissagem'       // Aterrissagem ao tocar o solo
  | 'dash'
  | 'dash_aereo'
  | 'escalada'
  | 'mergulho'
  | 'espada'             // Animação do personagem golpeando com espada
  | 'lamina'             // Efeito visual do corte da lâmina / Slash FX (Arco cortante no ar)
  | 'lamina_vertical'    // Efeito do corte da lâmina para cima
  | 'lamina_baixo'       // Efeito do corte da lâmina para baixo (Pogo)
  | 'ataque_horizontal'  // Corte horizontal
  | 'ataque_vertical'    // Corte ascendente
  | 'ataque_baixo'       // Golpe descendente (Pogo)
  | 'entrar_porta'       // Entrando em portas / passagens / portais
  | 'interagir'          // Interagindo com totens / tábuas / altares
  | 'falar'              // Conversando / dialogando com NPCs
  | 'curar'
  | 'dano'
  | 'morrer';

export interface CustomFrame {
  id: string;
  dataUrl: string;
  imageElement?: HTMLImageElement;
}

export interface AnimationCategory {
  name: AnimationStateName;
  label: string;
  description: string;
  frames: CustomFrame[];
}

const DB_NAME = 'echoward_permanent_assets_v2';
const DB_VERSION = 1;
const STORE_NAME = 'nox_sprites';
const KEY_DATA = 'sprites_payload';
const LOCAL_BACKUP_KEY = 'echoward_custom_nox_sprites_meta';

// Helper to open IndexedDB
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
  };

  public useCustomSprites: boolean = false;
  public isReady: boolean = false;
  public storageType: 'indexeddb' | 'localstorage' = 'indexeddb';
  public globalFps: number = 5; // Default slower animation speed (5 FPS)
  public categoryFps: Partial<Record<AnimationStateName, number>> = {};
  private listeners: Set<() => void> = new Set();
  private saveDebounceTimer: any = null;

  constructor() {
    this.initStore();
  }

  public getFps(category?: AnimationStateName): number {
    if (category && this.categoryFps[category] && this.categoryFps[category]! > 0) {
      return this.categoryFps[category]!;
    }
    return this.globalFps || 5;
  }

  public setGlobalFps(fps: number) {
    this.globalFps = Math.max(1, Math.min(30, Math.round(fps)));
    this.saveToStorage();
    this.notify();
  }

  public setCategoryFps(category: AnimationStateName, fps: number | null) {
    if (fps === null || fps <= 0) {
      delete this.categoryFps[category];
    } else {
      this.categoryFps[category] = Math.max(1, Math.min(30, Math.round(fps)));
    }
    this.saveToStorage();
    this.notify();
  }

  public setAllCategoriesFps(fps: number) {
    const validFps = Math.max(1, Math.min(30, Math.round(fps)));
    this.globalFps = validFps;
    for (const key of Object.keys(this.customSprites) as AnimationStateName[]) {
      this.categoryFps[key] = validFps;
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

  public hasFrames(state: AnimationStateName): boolean {
    const arr = this.customSprites[state];
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

  /**
   * Retrieves active frame for rendering. Fallback chains:
   * espada -> directional slashes
   * ataque_horizontal -> espada
   */
  public getFrame(state: AnimationStateName, timeSeconds: number, fpsOverride?: number): HTMLImageElement | null {
    if (!this.useCustomSprites) return null;

    let targetState = state;
    if (!this.hasFrames(targetState)) {
      if (state === 'pulo_inicio') {
        if (this.hasFrames('pular')) targetState = 'pular';
        else if (this.hasFrames('pulo_ar')) targetState = 'pulo_ar';
      } else if (state === 'pulo_ar') {
        if (this.hasFrames('pular')) targetState = 'pular';
        else if (this.hasFrames('pulo_inicio')) targetState = 'pulo_inicio';
      } else if (state === 'pular') {
        if (this.hasFrames('pulo_ar')) targetState = 'pulo_ar';
        else if (this.hasFrames('pulo_inicio')) targetState = 'pulo_inicio';
      } else if (state === 'queda_ar') {
        if (this.hasFrames('queda')) targetState = 'queda';
      } else if (state === 'queda') {
        if (this.hasFrames('queda_ar')) targetState = 'queda_ar';
      } else if (state === 'ataque_horizontal' || state === 'ataque_vertical' || state === 'ataque_baixo') {
        if (this.hasFrames('espada')) {
          targetState = 'espada';
        }
      } else if (state === 'espada') {
        if (this.hasFrames('ataque_horizontal')) {
          targetState = 'ataque_horizontal';
        }
      } else if (state === 'lamina_vertical' || state === 'lamina_baixo') {
        if (this.hasFrames('lamina')) {
          targetState = 'lamina';
        }
      } else if (state === 'lamina') {
        if (this.hasFrames('lamina_vertical')) {
          targetState = 'lamina_vertical';
        }
      } else if (state === 'dash_aereo' && this.hasFrames('dash')) {
        targetState = 'dash';
      } else if (state === 'correr' && this.hasFrames('andar')) {
        targetState = 'andar';
      }
    }

    const frames = this.customSprites[targetState];
    if (!frames || frames.length === 0) return null;

    const fps = fpsOverride !== undefined ? fpsOverride : this.getFps(targetState);
    const frameIdx = Math.floor(timeSeconds * fps) % frames.length;
    const frame = frames[frameIdx];
    if (!frame) return null;

    if (!frame.imageElement) {
      const img = new Image();
      img.src = frame.dataUrl;
      frame.imageElement = img;
    }
    return frame.imageElement.complete ? frame.imageElement : null;
  }

  /**
   * Permanent save into IndexedDB (supports high capacity without 5MB quota limit)
   */
  public saveToStorage() {
    clearTimeout(this.saveDebounceTimer);
    this.saveDebounceTimer = setTimeout(async () => {
      try {
        const serialized: Record<string, string[]> = {};
        for (const [key, frames] of Object.entries(this.customSprites)) {
          if (Array.isArray(frames)) {
            serialized[key] = frames.map((f) => f.dataUrl);
          }
        }

        const payload = {
          version: 2,
          updatedAt: new Date().toISOString(),
          useCustomSprites: this.useCustomSprites,
          globalFps: this.globalFps,
          categoryFps: this.categoryFps,
          sprites: serialized,
        };

        // Save to IndexedDB
        try {
          const db = await openIndexedDB();
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          store.put(payload, KEY_DATA);
          await new Promise((res, rej) => {
            tx.oncomplete = res;
            tx.onerror = rej;
          });
          this.storageType = 'indexeddb';
        } catch (idbErr) {
          console.warn('IndexedDB write failed, trying localStorage:', idbErr);
          this.storageType = 'localstorage';
          // Fallback to localStorage if possible
          localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(payload));
        }

        // Keep lightweight meta in localStorage
        try {
          localStorage.setItem('echoward_use_custom_sprites', JSON.stringify(this.useCustomSprites));
          localStorage.setItem('echoward_custom_sprites_count', JSON.stringify(this.getTotalFrameCount()));
          localStorage.setItem('echoward_animation_global_fps', JSON.stringify(this.globalFps));
          localStorage.setItem('echoward_animation_category_fps', JSON.stringify(this.categoryFps));
        } catch {
          // ignore
        }
      } catch (err) {
        console.error('Fatal error saving sprites:', err);
      }
    }, 150);
  }

  /**
   * Initializes store by loading from IndexedDB, migrating from localStorage if needed
   */
  private async initStore() {
    try {
      let loaded = false;

      // 1. Try IndexedDB
      try {
        const db = await openIndexedDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(KEY_DATA);

        const data: any = await new Promise((res, rej) => {
          req.onsuccess = () => res(req.result);
          req.onerror = rej;
        });

        if (data && data.sprites) {
          this.hydrateFromPayload(data);
          this.storageType = 'indexeddb';
          loaded = true;
        }
      } catch (idbErr) {
        console.info('IndexedDB read skipped/failed, trying localStorage fallback:', idbErr);
      }

      // 2. Fallback to localStorage (migration or fallback)
      if (!loaded && typeof window !== 'undefined') {
        const legacy = localStorage.getItem('echoward_custom_nox_sprites_v1');
        const meta = localStorage.getItem(LOCAL_BACKUP_KEY);
        const raw = meta || legacy;

        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const sprites = parsed.sprites || parsed;
            this.hydrateFromPayload({
              sprites,
              useCustomSprites: parsed.useCustomSprites ?? true,
            });
            // Immediately migrate to IndexedDB for permanent storage
            this.saveToStorage();
            loaded = true;
          } catch (parseErr) {
            console.warn('Error reading legacy storage:', parseErr);
          }
        }
      }

      const rawUse = localStorage.getItem('echoward_use_custom_sprites');
      if (rawUse !== null) {
        this.useCustomSprites = JSON.parse(rawUse);
      }

      const rawFps = localStorage.getItem('echoward_animation_global_fps');
      if (rawFps !== null) {
        try {
          const parsedFps = JSON.parse(rawFps);
          if (typeof parsedFps === 'number' && parsedFps > 0) {
            this.globalFps = parsedFps;
          }
        } catch {}
      }

      const rawCatFps = localStorage.getItem('echoward_animation_category_fps');
      if (rawCatFps !== null) {
        try {
          const parsedCatFps = JSON.parse(rawCatFps);
          if (parsedCatFps && typeof parsedCatFps === 'object') {
            this.categoryFps = parsedCatFps;
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
        if (this.customSprites[stateKey] && Array.isArray(urls)) {
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
   * Export all sprites and animations as a downloadable JSON backup file
   */
  public exportBackup(): string {
    const serialized: Record<string, string[]> = {};
    for (const [key, frames] of Object.entries(this.customSprites)) {
      if (Array.isArray(frames)) {
        serialized[key] = frames.map((f) => f.dataUrl);
      }
    }
    const backup = {
      app: 'Echoward: Reino das Cinzas',
      type: 'nox_custom_sprites_pack',
      exportedAt: new Date().toISOString(),
      useCustomSprites: this.useCustomSprites,
      totalFrames: this.getTotalFrameCount(),
      sprites: serialized,
    };
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Import a JSON backup file and apply all sprites immediately
   */
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
