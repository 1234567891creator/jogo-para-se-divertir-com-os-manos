import React, { useState, useEffect } from 'react';
import { PlayerState, GameRoom, ActiveEnemy, RemotePlayer, SavePoint } from '../game/types';
import { REGIONS } from '../game/regionsData';
import {
  Compass,
  BookOpen,
  Users,
  Volume2,
  VolumeX,
  Sun,
  Image as ImageIcon,
  Clock,
  ShieldAlert,
  Sliders,
  Smartphone,
} from 'lucide-react';
import { spriteStore } from '../game/spriteStore';
import { MiniMap } from './MiniMap';

interface HUDProps {
  player: PlayerState;
  currentRoom: GameRoom;
  activeBoss: ActiveEnemy | null;
  remotePlayers: RemotePlayer[];
  discoveredRooms?: string[];
  activeSavePoint?: SavePoint | null;
  isAdminUnlocked: boolean;
  onOpenMap: () => void;
  onOpenLore: () => void;
  onOpenMultiplayer: () => void;
  onOpenSpriteManager: () => void;
  onOpenAdmin: () => void;
  onOpenSounds: () => void;
  onOpenCodeInput: () => void;
  onToggleMobileControls: () => void;
  isMobileControlsVisible: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onSendQuickEmote: (text: string) => void;
  lanternBrightness: 'normal' | 'bright' | 'max';
  onCycleLantern: () => void;
  onToggleAbility?: (abilityName: keyof PlayerState['abilities']) => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  currentRoom,
  activeBoss,
  remotePlayers,
  discoveredRooms = [],
  activeSavePoint,
  isAdminUnlocked,
  onOpenMap,
  onOpenLore,
  onOpenMultiplayer,
  onOpenSpriteManager,
  onOpenAdmin,
  onOpenSounds,
  onOpenCodeInput,
  onToggleMobileControls,
  isMobileControlsVisible,
  isMuted,
  onToggleMute,
  onSendQuickEmote,
  lanternBrightness,
  onCycleLantern,
  onToggleAbility,
}) => {
  const region = REGIONS[currentRoom.regionId] || REGIONS.lumen_village;

  const lanternLabels = {
    normal: 'Luz: Normal',
    bright: 'Luz: Brilhante',
    max: 'Luz: Máxima',
  };

  const [currentFps, setCurrentFps] = useState(spriteStore.globalFps);

  useEffect(() => {
    const unsub = spriteStore.subscribe(() => {
      setCurrentFps(spriteStore.globalFps);
    });
    return () => unsub();
  }, []);

  const handleCycleSpeed = () => {
    const speeds = [2, 4, 5, 8, 12];
    const next = speeds[(speeds.indexOf(currentFps) + 1) % speeds.length] || 5;
    spriteStore.setGlobalFps(next);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Top Header Bar */}
      <div className="flex items-start justify-between">
        {/* Left: Nox Mask Health & Pulse Vessel */}
        <div className="pointer-events-auto flex items-center gap-4">
          {/* Pulse Vessel (Circular Resonance Meter) */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-950/90 shadow-lg shadow-cyan-950/30">
            {/* Liquid Fill Level */}
            <div
              className="absolute bottom-0 w-full rounded-b-full bg-gradient-to-t from-cyan-600 to-sky-400 transition-all duration-300"
              style={{ height: `${(player.pulse / player.maxPulse) * 100}%`, opacity: 0.85 }}
            />
            {/* Vessel Glass Reflection */}
            <div className="absolute inset-0 rounded-full border border-cyan-400/30" />
            <div className="relative z-10 flex flex-col items-center">
              <span className="font-mono text-xs font-bold text-cyan-200 tabular-nums">
                {Math.round(player.pulse)}%
              </span>
              <span className="text-[9px] uppercase tracking-wider text-cyan-300/80">Pulso</span>
            </div>
          </div>

          {/* Mask Health Vessels */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: player.maxHp }).map((_, i) => {
                const isIntact = i < player.hp;
                return (
                  <div
                    key={i}
                    className={`relative flex h-8 w-7 items-center justify-center rounded-b-lg rounded-t-sm border transition-all duration-200 ${
                      isIntact
                        ? 'border-slate-300 bg-slate-100 shadow-md shadow-white/10'
                        : 'border-slate-700 bg-slate-900/60 opacity-40'
                    }`}
                  >
                    {/* Mask eye slits */}
                    {isIntact ? (
                      <div className="flex gap-1">
                        <div className="h-1.5 w-1 rounded-full bg-cyan-500" />
                        <div className="h-1.5 w-1 rounded-full bg-cyan-500" />
                      </div>
                    ) : (
                      <div className="text-[10px] text-red-500/80 font-mono">✕</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Geo / Echo Shards Counter */}
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="text-cyan-400">✦</span>
              <span className="font-mono tabular-nums">{player.geoOrbs}</span>
              <span className="text-slate-500">·</span>
              <span className="text-[11px] text-slate-400">
                Máscara Trinca: {player.maskCracks}/3
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls & Real-Time Mini-Map Widget */}
        <div className="flex flex-col items-end gap-2 max-w-full">
          {/* Quick Actions Bar */}
          <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap justify-end">
            {/* Admin Panel 847717 Button - ONLY VISIBLE ONCE UNLOCKED VIA TYPING 847717 */}
            {isAdminUnlocked && (
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-1.5 rounded-lg border border-amber-500/80 bg-amber-950/85 px-2.5 py-1 text-xs font-bold text-amber-200 backdrop-blur-md transition-all hover:bg-amber-900 hover:border-amber-400 hover:text-white shadow-md shadow-amber-950/40 animate-pulse"
                title="Painel de Administrador (Desbloqueado com código 847717)"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-mono">847717</span>
              </button>
            )}

            {/* Discreet Code Input Icon */}
            <button
              onClick={onOpenCodeInput}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 backdrop-blur-md transition-colors hover:border-amber-500/50 hover:text-amber-300"
              title="Inserir Código Secreto"
            >
              <span className="font-mono text-xs">#</span>
            </button>

            {/* Sound Studio Modal Button */}
            <button
              onClick={onOpenSounds}
              className="flex items-center gap-1 rounded-lg border border-violet-700/80 bg-violet-950/85 px-2.5 py-1 text-xs font-medium text-violet-200 backdrop-blur-md transition-colors hover:border-violet-400 hover:text-white shadow-sm"
              title="Estúdio de Sons, Volumes e Trilha Sonora"
            >
              <Sliders className="h-3 w-3 text-violet-400" />
              <span className="hidden sm:inline">Sons</span>
            </button>

            {/* Mobile Controls Toggle */}
            <button
              onClick={onToggleMobileControls}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium backdrop-blur-md transition-colors ${
                isMobileControlsVisible
                  ? 'border-cyan-400 bg-cyan-950/90 text-cyan-200 shadow-sm'
                  : 'border-slate-700/80 bg-slate-900/85 text-slate-300 hover:border-slate-500 hover:text-white'
              }`}
              title="Alternar botões de toque para celular na tela"
            >
              <Smartphone className="h-3 w-3 text-cyan-400" />
              <span className="hidden sm:inline">Celular</span>
            </button>

            {/* Lantern Light Level Toggle */}
            <button
              onClick={onCycleLantern}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium backdrop-blur-md transition-colors ${
                lanternBrightness === 'max'
                  ? 'border-amber-400/80 bg-amber-950/80 text-amber-200 shadow-sm'
                  : lanternBrightness === 'bright'
                  ? 'border-cyan-500/80 bg-cyan-950/80 text-cyan-200'
                  : 'border-slate-700/80 bg-slate-900/85 text-slate-200 hover:border-slate-500 hover:text-white'
              }`}
              title="Ajustar intensidade da lanterna e iluminação de Nox"
            >
              <Sun className="h-3 w-3 text-amber-400" />
              <span className="hidden sm:inline">{lanternLabels[lanternBrightness]}</span>
            </button>

            {/* Sprite / Frame Manager Modal Button */}
            <button
              onClick={onOpenSpriteManager}
              className="flex items-center gap-1 rounded-lg border border-cyan-700/80 bg-cyan-950/85 px-2.5 py-1 text-xs font-medium text-cyan-200 backdrop-blur-md transition-colors hover:border-cyan-400 hover:text-white shadow-sm"
              title="Importar imagens PNG de animações sem fundo"
            >
              <ImageIcon className="h-3 w-3 text-cyan-400" />
              <span className="hidden sm:inline">Sprites</span>
            </button>

            {/* Quick Animation Speed Toggle */}
            <button
              onClick={handleCycleSpeed}
              className="flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/85 px-2 py-1 text-xs font-medium text-slate-200 backdrop-blur-md transition-colors hover:border-cyan-500 hover:text-cyan-200 shadow-sm"
              title={`Velocidade da Animação: ${currentFps} FPS`}
            >
              <Clock className="h-3 w-3 text-cyan-400" />
              <span className="font-mono text-[11px] font-bold text-cyan-300">{currentFps} FPS</span>
            </button>

            {/* Audio Mute Toggle */}
            <button
              onClick={onToggleMute}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-900/85 text-slate-300 backdrop-blur-md transition-colors hover:border-slate-500 hover:text-white"
              title={isMuted ? 'Ativar Áudio' : 'Mutar Áudio'}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-slate-300" />}
            </button>

            {/* Map Button */}
            <button
              onClick={onOpenMap}
              className="flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/85 px-2.5 py-1 text-xs font-medium text-slate-200 backdrop-blur-md transition-colors hover:border-slate-500 hover:text-white"
            >
              <Compass className="h-3 w-3 text-sky-400" />
              <span className="hidden sm:inline">Mapa</span>
              <kbd className="rounded bg-slate-800 px-1 text-[10px] text-slate-400 font-mono">M</kbd>
            </button>

            {/* Lore / Tablets Button */}
            <button
              onClick={onOpenLore}
              className="flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/85 px-2.5 py-1 text-xs font-medium text-slate-200 backdrop-blur-md transition-colors hover:border-slate-500 hover:text-white"
            >
              <BookOpen className="h-3 w-3 text-amber-400" />
              <span className="hidden sm:inline">Ecos</span>
              <kbd className="rounded bg-slate-800 px-1 text-[10px] text-slate-400 font-mono">L</kbd>
            </button>

            {/* Multiplayer Co-op Button */}
            <button
              onClick={onOpenMultiplayer}
              className="flex items-center gap-1 rounded-lg border border-cyan-800/80 bg-cyan-950/85 px-2.5 py-1 text-xs font-medium text-cyan-200 backdrop-blur-md transition-colors hover:border-cyan-500 hover:text-white"
            >
              <Users className="h-3 w-3 text-cyan-400" />
              <span className="hidden sm:inline">Co-op</span>
              {remotePlayers.length > 0 && (
                <span className="font-mono text-[10px] text-emerald-400 font-bold">
                  ({remotePlayers.length})
                </span>
              )}
              <kbd className="rounded bg-slate-800 px-1 text-[10px] text-slate-400 font-mono">P</kbd>
            </button>
          </div>

          {/* Real-Time Mini-Map Widget */}
          <MiniMap
            player={player}
            currentRoom={currentRoom}
            remotePlayers={remotePlayers}
            discoveredRooms={discoveredRooms}
            activeSavePoint={activeSavePoint}
            activeBoss={activeBoss}
            onOpenMap={onOpenMap}
          />
        </div>
      </div>

      {/* Online Companion Beacon Pill */}
      {remotePlayers.length > 0 && (
        <div className="pointer-events-auto mx-auto mt-2 flex flex-wrap items-center justify-center gap-2">
          {remotePlayers.map((rp) => (
            <div
              key={rp.id}
              className="flex items-center gap-2 rounded-full border border-cyan-500/60 bg-slate-950/85 px-3 py-1 text-[11px] shadow-lg backdrop-blur-md text-slate-200 animate-fadeIn"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-cyan-300">{rp.name}</span>
              <span className="text-slate-400 text-[10px]">HP {rp.hp}/{rp.maxHp}</span>
              <span className="text-slate-500">·</span>
              <span className="text-[10px] text-amber-300 font-medium">
                [T] Reunir
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Boss Health Bar (When boss active) */}
      {activeBoss && (
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-display font-bold tracking-widest text-amber-400 uppercase">
              {activeBoss.name}
            </span>
            <span className="font-mono text-slate-400 tabular-nums">
              Fase {activeBoss.phase || 1} · {Math.max(0, activeBoss.hp)} / {activeBoss.maxHp}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-sm border border-amber-600/60 bg-slate-950/90 shadow-lg shadow-amber-950/40">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-orange-500 to-amber-300 transition-all duration-150"
              style={{ width: `${Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom Bar: Region Indicator, Quick Emotes & Ability Badges */}
      <div className="flex items-end justify-between">
        {/* Region Title */}
        <div className="flex flex-col">
          <span className="text-[11px] uppercase tracking-widest text-slate-400">
            {region.subtitle}
          </span>
          <h2 className="font-display text-xl md:text-2xl font-bold tracking-wider text-slate-100">
            {region.name}
          </h2>
        </div>

        {/* Quick Co-op Emote Trigger Bar */}
        {remotePlayers.length > 0 && (
          <div className="pointer-events-auto hidden md:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1 backdrop-blur-md">
            <button
              onClick={() => onSendQuickEmote('⚔️ Aqui!')}
              className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              ⚔️ Aqui!
            </button>
            <button
              onClick={() => onSendQuickEmote('⚠️ Cuidado!')}
              className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              ⚠️ Cuidado!
            </button>
            <button
              onClick={() => onSendQuickEmote('✨ Pulso')}
              className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              ✨ Pulso
            </button>
            <button
              onClick={() => onSendQuickEmote('🪡 Descanso')}
              className="rounded px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              🪡 Descanso
            </button>
          </div>
        )}

        {/* Unlocked Abilities Bar with Hotkeys and One-Click Toggle */}
        <div className="pointer-events-auto flex items-center gap-1.5 text-[11px]">
          <button
            onClick={() => onToggleAbility?.('dash')}
            className={`px-2 py-1 rounded border transition-colors ${
              player.abilities.dash
                ? 'border-sky-500/80 text-sky-200 bg-sky-950/60 shadow-sm shadow-sky-950'
                : 'border-slate-800 text-slate-500 bg-slate-950/40 opacity-60'
            }`}
            title="Passo Fantasma (Shift / K / Z / Botão Direito)"
          >
            Passo [Shift]
          </button>
          <button
            onClick={() => onToggleAbility?.('doubleJump')}
            className={`px-2 py-1 rounded border transition-colors ${
              player.abilities.doubleJump
                ? 'border-sky-500/80 text-sky-200 bg-sky-950/60 shadow-sm shadow-sky-950'
                : 'border-slate-800 text-slate-500 bg-slate-950/40 opacity-60'
            }`}
            title="Salto Duplo (Espaço no ar)"
          >
            Salto Duplo [Espaço]
          </button>
          <button
            onClick={() => onToggleAbility?.('wallClimb')}
            className={`px-2 py-1 rounded border transition-colors ${
              player.abilities.wallClimb
                ? 'border-sky-500/80 text-sky-200 bg-sky-950/60 shadow-sm shadow-sky-950'
                : 'border-slate-800 text-slate-500 bg-slate-950/40 opacity-60'
            }`}
            title="Garra de Cinza (Segurar em direção à parede + Espaço para pular)"
          >
            Garra [Paredes]
          </button>
          <button
            onClick={() => onToggleAbility?.('groundPound')}
            className={`px-2 py-1 rounded border transition-colors ${
              player.abilities.groundPound
                ? 'border-sky-500/80 text-sky-200 bg-sky-950/60 shadow-sm shadow-sky-950'
                : 'border-slate-800 text-slate-500 bg-slate-950/40 opacity-60'
            }`}
            title="Mergulho Abissal (S + X no ar)"
          >
            Mergulho [S+X]
          </button>
          <span className="px-2 py-1 rounded border border-cyan-800/80 text-cyan-300 bg-cyan-950/30">
            Focar [Segurar F]
          </span>
        </div>
      </div>
    </div>
  );
};
