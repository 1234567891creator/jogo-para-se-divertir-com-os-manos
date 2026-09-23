/**
 * Echoward: Reino das Cinzas - Melancholic Procedural Audio Engine
 * Uses Web Audio API to create responsive sounds and atmospheric background music
 */

import { RegionId } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private currentRegion: RegionId | null = null;
  private musicTimer: number | null = null;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.isInitialized = true;
      this.startAmbientMusic('lumen_village');
    } catch (e) {
      console.warn('AudioContext failed to initialize:', e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted() {
    return this.isMuted;
  }

  public startAmbientMusic(region: RegionId) {
    if (!this.ctx || !this.isInitialized) return;
    if (this.currentRegion === region && this.musicTimer !== null) return;
    this.currentRegion = region;

    if (this.musicTimer) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }

    // Melodic notes depending on region
    const scales: Record<string, number[]> = {
      lumen_village: [220, 261.63, 329.63, 392.0, 440, 523.25], // A minor / serene
      echo_forest: [196, 233.08, 293.66, 349.23, 392, 466.16],   // G minor moody
      varron_mines: [146.83, 174.61, 220, 246.94, 293.66, 329.63], // D minor gritty
      broken_cathedral: [110, 164.81, 220, 261.63, 329.63, 440],  // Low ancient liturgical
      ner_abyss: [82.41, 110, 130.81, 155.56, 174.61, 220],       // Deep dissonance
      default: [220, 261.63, 329.63, 392, 440]
    };

    const notePool = scales[region] || scales.default;

    // Ambient note generator
    const playAmbientNote = () => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const note = notePool[Math.floor(Math.random() * notePool.length)];
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = region === 'ner_abyss' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(note, this.ctx.currentTime);

      const duration = 2.5 + Math.random() * 2.0;
      noteGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      noteGain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.8);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(noteGain);
      noteGain.connect(this.musicGain);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    };

    // Play first note immediately and then on interval
    playAmbientNote();
    this.musicTimer = window.setInterval(playAmbientNote, 3200);
  }

  public playSlash(direction: 'side' | 'up' | 'down') {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = direction === 'up' ? 380 : direction === 'down' ? 520 : 440;
    const endFreq = direction === 'up' ? 700 : direction === 'down' ? 240 : 280;

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  public playHit() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    // Low punchy thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);

    // Resonant metallic click
    const click = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(820, this.ctx.currentTime);
    clickGain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    clickGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    click.connect(clickGain);
    clickGain.connect(this.sfxGain);
    click.start();
    click.stop(this.ctx.currentTime + 0.06);
  }

  public playPogo() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(740, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.23);
  }

  public playDash() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.17);
  }

  public playJump(isDouble = false) {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isDouble ? 'triangle' : 'sine';
    const startFreq = isDouble ? 340 : 220;
    const endFreq = isDouble ? 560 : 360;

    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.13);
  }

  public playHealFocus() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(261.63, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(523.25, this.ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.65);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.66);
  }

  public playHealComplete() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    // Chime triad
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + i * 0.06);

      gain.gain.setValueAtTime(0.001, this.ctx!.currentTime + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.12, this.ctx!.currentTime + i * 0.06 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + i * 0.06 + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(this.ctx!.currentTime + i * 0.06);
      osc.stop(this.ctx!.currentTime + i * 0.06 + 0.85);
    });
  }

  public playSpellCast() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(680, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  public playDamage() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.23);
  }

  public playGroundPound() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.4);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.42);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.43);
  }

  public playTotemRest() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    [329.63, 440, 554.37, 659.25].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.1, this.ctx!.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.1 + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(this.ctx!.currentTime + idx * 0.1);
      osc.stop(this.ctx!.currentTime + idx * 0.1 + 0.75);
    });
  }
}

export const soundEngine = new SoundEngine();
