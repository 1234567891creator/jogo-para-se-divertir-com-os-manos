import React, { useState } from 'react';
import { RemotePlayer } from '../game/types';
import { multiplayerClient } from '../game/multiplayerClient';
import { X, Users, Globe, Shield, Send, CheckCircle2, Wifi, WifiOff } from 'lucide-react';

interface MultiplayerModalProps {
  currentRoomCode: string;
  isConnected: boolean;
  remotePlayers: RemotePlayer[];
  playerName: string;
  colorIndex: number;
  onUpdatePlayer: (name: string, colorIndex: number) => void;
  onJoinRoom: (roomCode: string) => void;
  onClose: () => void;
  onSendEmote: (text: string) => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  currentRoomCode,
  isConnected,
  remotePlayers,
  playerName,
  colorIndex,
  onUpdatePlayer,
  onJoinRoom,
  onClose,
  onSendEmote,
}) => {
  const [inputRoom, setInputRoom] = useState(currentRoomCode || 'LUMEN');
  const [inputName, setInputName] = useState(playerName || 'Nox');
  const [selectedColor, setSelectedColor] = useState(colorIndex);

  const colors = [
    { name: 'Esmeralda', hex: '#10b981' },
    { name: 'Âmbar', hex: '#f59e0b' },
    { name: 'Ametista', hex: '#8b5cf6' },
    { name: 'Carmesim', hex: '#ef4444' },
  ];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePlayer(inputName, selectedColor);
    if (inputRoom.trim()) {
      onJoinRoom(inputRoom.trim().toUpperCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative flex h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-slate-700/80 bg-[#0a0f18] text-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="font-display text-lg font-bold tracking-wider text-slate-100">
                Santuário Cooperativo Online (1–4 Jogadores)
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {isConnected ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <Wifi className="h-3.5 w-3.5" /> Conectado ao Servidor Echoward
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-400 font-medium">
                    <WifiOff className="h-3.5 w-3.5" /> Modo Local / Reconectando
                  </span>
                )}
                <span>·</span>
                <span>Sala Atual: <strong className="font-mono text-cyan-300">{currentRoomCode}</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Room Configuration Form */}
          <form onSubmit={handleApply} className="rounded-lg border border-slate-800 bg-slate-900/50 p-5 space-y-4">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300">
              Configurações do Andarilho & Sala
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Nome do seu Andarilho
                </label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  maxLength={14}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1 font-medium">
                  Código da Sala Co-op
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputRoom}
                    onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
                    maxLength={10}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono uppercase text-slate-100 focus:border-cyan-400 focus:outline-none"
                    placeholder="EX: LUMEN"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors whitespace-nowrap"
                  >
                    Entrar
                  </button>
                </div>
              </div>
            </div>

            {/* Cloak Tint Selection */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">
                Cor da Capa de Andarilho
              </label>
              <div className="flex items-center gap-3">
                {colors.map((c, idx) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(idx)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all ${
                      selectedColor === idx
                        ? 'border-cyan-400 bg-slate-800 text-white shadow-md'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Connected Companions List */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300">
                Companheiros Conectados nesta Sala ({remotePlayers.length + 1}/4)
              </h3>
              <span className="text-xs text-slate-400">
                Sincronização de combate e chefes ativa
              </span>
            </div>

            <div className="space-y-2">
              {/* Local Player */}
              <div className="flex items-center justify-between rounded-lg border border-slate-700/80 bg-slate-900/80 p-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: colors[colorIndex % colors.length].hex }}
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-100">{playerName} (Você)</span>
                    <span className="ml-2 text-xs text-slate-400">Host Local</span>
                  </div>
                </div>
                <span className="text-xs text-emerald-400 font-medium">Pronto</span>
              </div>

              {/* Remote Players */}
              {remotePlayers.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  Nenhum outro jogador nesta sala. Compartilhe o código <strong className="text-cyan-400 font-mono">{currentRoomCode}</strong> com até 3 amigos para explorarem juntos!
                </div>
              ) : (
                remotePlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: colors[p.colorIndex % colors.length].hex }}
                      />
                      <div>
                        <span className="text-sm font-semibold text-slate-200">{p.name}</span>
                        <span className="ml-2 text-xs text-slate-400">Andarilho</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-slate-300">HP: {p.hp}/{p.maxHp}</span>
                      <span className={p.isDowned ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                        {p.isDowned ? 'Caído (Requer Reanimação)' : 'Explorando'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Emote / Ping Center */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">
              Transmitir Emote / Sinal Sonoro aos Companheiros
            </h3>
            <div className="flex flex-wrap gap-2">
              {['⚔️ Ao Combate!', '⚠️ Cuidado!', '✨ Concentrar Pulso', '🪡 Totem de Descanso', '❓ Por Aqui!', '👋 Saudações'].map((txt) => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => onSendEmote(txt)}
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:border-cyan-400 hover:bg-slate-800 transition-colors"
                >
                  {txt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3 bg-[#080c14] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Retornar ao Jogo
          </button>
        </div>
      </div>
    </div>
  );
};
