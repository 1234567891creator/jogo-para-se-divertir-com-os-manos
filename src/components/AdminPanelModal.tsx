/**
 * Echoward: Reino das Cinzas - Admin Panel (Código Secreto: 847717)
 * Permite controle total do jogo: God Mode, Noclip, Vida/Pulso infinitos, teleporte,
 * multiplicadores de velocidade e pulo, habilidades e spawn de inimigos.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Zap,
  Heart,
  Sparkles,
  Wind,
  Compass,
  Skull,
  X,
  Volume2,
  Sliders,
  Check,
  RefreshCw,
  Eye,
  Crosshair,
  Flame,
} from 'lucide-react';
import { adminStore, AdminSettings } from '../game/adminStore';
import { GAME_ROOMS } from '../game/worldMap';
import { GameRoom, PlayerState } from '../game/types';
import { soundEngine } from '../game/audio';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerState;
  setPlayer: React.Dispatch<React.SetStateAction<PlayerState>>;
  currentRoom: GameRoom;
  onTeleportRoom: (room: GameRoom, targetX?: number, targetY?: number) => void;
  onOpenSprites: () => void;
  onOpenSounds: () => void;
  onKillAllEnemies: () => void;
  onSpawnEnemy: (type: 'crawler' | 'specter' | 'varron_sentinel' | 'abyss_diver' | 'boss_guardian' | 'boss_varron_colossus' | 'boss_shade') => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  player,
  setPlayer,
  currentRoom,
  onTeleportRoom,
  onOpenSprites,
  onOpenSounds,
  onKillAllEnemies,
  onSpawnEnemy,
}) => {
  const [activeTab, setActiveTab] = useState<'cheats' | 'physics' | 'teleport' | 'spawns'>('cheats');
  const [settings, setSettings] = useState<AdminSettings>(adminStore.settings);
  const [copiedFeedback, setCopiedFeedback] = useState(false);

  useEffect(() => {
    return adminStore.subscribe(() => {
      setSettings({ ...adminStore.settings });
    });
  }, []);

  if (!isOpen) return null;

  const toggleCheat = (key: keyof AdminSettings) => {
    const newVal = !settings[key];
    adminStore.updateSetting(key, newVal as any);
    soundEngine.playPogo();
  };

  const handleSpeedChange = (val: number) => {
    adminStore.updateSetting('speedMultiplier', val);
  };

  const handleJumpChange = (val: number) => {
    adminStore.updateSetting('jumpMultiplier', val);
  };

  const handleHealFull = () => {
    setPlayer((prev) => ({ ...prev, hp: prev.maxHp }));
    soundEngine.playHealComplete();
  };

  const handlePulseFull = () => {
    setPlayer((prev) => ({ ...prev, pulse: prev.maxPulse }));
    soundEngine.playSpellCast();
  };

  const handleAddGeo = (amount: number) => {
    setPlayer((prev) => ({ ...prev, shardsCount: prev.shardsCount + amount }));
    soundEngine.playCollectShard();
  };

  const handleUnlockAllAbilities = () => {
    setPlayer((prev) => ({
      ...prev,
      abilities: {
        dash: true,
        doubleJump: true,
        wallClimb: true,
        groundPound: true,
        rewind: true,
        memoryVision: true,
      },
    }));
    soundEngine.playSecretCodeSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-amber-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-serif text-amber-300 tracking-wide">
                  Painel de Administrador
                </h2>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-mono font-bold">
                  CÓDIGO: 847717
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Menu de desenvolvedor, modo deus, trapaças cósmicas e teleporte
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                adminStore.resetAll();
                soundEngine.playDamage();
              }}
              className="text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1 border border-slate-700"
              title="Resetar trapaças para o padrão"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Resetar
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-950/60 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('cheats')}
            className={`px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'cheats'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            Modo Deus & Vida
          </button>

          <button
            onClick={() => setActiveTab('physics')}
            className={`px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'physics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Wind className="w-4 h-4 text-cyan-400" />
            Noclip, Salto & Velocidade
          </button>

          <button
            onClick={() => setActiveTab('teleport')}
            className={`px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'teleport'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            Teleporte de Salas ({Object.keys(GAME_ROOMS).length})
          </button>

          <button
            onClick={() => setActiveTab('spawns')}
            className={`px-3 py-2 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
              activeTab === 'spawns'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Skull className="w-4 h-4 text-rose-400" />
            Combate & Inimigos
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: CHEATS & GOD MODE */}
          {activeTab === 'cheats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* God Mode */}
                <div
                  onClick={() => toggleCheat('godMode')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    settings.godMode
                      ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      Modo Deus (God Mode)
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        settings.godMode ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {settings.godMode ? 'ATIVO' : 'DESLIGADO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Imunidade completa a todo dano de inimigos, espinhos e abismos.
                  </p>
                </div>

                {/* Vida Infinita */}
                <div
                  onClick={() => toggleCheat('infiniteHp')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    settings.infiniteHp
                      ? 'bg-rose-500/20 border-rose-500/60 shadow-lg shadow-rose-500/10'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-rose-300 flex items-center gap-1.5">
                      <Heart className="w-4 h-4" />
                      Vida Infinita
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        settings.infiniteHp ? 'bg-rose-400 text-slate-950' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {settings.infiniteHp ? 'ATIVO' : 'DESLIGADO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    O HP de Nox permanece eternamente travado no máximo (5/5).
                  </p>
                </div>

                {/* Pulso Infinito */}
                <div
                  onClick={() => toggleCheat('infinitePulse')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    settings.infinitePulse
                      ? 'bg-cyan-500/20 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      Pulso Infinito
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        settings.infinitePulse ? 'bg-cyan-400 text-slate-950' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {settings.infinitePulse ? 'ATIVO' : 'DESLIGADO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Energia de cura e feitiços travada em 100% sem necessidade de bater.
                  </p>
                </div>
              </div>

              {/* Botões Rápidos de Ação */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Ações Imediatas
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={handleHealFull}
                    className="px-3.5 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-medium flex items-center gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Curar HP Totalmente
                  </button>

                  <button
                    onClick={handlePulseFull}
                    className="px-3.5 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-medium flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Encher Pulso (100%)
                  </button>

                  <button
                    onClick={() => handleAddGeo(1000)}
                    className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-medium flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    +1.000 Eco-Fragmentos
                  </button>

                  <button
                    onClick={() => handleAddGeo(10000)}
                    className="px-3.5 py-2 bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 border border-amber-500/50 rounded-lg text-xs font-bold flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    +10.000 Eco-Fragmentos
                  </button>

                  <button
                    onClick={handleUnlockAllAbilities}
                    className="px-3.5 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg text-xs font-medium flex items-center gap-2"
                  >
                    <Flame className="w-4 h-4" />
                    Desbloquear Todas as Habilidades
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHYSICS & POWERS */}
          {activeTab === 'physics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Noclip Mode */}
                <div
                  onClick={() => toggleCheat('noclip')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    settings.noclip
                      ? 'bg-purple-500/20 border-purple-500/60 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
                      <Wind className="w-4 h-4" />
                      Modo Fantasma (Noclip / Voo Livre)
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        settings.noclip ? 'bg-purple-400 text-slate-950' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {settings.noclip ? 'ATIVO' : 'DESLIGADO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Voa livremente em qualquer direção e atravessa todas as paredes e tetos do mapa!
                  </p>
                </div>

                {/* Pulo Infinito no Ar */}
                <div
                  onClick={() => toggleCheat('infiniteAirJumps')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    settings.infiniteAirJumps
                      ? 'bg-cyan-500/20 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      Pulos Infinitos no Ar
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        settings.infiniteAirJumps ? 'bg-cyan-400 text-slate-950' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {settings.infiniteAirJumps ? 'ATIVO' : 'DESLIGADO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Salte no ar quantas vezes quiser sem precisar tocar no chão!
                  </p>
                </div>

                {/* Câmera Lenta */}
                <div
                  onClick={() => toggleCheat('slowMotion')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    settings.slowMotion
                      ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      Câmera Lenta (Slow Motion)
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        settings.slowMotion ? 'bg-amber-400 text-slate-950' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {settings.slowMotion ? 'ATIVO' : 'DESLIGADO'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Reduz a velocidade do tempo em 50% para precisão cirúrgica de esquiva e ataques.
                  </p>
                </div>
              </div>

              {/* Sliders de Velocidade e Pulo */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
                {/* Multiplicador de Velocidade */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-slate-300">
                      Multiplicador de Velocidade de Corrida
                    </span>
                    <span className="font-mono font-bold text-cyan-400">
                      {settings.speedMultiplier.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={settings.speedMultiplier}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Lento (0.5x)</span>
                    <span>Padrão (1.0x)</span>
                    <span>Ultra Rápido (3.0x)</span>
                  </div>
                </div>

                {/* Multiplicador de Pulo */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-slate-300">
                      Multiplicador de Força de Salto
                    </span>
                    <span className="font-mono font-bold text-cyan-400">
                      {settings.jumpMultiplier.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="2.5"
                    step="0.1"
                    value={settings.jumpMultiplier}
                    onChange={(e) => handleJumpChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Normal (1.0x)</span>
                    <span>Alto (1.5x)</span>
                    <span>Salto Lunar (2.5x)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TELEPORT */}
          {activeTab === 'teleport' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Selecione qualquer sala do reino para ser teletransportado instantaneamente:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.values(GAME_ROOMS).map((room) => {
                  const isCurrent = currentRoom.id === room.id;
                  return (
                    <button
                      key={room.id}
                      onClick={() => {
                        onTeleportRoom(room);
                        soundEngine.playTotemRest();
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isCurrent
                          ? 'bg-emerald-500/20 border-emerald-500/60 shadow-md text-emerald-200'
                          : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs truncate">{room.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/30 text-emerald-300 rounded font-semibold">
                            AQUI
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Região: {room.regionId}</span>
                        <span>{room.enemies.length} monstros</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ENEMY & COMBAT SPAWNS */}
          {activeTab === 'spawns' && (
            <div className="space-y-6">
              <div className="p-4 bg-rose-950/20 border border-rose-500/40 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4" />
                    Eliminar Todos os Inimigos (Nuke)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Limpa instantaneamente todos os inimigos e chefes da sala atual.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onKillAllEnemies();
                    soundEngine.playEnemyDeath();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-rose-600/30"
                >
                  Limpar Sala
                </button>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Invocar Criaturas na Sala Atual
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      onSpawnEnemy('crawler');
                      soundEngine.playHit();
                    }}
                    className="p-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-left flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200">Besouro das Cinzas (Crawler)</div>
                      <div className="text-[10px] text-slate-400">Inimigo terrestre básico</div>
                    </div>
                    <span className="text-xs font-bold text-cyan-400">+ Invocar</span>
                  </button>

                  <button
                    onClick={() => {
                      onSpawnEnemy('specter');
                      soundEngine.playHit();
                    }}
                    className="p-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-left flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200">Mariposa de Ressonância (Specter)</div>
                      <div className="text-[10px] text-slate-400">Inimigo voador luminoso</div>
                    </div>
                    <span className="text-xs font-bold text-cyan-400">+ Invocar</span>
                  </button>

                  <button
                    onClick={() => {
                      onSpawnEnemy('varron_sentinel');
                      soundEngine.playHit();
                    }}
                    className="p-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-left flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200">Sentinela de Cobre (Varron)</div>
                      <div className="text-[10px] text-slate-400">Guardião com escudo pesado</div>
                    </div>
                    <span className="text-xs font-bold text-cyan-400">+ Invocar</span>
                  </button>

                  <button
                    onClick={() => {
                      onSpawnEnemy('abyss_diver');
                      soundEngine.playHit();
                    }}
                    className="p-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl text-left flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-200">Mergulhador do Abismo</div>
                      <div className="text-[10px] text-slate-400">Criatura submersa ágil</div>
                    </div>
                    <span className="text-xs font-bold text-cyan-400">+ Invocar</span>
                  </button>

                  {/* 3 CHEFÕES */}
                  <button
                    onClick={() => {
                      onSpawnEnemy('boss_varron_colossus');
                      soundEngine.playBossRoar();
                    }}
                    className="p-3 bg-orange-950/30 hover:bg-orange-900/40 border border-orange-500/40 rounded-xl text-left flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-orange-300">Chefe 1: Colosso de Varron</div>
                      <div className="text-[10px] text-slate-400">450 HP · Fornalha e martelo de vapor</div>
                    </div>
                    <span className="text-xs font-bold text-orange-400">+ Invocar</span>
                  </button>

                  <button
                    onClick={() => {
                      onSpawnEnemy('boss_guardian');
                      soundEngine.playBossRoar();
                    }}
                    className="p-3 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/40 rounded-xl text-left flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-amber-300">Chefe 2: Guardião do Silêncio</div>
                      <div className="text-[10px] text-slate-400">380 HP · Ondas de choque sacras</div>
                    </div>
                    <span className="text-xs font-bold text-amber-400">+ Invocar</span>
                  </button>

                  <button
                    onClick={() => {
                      onSpawnEnemy('boss_shade');
                      soundEngine.playBossRoar();
                    }}
                    className="p-3 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/50 rounded-xl text-left flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-purple-300">Chefe 3 (Final): A Sombra de Ner</div>
                      <div className="text-[10px] text-slate-400">550 HP · Névoa do vazio e projéteis cósmicos</div>
                    </div>
                    <span className="text-xs font-bold text-purple-400">+ Invocar</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Quick Jump Links */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenSprites();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg flex items-center gap-1.5 border border-slate-700"
            >
              <Sliders className="w-3.5 h-3.5" />
              Gerenciador de Sprites & NPCs
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenSounds();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-violet-300 rounded-lg flex items-center gap-1.5 border border-slate-700"
            >
              <Volume2 className="w-3.5 h-3.5" />
              Estúdio de Sons & Áudio
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow-md shadow-amber-500/20"
          >
            Concluir & Jogar
          </button>
        </div>
      </div>
    </div>
  );
};
