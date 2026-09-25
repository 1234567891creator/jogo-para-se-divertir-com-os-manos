import React, { useState, useEffect, useRef } from 'react';
import {
  RemotePlayer,
  RoomPlayerInfo,
  RoomChatMessage,
  CharacterArchetype,
} from '../game/types';
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
  Crown,
  Play,
  CheckCircle2,
  Clock,
  Sparkles,
  MessageSquare,
  Send,
  UserCheck,
  AlertCircle,
  Share2,
  Shield,
  Zap,
} from 'lucide-react';

interface MultiplayerModalProps {
  currentRoomCode: string;
  isConnected: boolean;
  remotePlayers: RemotePlayer[];
  playerName: string;
  colorIndex: number;
  onUpdatePlayer: (name: string, colorIndex: number, character?: CharacterArchetype) => void;
  onJoinRoom: (roomCode: string) => void;
  onClose: () => void;
  onSendEmote: (text: string) => void;
  onStartGame?: () => void;
}

const ARCHETYPES: Array<{
  id: CharacterArchetype;
  name: string;
  role: string;
  desc: string;
  special: string;
}> = [
  {
    id: 'Nox',
    name: 'Nox',
    role: 'Andarilho da Lâmpada',
    desc: 'Ágil e veloz, corta as cinzas com lâmpada de ressonância e agulha precisa.',
    special: 'Luz Aumentada & Ataque Rápido',
  },
  {
    id: 'Veyra',
    name: 'Veyra',
    role: 'Tecelã de Ecos',
    desc: 'Manipula as frequências das cavernas, regenerando pulso e curando aliados.',
    special: 'Cura Acelerada & Pulso Expandido',
  },
  {
    id: 'Orin',
    name: 'Orin',
    role: 'Guardião de Cinza',
    desc: 'Portador de armadura de basalto, desfere golpes pesados e resiste a impactos.',
    special: 'Alta Resistência & Pogo Estendido',
  },
  {
    id: 'Kael',
    name: 'Kael',
    role: 'Espectro Noturno',
    desc: 'Mestre do Passo Fantasma, desliza pelas fendas sombrias com esquiva prolongada.',
    special: 'Dash Duplo & Furtividade Abissal',
  },
];

