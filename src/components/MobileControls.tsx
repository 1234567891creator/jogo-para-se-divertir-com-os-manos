/**
 * Echoward: Reino das Cinzas - Mobile Touch Controls Overlay
 * Virtual D-Pad, dynamic jump/attack/dash/heal buttons and quick action bar
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Sword,
  Wind,
  Heart,
  Eye,
  Sliders,
  Volume2,
  ShieldAlert,
  Map,
} from 'lucide-react';

interface MobileControlsProps {
  onInputStateChange: (key: string, pressed: boolean) => void;
  isAdminUnlocked: boolean;
  onOpenAdmin: () => void;
  onOpenSoundTab: () => void;
  onOpenSpriteTab: () => void;
  onOpenMap: () => void;
  onOpenCodeInput: () => void;
  isVisible: boolean;
  onToggleVisible: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  onInputStateChange,
  isAdminUnlocked,
  onOpenAdmin,
  onOpenSoundTab,
  onOpenSpriteTab,
  onOpenMap,
  onOpenCodeInput,
  isVisible,
  onToggleVisible,
}) => {
  const [activeTouches, setActiveTouches] = useState<{ [btn: string]: boolean }>({});

  const handleTouchStart = (key: string) => {
    setActiveTouches((prev) => ({ ...prev, [key]: true }));
    onInputStateChange(key, true);
  };

  const handleTouchEnd = (key: string) => {
    setActiveTouches((prev) => ({ ...prev, [key]: false }));
    onInputStateChange(key, false);
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisible}
        className="fixed bottom-4 right-4 z-40 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 px-3 py-2 rounded-xl text-xs flex items-center gap-2 backdrop-blur-md shadow-lg"
      >
        📱 Ativar Controles Celular
      </button>
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-40 select-none overflow-hidden touch-none font-sans">
      {/* Top Mobile Quick Actions Bar */}
      <div className="absolute top-16 left-3 right-3 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800/80 backdrop-blur-md px-2 py-1 rounded-xl">
          {isAdminUnlocked && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-mono font-bold animate-pulse"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              847717 ADM
            </button>
          )}
          <button
            onClick={onOpenCodeInput}
            className="flex items-center gap-1 px-2 py-1 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700 rounded-lg text-xs"
            title="Digitar código secreto"
          >
            <span className="font-mono text-xs"># Código</span>
          </button>
          <button
            onClick={onOpenSpriteTab}
            className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            Sprites
          </button>
          <button
            onClick={onOpenSoundTab}
            className="flex items-center gap-1 px-2.5 py-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/40 rounded-lg text-xs"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Sons
          </button>
          <button
            onClick={onOpenMap}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border border-slate-700 rounded-lg text-xs"
          >
            <Map className="w-3.5 h-3.5" />
            Mapa
          </button>
        </div>

        <button
          onClick={onToggleVisible}
          className="bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white px-2 py-1 rounded-lg text-xs"
        >
          Ocultar
        </button>
      </div>

      {/* Bottom Left: D-PAD (Direcionais) */}
      <div className="absolute bottom-6 left-6 pointer-events-auto">
        <div className="relative w-36 h-36 bg-slate-950/60 border border-cyan-500/20 rounded-full backdrop-blur-md shadow-2xl p-2 flex items-center justify-center">
          {/* CIMA / INTERAGIR */}
          <button
            onTouchStart={() => handleTouchStart('up')}
            onTouchEnd={() => handleTouchEnd('up')}
            onMouseDown={() => handleTouchStart('up')}
            onMouseUp={() => handleTouchEnd('up')}
            className={`absolute top-1.5 w-11 h-11 rounded-xl flex items-center justify-center text-cyan-300 transition-transform active:scale-95 ${
              activeTouches['up'] ? 'bg-cyan-500/40 text-cyan-100 shadow-md shadow-cyan-500/40' : 'bg-slate-900/80'
            }`}
          >
            <ChevronUp className="w-6 h-6" />
          </button>

          {/* BAIXO / POGO / DESCIDA */}
          <button
            onTouchStart={() => handleTouchStart('down')}
            onTouchEnd={() => handleTouchEnd('down')}
            onMouseDown={() => handleTouchStart('down')}
            onMouseUp={() => handleTouchEnd('down')}
            className={`absolute bottom-1.5 w-11 h-11 rounded-xl flex items-center justify-center text-cyan-300 transition-transform active:scale-95 ${
              activeTouches['down'] ? 'bg-cyan-500/40 text-cyan-100 shadow-md shadow-cyan-500/40' : 'bg-slate-900/80'
            }`}
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          {/* ESQUERDA */}
          <button
            onTouchStart={() => handleTouchStart('left')}
            onTouchEnd={() => handleTouchEnd('left')}
            onMouseDown={() => handleTouchStart('left')}
            onMouseUp={() => handleTouchEnd('left')}
            className={`absolute left-1.5 w-11 h-11 rounded-xl flex items-center justify-center text-cyan-300 transition-transform active:scale-95 ${
              activeTouches['left'] ? 'bg-cyan-500/40 text-cyan-100 shadow-md shadow-cyan-500/40' : 'bg-slate-900/80'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* DIREITA */}
          <button
            onTouchStart={() => handleTouchStart('right')}
            onTouchEnd={() => handleTouchEnd('right')}
            onMouseDown={() => handleTouchStart('right')}
            onMouseUp={() => handleTouchEnd('right')}
            className={`absolute right-1.5 w-11 h-11 rounded-xl flex items-center justify-center text-cyan-300 transition-transform active:scale-95 ${
              activeTouches['right'] ? 'bg-cyan-500/40 text-cyan-100 shadow-md shadow-cyan-500/40' : 'bg-slate-900/80'
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* CENTRO */}
          <div className="w-6 h-6 rounded-full bg-cyan-400/20 border border-cyan-400/40" />
        </div>
      </div>

      {/* Bottom Right: Action Cluster */}
      <div className="absolute bottom-6 right-6 pointer-events-auto flex items-end gap-3">
        {/* Curar & Visão */}
        <div className="flex flex-col gap-2.5 pb-2">
          {/* CURAR (Hold) */}
          <button
            onTouchStart={() => handleTouchStart('heal')}
            onTouchEnd={() => handleTouchEnd('heal')}
            onMouseDown={() => handleTouchStart('heal')}
            onMouseUp={() => handleTouchEnd('heal')}
            className={`w-12 h-12 rounded-full border border-emerald-500/40 flex flex-col items-center justify-center transition-transform active:scale-90 ${
              activeTouches['heal']
                ? 'bg-emerald-500/50 text-white shadow-lg shadow-emerald-500/50'
                : 'bg-emerald-950/60 text-emerald-300'
            }`}
          >
            <Heart className="w-5 h-5 fill-current" />
            <span className="text-[9px] font-bold">Cura</span>
          </button>

          {/* VISÃO DE MEMÓRIA */}
          <button
            onTouchStart={() => handleTouchStart('vision')}
            onTouchEnd={() => handleTouchEnd('vision')}
            onMouseDown={() => handleTouchStart('vision')}
            onMouseUp={() => handleTouchEnd('vision')}
            className={`w-12 h-12 rounded-full border border-purple-500/40 flex flex-col items-center justify-center transition-transform active:scale-90 ${
              activeTouches['vision']
                ? 'bg-purple-500/50 text-white shadow-lg shadow-purple-500/50'
                : 'bg-purple-950/60 text-purple-300'
            }`}
          >
            <Eye className="w-5 h-5" />
            <span className="text-[9px] font-bold">Visão</span>
          </button>
        </div>

        {/* DASH, ATAQUE, PULO */}
        <div className="relative w-44 h-44 bg-slate-950/50 border border-cyan-500/20 rounded-full backdrop-blur-md shadow-2xl p-2 flex items-center justify-center">
          {/* DASH (Topo Esquerdo) */}
          <button
            onTouchStart={() => handleTouchStart('dash')}
            onTouchEnd={() => handleTouchEnd('dash')}
            onMouseDown={() => handleTouchStart('dash')}
            onMouseUp={() => handleTouchEnd('dash')}
            className={`absolute top-2 left-4 w-14 h-14 rounded-full border border-amber-500/40 flex flex-col items-center justify-center transition-transform active:scale-90 ${
              activeTouches['dash']
                ? 'bg-amber-500/50 text-white shadow-lg shadow-amber-500/50'
                : 'bg-amber-950/60 text-amber-300'
            }`}
          >
            <Wind className="w-5 h-5" />
            <span className="text-[9px] font-bold">Dash</span>
          </button>

          {/* ATAQUE / ESPADA (Topo Direito) */}
          <button
            onTouchStart={() => handleTouchStart('attack')}
            onTouchEnd={() => handleTouchEnd('attack')}
            onMouseDown={() => handleTouchStart('attack')}
            onMouseUp={() => handleTouchEnd('attack')}
            className={`absolute top-2 right-4 w-14 h-14 rounded-full border border-rose-500/40 flex flex-col items-center justify-center transition-transform active:scale-90 ${
              activeTouches['attack']
                ? 'bg-rose-500/60 text-white shadow-lg shadow-rose-500/50'
                : 'bg-rose-950/60 text-rose-300'
            }`}
          >
            <Sword className="w-6 h-6" />
            <span className="text-[9px] font-bold">Golpe</span>
          </button>

          {/* PULO (Principal - Embaixo) */}
          <button
            onTouchStart={() => handleTouchStart('jump')}
            onTouchEnd={() => handleTouchEnd('jump')}
            onMouseDown={() => handleTouchStart('jump')}
            onMouseUp={() => handleTouchEnd('jump')}
            className={`absolute bottom-2 w-16 h-16 rounded-full border-2 border-cyan-400 flex flex-col items-center justify-center transition-transform active:scale-90 shadow-xl ${
              activeTouches['jump']
                ? 'bg-cyan-400 text-slate-950 shadow-cyan-400/60'
                : 'bg-cyan-500/30 text-cyan-200'
            }`}
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Pulo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
