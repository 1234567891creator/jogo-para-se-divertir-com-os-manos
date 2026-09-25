import React, { useState, useEffect } from 'react';
import {
  playerAnimationStore,
  ANIMATION_STYLE_PRESETS,
  INTERACTIVE_POSES,
  AnimationStylePreset,
} from '../game/playerAnimationStore';
import { multiplayerClient } from '../game/multiplayerClient';
import { RemotePlayer, RemoteAnimationStyle, RoomPlayerInfo } from '../game/types';
import {
  X,
  Sparkles,
  Zap,
  Sliders,
  Users,
  Activity,
  Check,
  RotateCcw,
  Radio,
  Flame,
  Music,
  Eye,
  Shield,
  Send,
} from 'lucide-react';

interface OtherPlayersAnimationModalProps {
  onClose: () => void;
  remotePlayers: RemotePlayer[];
}

export const OtherPlayersAnimationModal: React.FC<OtherPlayersAnimationModalProps> = ({
  onClose,
  remotePlayers,
}) => {
  const [activeTab, setActiveTab] = useState<'styles' | 'poses' | 'settings'>('styles');
  const [globalStyle, setGlobalStyle] = useState<RemoteAnimationStyle>(
    playerAnimationStore.globalOtherPlayersStyle
  );
  const [perPlayerMap, setPerPlayerMap] = useState<Record<string, RemoteAnimationStyle>>({
    ...playerAnimationStore.perPlayerStyles,
  });
  const [animSpeed, setAnimSpeed] = useState<number>(playerAnimationStore.animationSpeed);
  const [intensity, setIntensity] = useState<'baixo' | 'normal' | 'intenso'>(
    playerAnimationStore.effectsIntensity
  );
  const [selectedCompanionId, setSelectedCompanionId] = useState<string>('all');
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Sync with store
  useEffect(() => {
    const unsub = playerAnimationStore.subscribe(() => {
      setGlobalStyle(playerAnimationStore.globalOtherPlayersStyle);
      setPerPlayerMap({ ...playerAnimationStore.perPlayerStyles });
      setAnimSpeed(playerAnimationStore.animationSpeed);
      setIntensity(playerAnimationStore.effectsIntensity);
    });
    return unsub;
  }, []);

  const showToast = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3000);
  };

  const handleSelectGlobalStyle = (style: RemoteAnimationStyle, broadcastToRoom: boolean = true) => {
    playerAnimationStore.setGlobalOtherPlayersStyle(style);
    setGlobalStyle(style);

    if (broadcastToRoom && multiplayerClient.isConnected) {
      multiplayerClient.changeOtherPlayersAnimationStyle(style, 'all');
      showToast(`✨ Estilo "${style.toUpperCase()}" aplicado e transmitido para toda a sala!`);
    } else {
      showToast(`✨ Estilo "${style.toUpperCase()}" aplicado na sua visão local.`);
    }
  };

  const handleSelectPlayerStyle = (
    playerIdOrName: string,
    style: RemoteAnimationStyle,
    broadcast: boolean = true
  ) => {
    playerAnimationStore.setPlayerStyle(playerIdOrName, style);
    setPerPlayerMap((prev) => ({ ...prev, [playerIdOrName]: style }));

    if (broadcast && multiplayerClient.isConnected) {
      multiplayerClient.changeOtherPlayersAnimationStyle(style, playerIdOrName);
      showToast(`🎭 Estilo do jogador atualizado para "${style.toUpperCase()}"!`);
    } else {
      showToast(`🎭 Estilo do jogador alterado na sua tela!`);
    }
  };

  const handleResetPlayerStyle = (playerIdOrName: string) => {
    playerAnimationStore.resetPlayerStyle(playerIdOrName);
    setPerPlayerMap((prev) => {
      const next = { ...prev };
      delete next[playerIdOrName];
      return next;
    });
    showToast(`🔄 Jogador voltou a usar o estilo padrão geral.`);
  };

  const handleResetAllToDefault = () => {
    playerAnimationStore.resetAllToGlobal();
    playerAnimationStore.setGlobalOtherPlayersStyle('padrao');
    playerAnimationStore.setAnimationSpeed(1.0);
    playerAnimationStore.setEffectsIntensity('normal');
    if (multiplayerClient.isConnected) {
      multiplayerClient.changeOtherPlayersAnimationStyle('padrao', 'all');
    }
    showToast(`🔄 Todas as animações foram restauradas para o clássico padrão.`);
  };

  const handleTriggerInteractivePose = (poseId: string, durationSec: number = 6) => {
    const target = selectedCompanionId;
    playerAnimationStore.triggerPose(target, poseId, durationSec);

    if (multiplayerClient.isConnected) {
      multiplayerClient.triggerAnimationPose(poseId, target, durationSec);
      showToast(
        `⚡ Ação "${poseId.toUpperCase()}" enviada em tempo real para ${target === 'all' ? 'todos os companheiros' : 'o companheiro'}!`
      );
    } else {
      showToast(
        `⚡ Ação executada localmente para ${target === 'all' ? 'todos os companheiros' : 'o jogador'}!`
      );
    }
  };

  // Connected players list from multiplayer client
  const allConnectedCompanions: RoomPlayerInfo[] = multiplayerClient.roomPlayers.filter(
    (p) => p.id !== multiplayerClient.myClientId
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-fadeIn">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-sky-500/30 bg-slate-950/95 shadow-2xl shadow-sky-950/50 text-slate-100 overflow-hidden">
        
        {/* Header Bar */}
        <div className="relative flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 shadow-inner">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-wider text-sky-200 uppercase">
                  Animações dos Outros Players
                </h2>
                <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-300 border border-sky-500/30">
                  Co-op Visual Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Personalize como os outros jogadores se movem, atacam, saltam e se expressam no seu mundo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetAllToDefault}
              title="Restaurar Padrão"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Restaurar</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/60 text-slate-400 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800/80 bg-slate-900/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('styles')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'styles'
                ? 'border-sky-400 text-sky-300 bg-sky-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Estilos de Animação ({ANIMATION_STYLE_PRESETS.length})
          </button>
          <button
            onClick={() => setActiveTab('poses')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'poses'
                ? 'border-sky-400 text-sky-300 bg-sky-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="h-4 w-4" />
            Poses & Ações em Tempo Real ({INTERACTIVE_POSES.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold tracking-wide transition-all ${
              activeTab === 'settings'
                ? 'border-sky-400 text-sky-300 bg-sky-500/10 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="h-4 w-4" />
            Velocidade & Intensidade
          </button>
        </div>

        {/* Status Toast Notification */}
        {statusNotification && (
          <div className="bg-sky-500/20 border-b border-sky-500/30 px-6 py-2 text-center text-xs font-semibold text-sky-200 flex items-center justify-center gap-2 animate-fadeIn">
            <Radio className="h-3.5 w-3.5 text-sky-400 animate-spin" />
            {statusNotification}
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: ESTILOS VISUAIS DE ANIMAÇÃO */}
          {activeTab === 'styles' && (
            <div className="space-y-6">
              
              {/* Global Style Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <Users className="h-4 w-4 text-sky-400" />
                      1. Estilo Principal para os Companheiros
                    </h3>
                    <p className="text-xs text-slate-400">
                      Escolha o comportamento visual padrão aplicado aos outros jogadores na sua visão
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-sky-400 bg-sky-950/60 border border-sky-800/40 rounded px-2.5 py-1">
                    Ativo: {globalStyle.toUpperCase()}
                  </span>
                </div>

                {/* Preset Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ANIMATION_STYLE_PRESETS.map((preset) => {
                    const isSelected = globalStyle === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectGlobalStyle(preset.id)}
                        className={`group relative flex flex-col justify-between rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-sky-400 bg-sky-950/40 shadow-lg shadow-sky-950/60 ring-1 ring-sky-400/40'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                              {preset.badge} {preset.name}
                            </span>
                            {isSelected && (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-slate-950">
                                <Check className="h-3 w-3 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-sky-300/80 mb-2">
                            {preset.tagline}
                          </p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {preset.description}
                          </p>
                        </div>

                        {/* Tag Pills & Quick Select */}
                        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {preset.tags.map((t, idx) => (
                              <span
                                key={idx}
                                className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-300"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                              isSelected
                                ? 'bg-sky-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                            }`}
                          >
                            {isSelected ? 'Em Uso' : 'Aplicar'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Individual Player Overrides */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-400" />
                      2. Personalização Individual por Jogador Conectado
                    </h3>
                    <p className="text-xs text-slate-400">
                      Defina um estilo diferente para cada amigo específico que está na sala
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {allConnectedCompanions.length > 0
                      ? `${allConnectedCompanions.length} companheiro(s) online`
                      : 'Nenhum outro jogador conectado no momento'}
                  </span>
                </div>

                {allConnectedCompanions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center text-xs text-slate-400">
                    <p className="font-medium text-slate-300 mb-1">
                      Você está sozinho na sala no momento.
                    </p>
                    <p>
                      Quando outros jogadores entrarem pelo código da sala (tecla <kbd className="px-1 py-0.5 rounded bg-slate-800 text-sky-300">[P]</kbd>), eles aparecerão aqui para você alterar individualmente o estilo de animação de cada um!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allConnectedCompanions.map((comp) => {
                      const currentCompStyle = perPlayerMap[comp.id] || perPlayerMap[comp.name] || globalStyle;
                      const hasCustom = Boolean(perPlayerMap[comp.id] || perPlayerMap[comp.name]);

                      return (
                        <div
                          key={comp.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-slate-800/80 bg-slate-950/60 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center font-bold text-xs"
                              style={{
                                backgroundColor: ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][comp.colorIndex % 4],
                              }}
                            >
                              {comp.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-200">
                                  {comp.name}
                                </span>
                                <span className="text-[10px] rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">
                                  {comp.character}
                                </span>
                                {hasCustom && (
                                  <span className="text-[9px] rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2">
                                    Personalizado
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                Estilo Atual: <span className="text-sky-300 font-semibold">{currentCompStyle.toUpperCase()}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <select
                              value={currentCompStyle}
                              onChange={(e) =>
                                handleSelectPlayerStyle(comp.id, e.target.value as RemoteAnimationStyle)
                              }
                              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-sky-400 focus:outline-none"
                            >
                              {ANIMATION_STYLE_PRESETS.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.badge} {p.name}
                                </option>
                              ))}
                            </select>

                            {hasCustom && (
                              <button
                                onClick={() => handleResetPlayerStyle(comp.id)}
                                title="Voltar ao estilo geral"
                                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1.5 text-xs text-slate-400 hover:text-white"
                              >
                                Padrão Geral
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: POSES & AÇÕES INTERATIVAS */}
          {activeTab === 'poses' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-1">
                  <Zap className="h-4 w-4 text-amber-400" />
                  Poses & Ações Coreografadas dos Companheiros
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Dispare poses especiais, meditações ou celebrações coletivas. Elas são transmitidas em tempo real para os outros jogadores da sala!
                </p>

                {/* Target Player Filter */}
                <div className="flex items-center gap-2 mb-4 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-medium pl-2">Alvo da Ação:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setSelectedCompanionId('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        selectedCompanionId === 'all'
                          ? 'bg-sky-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      🌟 Todos os Companheiros
                    </button>
                    {allConnectedCompanions.map((comp) => (
                      <button
                        key={comp.id}
                        onClick={() => setSelectedCompanionId(comp.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          selectedCompanionId === comp.id
                            ? 'bg-sky-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {comp.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {INTERACTIVE_POSES.map((pose) => (
                    <div
                      key={pose.id}
                      className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-sky-500/40 hover:bg-slate-900/90 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <span className="text-2xl">{pose.icon}</span>
                          <div>
                            <h4 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors">
                              {pose.name}
                            </h4>
                            <span className="text-[10px] text-slate-400">
                              Duração: {pose.duration}s
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                          {pose.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleTriggerInteractivePose(pose.id, pose.duration)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-500/10 border border-sky-500/30 px-3 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500 hover:text-slate-950 transition-all shadow-sm"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Executar no Companheiro
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VELOCIDADE & AJUSTES DE FÍSICA */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2 mb-1">
                  <Sliders className="h-4 w-4 text-sky-400" />
                  Ajustes Finos de Animação & Renderização
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  Controle a cadência temporal e a intensidade dos efeitos especiais visuais dos outros jogadores
                </p>

                {/* Animation Speed Slider */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">
                        Velocidade de Animação dos Outros Jogadores
                      </h4>
                      <p className="text-xs text-slate-400">
                        Altera o ritmo de passos, ondulação da capa, respiração e balanço de lâmina
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-sky-400 bg-sky-950/80 border border-sky-800/40 rounded px-2.5 py-1">
                        {animSpeed.toFixed(1)}x
                      </span>
                      <button
                        onClick={() => {
                          playerAnimationStore.setAnimationSpeed(1.0);
                          setAnimSpeed(1.0);
                        }}
                        className="text-xs text-slate-400 hover:text-white underline"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={animSpeed}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setAnimSpeed(val);
                      playerAnimationStore.setAnimationSpeed(val);
                    }}
                    className="w-full accent-sky-400 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0.5x (Câmera Lenta Épica)</span>
                    <span>1.0x (Padrão Normal)</span>
                    <span>1.5x (Ágil)</span>
                    <span>2.5x (Frenético)</span>
                  </div>
                </div>

                {/* Effects Intensity */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-200">
                      Intensidade dos Efeitos Visuais Co-op
                    </h4>
                    <p className="text-xs text-slate-400">
                      Controla a quantidade de partículas, rastros de poeira estelar, faíscas de lâmina e pós-imagens
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {(['baixo', 'normal', 'intenso'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => {
                          playerAnimationStore.setEffectsIntensity(lvl);
                          setIntensity(lvl);
                        }}
                        className={`py-3 px-4 rounded-xl border text-xs font-bold capitalize transition-all ${
                          intensity === lvl
                            ? 'border-sky-400 bg-sky-500/20 text-sky-200 shadow-md ring-1 ring-sky-400/40'
                            : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {lvl === 'baixo' && '🍃 Baixo / Limpo'}
                        {lvl === 'normal' && '⚖️ Equilibrado'}
                        {lvl === 'intenso' && '✨ Intenso & Vibrante'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="border-t border-slate-800 bg-slate-900/80 px-6 py-3.5 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Sincronização em tempo real ativa na sala co-op</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-sky-500 hover:bg-sky-400 px-5 py-2 font-bold text-slate-950 transition-colors shadow-md shadow-sky-500/20"
          >
            Pronto / Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
