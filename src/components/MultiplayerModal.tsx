import React, { useState, useEffect } from 'react';
import { RemotePlayer } from '../game/types';
import { multiplayerClient, ActiveRoomInfo } from '../game/multiplayerClient';
import {
  X,
  Users,
  Wifi,
  WifiOff,
  PlusCircle,
  LogIn,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Shield,
} from 'lucide-react';

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

  const [activeRooms, setActiveRooms] = useState<ActiveRoomInfo[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const colors = [
    { name: 'Esmeralda', hex: '#10b981' },
    { name: 'Âmbar', hex: '#f59e0b' },
    { name: 'Ametista', hex: '#8b5cf6' },
    { name: 'Carmesim', hex: '#ef4444' },
  ];

  const loadRooms = async () => {
    setIsLoadingRooms(true);
    const list = await multiplayerClient.fetchActiveRooms();
    setActiveRooms(list);
    setIsLoadingRooms(false);
  };

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    onUpdatePlayer(inputName, selectedColor);

    const res = await multiplayerClient.createRoom(inputRoom.trim() || undefined);
    setIsProcessing(false);

    if (res.success) {
      setInputRoom(res.roomId);
      onJoinRoom(res.roomId);
      setActionMessage({
        text: `Sala [${res.roomId}] criada com sucesso! Compartilhe com seus amigos.`,
        type: 'success',
      });
      loadRooms();
    } else {
      setActionMessage({
        text: res.error || 'Não foi possível criar a sala.',
        type: 'error',
      });
    }
  };

  const handleJoinWithCode = async (codeToJoin?: string) => {
    const code = (codeToJoin || inputRoom).trim().toUpperCase();
    if (!code) {
      setActionMessage({ text: 'Digite o código da sala para entrar.', type: 'error' });
      return;
    }

    setIsProcessing(true);
    setActionMessage(null);
    onUpdatePlayer(inputName, selectedColor);

    const res = await multiplayerClient.joinRoom(code, inputName, selectedColor);
    setIsProcessing(false);

    if (res.success) {
      setInputRoom(res.roomId);
      onJoinRoom(res.roomId);
      setActionMessage({
        text: `Você entrou na sala [${res.roomId}] com sucesso!`,
        type: 'success',
      });
      loadRooms();
    } else {
      setActionMessage({
        text: res.error || 'Erro ao entrar na sala.',
        type: 'error',
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoomCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md">
      <div className="relative flex h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-700/80 bg-[#0a0f18] text-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-cyan-400" />
            <div>
              <h2 className="font-serif text-lg font-bold tracking-wider text-slate-100">
                Santuário Cooperativo Online
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {isConnected ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <Wifi className="h-3.5 w-3.5" /> Servidor Ativo
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <WifiOff className="h-3.5 w-3.5" /> Conectando ao Servidor...
                  </span>
                )}
                <span>·</span>
                <span>Sala Atual: <strong className="font-mono text-cyan-300 font-bold">{currentRoomCode}</strong></span>
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Action Notification Message */}
          {actionMessage && (
            <div
              className={`flex items-center gap-2.5 rounded-xl border p-3.5 text-xs font-semibold shadow-lg ${
                actionMessage.type === 'success'
                  ? 'border-emerald-500/60 bg-emerald-950/50 text-emerald-200'
                  : 'border-rose-500/60 bg-rose-950/50 text-rose-200'
              }`}
            >
              {actionMessage.type === 'success' ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span>{actionMessage.text}</span>
            </div>
          )}

          {/* Player Customization */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Identidade do Andarilho
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome no Jogo</label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => {
                    setInputName(e.target.value);
                    onUpdatePlayer(e.target.value, selectedColor);
                  }}
                  maxLength={14}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                  placeholder="Nome do Andarilho"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Cor da Capa</label>
                <div className="flex items-center gap-2">
                  {colors.map((c, idx) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setSelectedColor(idx);
                        onUpdatePlayer(inputName, idx);
                      }}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs transition-all ${
                        selectedColor === idx
                          ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 font-bold shadow-md'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                      <span className="truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Create & Join Room Controls */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Criar ou Entrar em Sala
            </h3>

            <div className="space-y-3">
              <label className="block text-xs text-slate-400">Código da Sala</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={inputRoom}
                  onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono uppercase font-bold tracking-widest text-cyan-300 focus:border-cyan-400 focus:outline-none"
                  placeholder="DIGITE O CÓDIGO (EX: LUMEN)"
                />
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleJoinWithCode()}
                  className="flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-950/50 disabled:opacity-50"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Entrar com Código</span>
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCreateRoom}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Criar Nova Sala</span>
                </button>
              </div>

              {/* Share Code helper */}
              <div className="flex items-center justify-between rounded-lg bg-slate-950 px-3.5 py-2 text-xs border border-slate-800/80">
                <span className="text-slate-400">
                  Código da sua sessão atual: <strong className="font-mono text-cyan-300">{currentRoomCode}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copiar Código</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Active Public Rooms */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Salas Disponíveis no Reino
              </h3>
              <button
                type="button"
                onClick={loadRooms}
                disabled={isLoadingRooms}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingRooms ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeRooms.map((room) => {
                const isCurrent = room.roomId === currentRoomCode;
                return (
                  <div
                    key={room.roomId}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      isCurrent
                        ? 'border-cyan-500/70 bg-cyan-950/30'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-100">{room.roomId}</span>
                        {isCurrent && (
                          <span className="rounded bg-cyan-900/60 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300">
                            Sua Sala
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {room.playersCount} / 4 Andarilhos
                      </span>
                    </div>

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => handleJoinWithCode(room.roomId)}
                        disabled={room.isFull || isProcessing}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-600 hover:text-white transition-colors disabled:opacity-40"
                      >
                        {room.isFull ? 'Lotada' : 'Entrar'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Companions in Current Room */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Andarilhos Conectados em {currentRoomCode} ({remotePlayers.length + 1}/4)
            </h3>

            <div className="space-y-2">
              {/* Local Player */}
              <div className="flex items-center justify-between rounded-lg border border-cyan-800/60 bg-cyan-950/20 p-2.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: colors[colorIndex % colors.length].hex }}
                  />
                  <span className="text-xs font-bold text-slate-100">{playerName} (Você)</span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-400">Online</span>
              </div>

              {/* Remote Players */}
              {remotePlayers.length === 0 ? (
                <div className="py-2 text-center text-xs text-slate-500">
                  Nenhum outro jogador nesta sala. Convide amigos compartilhando o código <strong className="font-mono text-cyan-400">{currentRoomCode}</strong>!
                </div>
              ) : (
                remotePlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: colors[p.colorIndex % colors.length].hex }}
                      />
                      <span className="text-xs font-semibold text-slate-200">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono text-slate-400">HP {p.hp}/{p.maxHp}</span>
                      <span className={p.isDowned ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                        {p.isDowned ? 'Caído' : 'Explorando'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Emote / Ping Center */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Transmitir Emote / Sinal Sonoro
            </h3>
            <div className="flex flex-wrap gap-2">
              {['⚔️ Ao Combate!', '⚠️ Cuidado!', '✨ Concentrar Pulso', '🪡 Totem de Descanso', '❓ Por Aqui!', '👋 Saudações'].map((txt) => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => onSendEmote(txt)}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400 hover:bg-slate-800 transition-colors"
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
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
          >
            Retornar ao Jogo
          </button>
        </div>
      </div>
    </div>
  );
};
