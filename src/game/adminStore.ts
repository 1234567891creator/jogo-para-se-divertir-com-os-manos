/**
 * Echoward: Reino das Cinzas - Admin & God Mode Store
 * Ativado pelo código secreto: 847717
 */

export interface AdminSettings {
  godMode: boolean;           // Invencibilidade absoluta contra dano e espinhos
  infiniteHp: boolean;        // Vida travada no máximo
  infinitePulse: boolean;     // Pulso/Vigor travado em 100%
  noclip: boolean;            // Voar e atravessar paredes
  speedMultiplier: number;    // 1.0x a 3.0x
  jumpMultiplier: number;     // 1.0x a 2.5x
  infiniteAirJumps: boolean;  // Pulo duplo sem limites no ar
  slowMotion: boolean;        // Câmera lenta
  oneHitKill: boolean;        // Inimigos morrem com 1 golpe
}

class AdminStore {
  public settings: AdminSettings = {
    godMode: false,
    infiniteHp: false,
    infinitePulse: false,
    noclip: false,
    speedMultiplier: 1.0,
    jumpMultiplier: 1.0,
    infiniteAirJumps: false,
    slowMotion: false,
    oneHitKill: false,
  };

  private listeners: Set<() => void> = new Set();

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
      } catch (e) {
        console.error('AdminStore listener error:', e);
      }
    });
  }

  public updateSetting<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    this.settings[key] = value;
    this.notify();
  }

  public resetAll() {
    this.settings = {
      godMode: false,
      infiniteHp: false,
      infinitePulse: false,
      noclip: false,
      speedMultiplier: 1.0,
      jumpMultiplier: 1.0,
      infiniteAirJumps: false,
      slowMotion: false,
      oneHitKill: false,
    };
    this.notify();
  }
}

export const adminStore = new AdminStore();
