import React from 'react';
import { X, Keyboard, Gamepad2 } from 'lucide-react';

interface ControlsGuideProps {
  onClose: () => void;
}

export const ControlsGuide: React.FC<ControlsGuideProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md select-none">
      <div className="relative flex w-full max-w-lg flex-col rounded-xl border border-slate-700 bg-[#0a0f18] text-slate-200 shadow-2xl p-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-cyan-400" />
            <h3 className="font-display text-base font-bold text-slate-100">
              Controles de Nox & Lâmina de Eco
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
            <span className="text-slate-400">Mover Esquerda / Direita:</span>
            <span className="font-mono text-cyan-300 font-bold">A / D ou ← / →</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
            <span className="text-slate-400">Pulo / Salto na Parede:</span>
            <span className="font-mono text-cyan-300 font-bold">Espaço / W / ↑</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
            <span className="text-slate-400">Ataque (Lâmina de Eco):</span>
            <span className="font-mono text-cyan-300 font-bold">C / J / Clique Esquerdo</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
            <span className="text-slate-400">Salto Pogo (Ataque para Baixo):</span>
            <span className="font-mono text-amber-300 font-bold">No ar + [S / ↓] + Ataque</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
            <span className="text-slate-400">Passo Fantasma (Dash):</span>
            <span className="font-mono text-cyan-300 font-bold">Shift / K</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
            <span className="text-slate-400">Concentrar Cura (Pulso):</span>
            <span className="font-mono text-emerald-300 font-bold">Segurar F / E (No chão)</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
            <span className="text-slate-400">Mergulho Abissal (Ground Slam):</span>
            <span className="font-mono text-cyan-300 font-bold">No ar + [S / ↓] + X</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800/80 py-1.5">
            <span className="text-slate-400">Interagir (Totem / Monólito / NPC):</span>
            <span className="font-mono text-slate-300 font-bold">W / ↑</span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-400">Menus (Mapa, Ecos, Co-op):</span>
            <span className="font-mono text-slate-300 font-bold">M (Mapa) · L (Ecos) · P (Co-op)</span>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