const CLOAK_COLORS = [
  { name: 'Esmeralda', hex: '#10b981', border: 'border-emerald-500' },
  { name: 'Âmbar', hex: '#f59e0b', border: 'border-amber-500' },
  { name: 'Ametista', hex: '#8b5cf6', border: 'border-purple-500' },
  { name: 'Carmesim', hex: '#ef4444', border: 'border-rose-500' },
];

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
  onStartGame,
}) => {
  const [inputRoom, setInputRoom] = useState(currentRoomCode || 'LUMEN');
  const [inputName, setInputName] = useState(playerName || 'Nox');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterArchetype>(
    multiplayerClient.currentCharacter || 'Nox'
  );
  const [selectedColor, setSelectedColor] = useState(colorIndex);

  const [activeRooms, setActiveRooms] = useState<ActiveRoomInfo[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Live state from client
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayerInfo[]>(multiplayerClient.roomPlayers);
  const [isReady, setIsReady] = useState(multiplayerClient.isReady);
  const [isHost, setIsHost] = useState(multiplayerClient.isHost);
  const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>(multiplayerClient.chatLog);
  const [inputChat, setInputChat] = useState('');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  const loadRooms = async () => {
    setIsLoadingRooms(true);
    const list = await multiplayerClient.fetchActiveRooms();
    setActiveRooms(list);
    setIsLoadingRooms(false);
  };

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 3500);

    // Sync state continuously from multiplayerClient
    const syncInterval = setInterval(() => {
      setRoomPlayers([...multiplayerClient.roomPlayers]);
      setIsReady(multiplayerClient.isReady);
      setIsHost(multiplayerClient.isHost);
      setChatMessages([...multiplayerClient.chatLog]);
    }, 150);

    const unsub = multiplayerClient.on((event, data) => {
      if (event === 'joined_room' || event === 'room_state') {
        setRoomPlayers([...multiplayerClient.roomPlayers]);
        setIsHost(multiplayerClient.isHost);
        setIsReady(multiplayerClient.isReady);
      } else if (event === 'chat_message') {
        setChatMessages([...multiplayerClient.chatLog]);
      } else if (event === 'game_started') {
        if (onStartGame) onStartGame();
      }
    });

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
      unsub();
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleCreateRoom = async () => {
    setIsProcessing(true);
    setActionMessage(null);
    onUpdatePlayer(inputName, selectedColor, selectedCharacter);

    const res = await multiplayerClient.createRoom(inputRoom.trim() || undefined);
    setIsProcessing(false);

    if (res.success) {
      setInputRoom(res.roomId);
      onJoinRoom(res.roomId);
      setActionMessage({
        text: `Sessão [${res.roomId}] criada com sucesso! Você é o Líder do Santuário.`,
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
    onUpdatePlayer(inputName, selectedColor, selectedCharacter);

    const res = await multiplayerClient.joinRoom(code, inputName, selectedCharacter, selectedColor);
    setIsProcessing(false);

    if (res.success) {
      setInputRoom(res.roomId);
      onJoinRoom(res.roomId);
      setActionMessage({
        text: `Conectado com sucesso à sessão [${res.roomId}]!`,
        type: 'success',
      });
      loadRooms();
    } else {
      setActionMessage({
        text: res.error || 'Erro ao conectar à sala.',
        type: 'error',
      });
    }
  };

  const handleToggleReady = () => {
    const next = !isReady;
    setIsReady(next);
    multiplayerClient.setReady(next);
  };

  const handleStartCoopSession = () => {
    multiplayerClient.startGame();
    if (onStartGame) onStartGame();
    onClose();
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputChat.trim()) return;
    multiplayerClient.sendChatMessage(inputChat);
    setInputChat('');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoomCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Build the 4 distinct player slots as specified in section 10
  const slots: Array<RoomPlayerInfo | null> = [null, null, null, null];
  for (const p of roomPlayers) {
    if (typeof p.slotIndex === 'number' && p.slotIndex >= 0 && p.slotIndex < 4) {
      slots[p.slotIndex] = p;
    }
  }
  // Fallback for players without valid slotIndex
  let emptyIdx = 0;
  for (const p of roomPlayers) {
    if (!slots.includes(p)) {
      while (emptyIdx < 4 && slots[emptyIdx] !== null) {
        emptyIdx++;
      }
      if (emptyIdx < 4) {
        slots[emptyIdx] = p;
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 sm:p-4 backdrop-blur-md">
      <div className="relative flex h-[94vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-700/80 bg-[#090d15] text-slate-200 shadow-2xl overflow-hidden font-sans">
        {/* Top Room Banner */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 sm:px-7 py-3.5 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base sm:text-lg font-bold tracking-wider text-slate-100 uppercase">
                  Santuário Cooperativo Online
                </h2>
                <span className="rounded bg-cyan-900/60 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-700/40">
                  ATÉ 4 JOGADORES
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                {isConnected ? (
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <Wifi className="h-3.5 w-3.5" /> Servidor Ativo ({multiplayerClient.ping}ms)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <WifiOff className="h-3.5 w-3.5" /> Conectando ao Servidor...
                  </span>
                )}
                <span>·</span>
                <span>
                  Sessão Atual:{' '}
                  <strong className="font-mono text-cyan-300 font-bold tracking-wider">
                    {currentRoomCode}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
              title="Copiar Código da Sala"
            >
              {isCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="hidden sm:inline font-mono">{currentRoomCode}</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action Status Notification */}
        {actionMessage && (
          <div
            className={`flex items-center gap-2.5 px-6 py-2 text-xs font-semibold ${
              actionMessage.type === 'success'
                ? 'border-b border-emerald-500/40 bg-emerald-950/60 text-emerald-200'
                : 'border-b border-rose-500/40 bg-rose-950/60 text-rose-200'
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

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* SECTION 10: 4 PLAYER SLOTS LOBBY */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">
                  Lobby da Sessão · {currentRoomCode} ({roomPlayers.length} / 4 Andarilhos)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {isHost ? '👑 Você é o Host da Sala' : 'Conectado como Membro'}
              </span>
            </div>

            {/* The 4 Player Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {slots.map((slotPlayer, idx) => {
                const slotNumber = idx + 1;
                const isLocal = slotPlayer?.id === multiplayerClient.myClientId;

                if (!slotPlayer) {
                  return (
                    <div
                      key={`empty-${idx}`}
                      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/80 bg-slate-950/40 p-4 text-center min-h-[140px]"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/60 text-slate-600 mb-2">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        [{slotNumber}] Slot Vazio
                      </span>
                      <span className="text-[11px] text-slate-600 mt-0.5">
                        Aguardando Andarilho...
                      </span>
                    </div>
                  );
                }

                const cloakColor = CLOAK_COLORS[slotPlayer.colorIndex % CLOAK_COLORS.length];
                const archetype =
                  ARCHETYPES.find((a) => a.id === slotPlayer.character) || ARCHETYPES[0];

                return (
                  <div
                    key={slotPlayer.id}
                    className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                      isLocal
                        ? 'border-cyan-500/70 bg-gradient-to-b from-cyan-950/40 to-slate-950/80 shadow-md shadow-cyan-950/30'
                        : 'border-slate-800 bg-slate-950/80'
                    }`}
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                          [{slotNumber}] {isLocal && '(Você)'}
                        </span>
                        {slotPlayer.isHost && (
                          <span className="flex items-center gap-1 rounded bg-amber-950/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-600/40">
                            <Crown className="h-3 w-3" /> Host
                          </span>
                        )}
                      </div>

                      {/* Name & Cloak Icon */}
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-4 w-4 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: cloakColor.hex }}
                          title={`Capa ${cloakColor.name}`}
                        />
                        <span className="font-bold text-sm text-slate-100 truncate">
                          {slotPlayer.name}
                        </span>
                      </div>

                      {/* Character Archetype */}
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-xs text-cyan-300 font-semibold">
                          {archetype.name}
                        </span>
                        <span className="text-[10px] text-slate-500">· {archetype.role}</span>
                      </div>
                    </div>

                    {/* Status & Ping Footer */}
                    <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      {slotPlayer.isReady ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Pronto
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400 font-medium text-[11px]">
                          <Clock className="h-3.5 w-3.5" /> Em Espera
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-slate-500">
                        {slotPlayer.ping || 24}ms
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ready & Start Action Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleReady}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-md ${
                    isReady
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                      : 'border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <UserCheck className="h-4 w-4" />
                  <span>{isReady ? '✓ Você está Pronto' : 'Marcar como Pronto'}</span>
                </button>
              </div>

              {isHost ? (
                <button
                  type="button"
                  onClick={handleStartCoopSession}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-cyan-500 px-7 py-2.5 text-xs font-bold text-white hover:from-cyan-500 hover:to-sky-400 shadow-lg shadow-cyan-950/60 transition-all cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>INICIAR SESSÃO NO MUNDO</span>
                </button>
              ) : (
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Aguardando o Líder da Sala iniciar o mundo...</span>
                </div>
              )}
            </div>
          </div>

          {/* CHARACTER ARCHETYPE & IDENTITY */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Escolher Andarilho & Identidade
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome do Andarilho</label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => {
                    setInputName(e.target.value);
                    multiplayerClient.updateProfile(e.target.value, selectedCharacter, selectedColor);
                    onUpdatePlayer(e.target.value, selectedColor, selectedCharacter);
                  }}
                  maxLength={16}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
                  placeholder="Seu Nome no Reino"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Cor da Capa</label>
                <div className="flex items-center gap-2">
                  {CLOAK_COLORS.map((c, idx) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setSelectedColor(idx);
                        multiplayerClient.updateProfile(inputName, selectedCharacter, idx);
                        onUpdatePlayer(inputName, idx, selectedCharacter);
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

            {/* Character Archetypes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {ARCHETYPES.map((arch) => {
                const isSelected = selectedCharacter === arch.id;
                return (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => {
                      setSelectedCharacter(arch.id);
                      multiplayerClient.updateProfile(inputName, arch.id, selectedColor);
                      onUpdatePlayer(inputName, selectedColor, arch.id);
                    }}
                    className={`flex flex-col text-left rounded-xl border p-3 transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/30 shadow-md ring-1 ring-cyan-500/50'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-bold text-sm text-slate-100">{arch.name}</span>
                      {isSelected && <Sparkles className="h-3.5 w-3.5 text-cyan-400" />}
                    </div>
                    <span className="text-[11px] text-cyan-300 font-semibold mb-1">
                      {arch.role}
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight mb-2 flex-1">
                      {arch.desc}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-amber-300/90 font-medium">
                      ✦ {arch.special}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ROOM MANAGEMENT: CREATE / JOIN VIA CODE */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Conectar a Outra Sessão por Código
            </h3>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inputRoom}
                onChange={(e) => setInputRoom(e.target.value.toUpperCase())}
                maxLength={12}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm font-mono uppercase font-bold tracking-widest text-cyan-300 focus:border-cyan-400 focus:outline-none"
                placeholder="CÓDIGO DA SALA (EX: 7K4M-XP)"
              />
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleJoinWithCode()}
                className="flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-950/50 disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                <span>Entrar na Sessão</span>
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCreateRoom}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-950/50 disabled:opacity-50"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Criar Nova Sessão</span>
              </button>
            </div>
          </div>

          {/* REALTIME CHAT & EMOTES IN LOBBY */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Comunicação do Santuário
                </h3>
              </div>
              <div className="flex gap-1">
                {['⚔️ Ao Combate!', '⚠️ Cuidado!', '✨ Concentrar Pulso', '🪡 Totem de Descanso'].map(
                  (em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => onSendEmote(em)}
                      className="rounded bg-slate-950 border border-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
                    >
                      {em}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Chat Messages Feed */}
            <div
              ref={chatScrollRef}
              className="h-28 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-1.5 font-mono text-xs"
            >
              {chatMessages.length === 0 ? (
                <div className="text-slate-600 italic text-[11px]">
                  Nenhuma mensagem na sala ainda. Envie um sinal para seus companheiros!
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={`${msg.id || 'msg'}_${idx}`} className="leading-snug">
                    {msg.type === 'system' ? (
                      <span className="text-amber-400/90 font-medium">✦ {msg.text}</span>
                    ) : (
                      <>
                        <span
                          className="font-bold"
                          style={{
                            color: CLOAK_COLORS[msg.colorIndex % CLOAK_COLORS.length]?.hex || '#38bdf8',
                          }}
                        >
                          {msg.senderName}:
                        </span>{' '}
                        <span className="text-slate-300">{msg.text}</span>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Send chat text */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={inputChat}
                onChange={(e) => setInputChat(e.target.value)}
                maxLength={80}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                placeholder="Enviar mensagem para o grupo..."
              />
              <button
                type="submit"
                className="flex items-center justify-center rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-cyan-600 hover:text-white transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3 bg-[#080c14] flex justify-between items-center">
          <div className="text-xs text-slate-500 font-mono">
            {roomPlayers.length} / 4 Conectados · Sala {currentRoomCode}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
          >
            Retornar ao Jogo
          </button>
        </div>
      </div>
    </div>
  );
};
