/**
 * Echoward: Reino das Cinzas - Sound & Music Studio Modal (Haba de Sons)
 * Permite controle completo de volumes (Master, Música, Efeitos),
 * teste ao vivo de todos os sons do jogo e seleção de trilhas sonoras atmosféricas.
 */

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Sliders,
  Play,
  X,
  Sparkles,
  Sword,
  Shield,
  Heart,
  Wind,
  Zap,
  Disc,
} from 'lucide-react';
import { soundEngine } from '../game/audio';
import { RegionId } from '../game/types';

interface SoundStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRegion: RegionId;
}

export const SoundStudioModal: React.FC<SoundStudioModalProps> = ({
  isOpen,
  onClose,
  currentRegion,
}) => {
  const [masterVol, setMasterVol] = useState<number>(soundEngine.getMasterVolume());
  const [musicVol, setMusicVol] = useState<number>(soundEngine.getMusicVolume());
  const [sfxVol, setSfxVol] = useState<number>(soundEngine.getSfxVolume());
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getIsMuted());
  const [playingTheme, setPlayingTheme] = useState<RegionId>(currentRegion);

  if (!isOpen) return null;

  const handleMasterChange = (val: number) => {
    setMasterVol(val);
    soundEngine.setMasterVolume(val);
  };

  const handleMusicChange = (val: number) => {
    setMusicVol(val);
    soundEngine.setMusicVolume(val);
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    soundEngine.setSfxVolume(val);
  };

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handlePlayRegionTheme = (region: RegionId) => {
    setPlayingTheme(region);
    soundEngine.startAmbientMusic(region);
  };

  const soundFxList = [
    { name: 'Corte Lâmina (Lado)', icon: Sword, play: () => soundEngine.playSlash('side'), color: 'text-cyan-400' },
    { name: 'Corte Ascendente (Cima)', icon: Sword, play: () => soundEngine.playSlash('up'), color: 'text-cyan-300' },
    { name: 'Golpe Pogo (Baixo)', icon: Zap, play: () => soundEngine.playPogo(), color: 'text-amber-400' },
    { name: 'Impacto em Inimigo', icon: Shield, play: () => soundEngine.playHit(), color: 'text-rose-400' },
    { name: 'Passo Fantasma (Dash)', icon: Wind, play: () => soundEngine.playDash(), color: 'text-cyan-400' },
    { name: 'Salto Simples', icon: Sparkles, play: () => soundEngine.playJump(false), color: 'text-blue-300' },
    { name: 'Salto Duplo', icon: Sparkles, play: () => soundEngine.playJump(true), color: 'text-indigo-300' },
    { name: 'Foco de Cura (Alma)', icon: Heart, play: () => soundEngine.playHealFocus(), color: 'text-emerald-400' },
    { name: 'Cura Concluída (Sinos)', icon: Heart, play: () => soundEngine.playHealComplete(), color: 'text-emerald-300' },
    { name: 'Feitiço de Ressonância', icon: Zap, play: () => soundEngine.playSpellCast(), color: 'text-purple-400' },
    { name: 'Mergulho Abissal', icon: Wind, play: () => soundEngine.playGroundPound(), color: 'text-amber-500' },
    { name: 'Dano Recebido', icon: Shield, play: () => soundEngine.playDamage(), color: 'text-red-400' },
    { name: 'Descanso no Altar', icon: Sparkles, play: () => soundEngine.playTotemRest(), color: 'text-teal-300' },
    { name: 'Coleta de Fragmento', icon: Sparkles, play: () => soundEngine.playCollectShard(), color: 'text-amber-300' },
    { name: 'Voz / Diálogo de NPC', icon: Volume2, play: () => soundEngine.playNpcVoice(), color: 'text-sky-300' },
    { name: 'Morte de Monstro', icon: Shield, play: () => soundEngine.playEnemyDeath(), color: 'text-rose-500' },
    { name: 'Rugido do Guardião', icon: Disc, play: () => soundEngine.playBossRoar(), color: 'text-orange-500' },
    { name: 'Código Secreto (847717)', icon: Sparkles, play: () => soundEngine.playSecretCodeSuccess(), color: 'text-amber-400' },
  ];

  const regionsList: { id: RegionId; name: string; desc: string }[] = [
    { id: 'lumen_village', name: 'Vila Lumen', desc: 'Sereno, calmo e melancólico' },
    { id: 'echo_forest', name: 'Floresta dos Ecos', desc: 'Misterioso, esporos e sussurros' },
    { id: 'varron_mines', name: 'Minas Varron', desc: 'Pesado, tenso e ressonante' },
    { id: 'broken_cathedral', name: 'Catedral Quebrada', desc: 'Litúrgico, sacro e ancestral' },
    { id: 'ner_abyss', name: 'Abismo de Ner', desc: 'Escuridão profunda e atmosférica' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-violet-500/50 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-slate-900 to-violet-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/50 flex items-center justify-center text-violet-400 shadow-lg shadow-violet-500/20">
              <Music className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-violet-300 tracking-wide">
                Estúdio de Sons & Trilha Sonora
              </h2>
              <p className="text-xs text-slate-400">
                Regule volumes, teste todos os efeitos de áudio e ouça os temas dos biomas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                isMuted
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              {isMuted ? 'Mudo Ativado' : 'Silenciar'}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Volume Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            {/* Master Volume */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <Volume2 className="w-3.5 h-3.5 text-violet-400" />
                  Volume Geral (Master)
                </span>
                <span className="font-mono text-violet-300 font-bold">
                  {Math.round(masterVol * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterVol}
                onChange={(e) => handleMasterChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-400"
              />
            </div>

            {/* Music Volume */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <Music className="w-3.5 h-3.5 text-cyan-400" />
                  Trilha Sonora (BGM)
                </span>
                <span className="font-mono text-cyan-300 font-bold">
                  {Math.round(musicVol * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVol}
                onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* SFX Volume */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Efeitos Sonoros (SFX)
                </span>
                <span className="font-mono text-amber-300 font-bold">
                  {Math.round(sfxVol * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVol}
                onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>

          {/* Biome Music Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-violet-400" />
              Temas Musicais por Região
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {regionsList.map((reg) => {
                const isPlaying = playingTheme === reg.id;
                return (
                  <button
                    key={reg.id}
                    onClick={() => handlePlayRegionTheme(reg.id)}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isPlaying
                        ? 'bg-violet-500/20 border-violet-500/60 shadow-md shadow-violet-500/10 text-violet-200'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{reg.name}</div>
                      <div className="text-[10px] text-slate-400">{reg.desc}</div>
                    </div>
                    <Play
                      className={`w-4 h-4 ${
                        isPlaying ? 'text-violet-400 fill-current' : 'text-slate-500'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Soundboard of Game Sound Effects */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Painel Interativo de Efeitos Sonoros (SFX)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {soundFxList.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={item.play}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 active:scale-95 border border-slate-700/80 hover:border-slate-600 rounded-xl text-left flex items-center gap-2.5 transition-all text-xs"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center">
                      <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <span className="font-medium text-slate-300 truncate">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end text-xs">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-lg shadow-md shadow-violet-600/20"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
