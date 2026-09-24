import React from 'react';
import { Play, Users, BookOpen, Compass, Sparkles, Volume2, Bookmark } from 'lucide-react';
import { soundEngine } from '../game/audio';
import { SavePoint } from '../game/types';

interface TitleScreenProps {
  onStartGame: () => void;
  onOpenMultiplayer: () => void;
  onOpenLore: () => void;
  onOpenMap: () => void;
  savedCheckpoint?: SavePoint | null;
  onContinueSavedGame?: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  onOpenMultiplayer,
  onOpenLore,
  onOpenMap,
  savedCheckpoint,
  onContinueSavedGame,
}) => {
  const handleStart = () => {
    soundEngine.init();
    soundEngine.playJump();
    onStartGame();
  };

  const handleContinue = () => {
    soundEngine.init();
    soundEngine.playTotemRest();
    if (onContinueSavedGame) {
      onContinueSavedGame();
    } else {
      onStartGame();
    }
  };

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-between overflow-hidden bg-[#06080d] p-8 select-none text-slate-200">
      {/* Background Hero Artwork with Ambient Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/echoward_title_hero_1790162348026.jpg"
          alt="Echoward: Reino das Cinzas"
          className="h-full w-full object-cover object-center opacity-65 scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080d] via-[#06080d]/60 to-transparent" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#06080d]/40 to-[#06080d]" />
      </div>

      {/* Top Banner Tagline */}
      <div className="relative z-10 flex items-center gap-3 text-xs tracking-widest text-slate-400 uppercase">
        <span>Metroidvania 2D</span>
        <span>·</span>
        <span>Ação & Exploração</span>
        <span>·</span>
        <span>Multiplayer Cooperativo</span>
      </div>

      {/* Main Title & Brand Lockup */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="font-display text-5xl md:text-7xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-cyan-100 to-slate-400 drop-shadow-[0_10px_25px_rgba(56,189,248,0.25)]">
          ECHOWARD
        </h1>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-cyan-500" />
          <span className="font-display text-lg md:text-xl font-semibold tracking-[0.25em] text-cyan-300 uppercase">
            Reino das Cinzas
          </span>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-cyan-500" />
        </div>
        <p className="mt-4 max-w-md text-xs md:text-sm text-slate-300/90 leading-relaxed italic">
          “O Silêncio devorou as vozes do mundo antigo. Desperte sua máscara, empunhe a Lâmina de Eco e desça às dezenove fases do reino esquecido.”
        </p>
      </div>

      {/* Menu Actions */}
      <div className="relative z-10 flex flex-col items-center gap-3 w-full max-w-md">
        {savedCheckpoint && (
          <button
            onClick={handleContinue}
            className="group flex w-full items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 py-3.5 px-6 font-display text-sm font-bold tracking-wider text-white shadow-xl shadow-emerald-950/60 hover:from-emerald-500 hover:to-cyan-500 hover:scale-[1.02] transition-all duration-200"
          >
            <div className="flex items-center gap-2.5">
              <Bookmark className="h-4 w-4 text-emerald-200 fill-emerald-400" />
              <span>Continuar do Totem</span>
            </div>
            <span className="text-[11px] font-normal text-emerald-100 truncate max-w-[180px]">
              {savedCheckpoint.name}
            </span>
          </button>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={handleStart}
            className={`group flex flex-1 w-full items-center justify-center gap-2 rounded-xl py-3 px-5 font-display text-sm font-bold tracking-wider text-white shadow-lg transition-all duration-200 ${
              savedCheckpoint
                ? 'bg-slate-800/90 hover:bg-slate-700 border border-slate-700'
                : 'bg-gradient-to-r from-cyan-600 to-sky-500 shadow-cyan-900/40 hover:from-cyan-500 hover:to-sky-400'
            }`}
          >
            <Play className="h-4 w-4 fill-current transition-transform group-hover:scale-110" />
            {savedCheckpoint ? 'Novo Jogo (Lumen)' : 'Despertar em Lumen'}
          </button>

          <button
            onClick={() => {
              soundEngine.init();
              onOpenMultiplayer();
            }}
            className="flex flex-1 w-full items-center justify-center gap-2 rounded-xl border border-cyan-800/60 bg-slate-900/80 py-3 px-5 font-display text-sm font-semibold tracking-wider text-slate-200 backdrop-blur-md hover:border-cyan-400 hover:bg-slate-800 transition-all duration-200"
          >
            <Users className="h-4 w-4 text-cyan-400" />
            Co-op Online (1–4)
          </button>
        </div>
      </div>

      {/* Secondary Quick Navs */}
      <div className="relative z-10 flex items-center gap-6 text-xs text-slate-400">
        <button
          onClick={() => {
            soundEngine.init();
            onOpenMap();
          }}
          className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
        >
          <Compass className="h-3.5 w-3.5 text-sky-400" />
          Cartografia do Reino (12 Áreas)
        </button>
        <span>·</span>
        <button
          onClick={() => {
            soundEngine.init();
            onOpenLore();
          }}
          className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
        >
          <BookOpen className="h-3.5 w-3.5 text-amber-400" />
          Crônicas & Bestiário
        </button>
      </div>
    </div>
  );
};
