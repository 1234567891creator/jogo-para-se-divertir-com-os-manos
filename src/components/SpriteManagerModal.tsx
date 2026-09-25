import React, { useState, useEffect } from 'react';
import {
  spriteStore,
  AnimationStateName,
  CustomFrame,
  ANIMATION_CATEGORIES,
  CategoryGroup,
} from '../game/spriteStore';
import {
  X,
  Upload,
  Trash2,
  Image as ImageIcon,
  Check,
  Download,
  Database,
  FileDown,
  FileUp,
  Sparkles,
  Sliders,
  Clock,
  Search,
  Code,
  Copy,
  Users,
  Skull,
  User,
  Layers,
} from 'lucide-react';

interface SpriteManagerModalProps {
  onClose: () => void;
  onOpenOtherPlayersAnimations?: () => void;
}

export const SpriteManagerModal: React.FC<SpriteManagerModalProps> = ({
  onClose,
  onOpenOtherPlayersAnimations,
}) => {
  const [activeTab, setActiveTab] = useState<AnimationStateName>('idle');
  const [viewMode, setViewMode] = useState<'editor' | 'speeds' | 'code'>('editor');
  const [groupFilter, setGroupFilter] = useState<'all' | 'nox' | 'npc' | 'enemy'>('all');
  const [speedSearch, setSpeedSearch] = useState('');
  const [useCustom, setUseCustom] = useState(spriteStore.useCustomSprites);
  const [frames, setFrames] = useState<CustomFrame[]>(spriteStore.customSprites[activeTab] || []);
  const [previewFrameIdx, setPreviewFrameIdx] = useState(0);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [copiedCodeToast, setCopiedCodeToast] = useState(false);

  // Speed regulation states
  const [globalFps, setGlobalFpsState] = useState(spriteStore.globalFps);
  const [categoryFpsMap, setCategoryFpsMap] = useState<Record<string, number>>({
    ...spriteStore.categoryFps,
  });

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 3500);
  };

  useEffect(() => {
    setFrames(spriteStore.customSprites[activeTab] || []);
  }, [activeTab]);

  const currentActiveFps = spriteStore.getFps(activeTab);

  // Frame playback ticker uses activeFps in real time
  useEffect(() => {
    if (frames.length <= 1) {
      setPreviewFrameIdx(0);
      return;
    }
    const intervalMs = Math.max(30, Math.round(1000 / currentActiveFps));
    const interval = setInterval(() => {
      setPreviewFrameIdx((prev) => (prev + 1) % frames.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [frames, currentActiveFps]);

  // Subscribe to store changes (hydration from IndexedDB)
  useEffect(() => {
    const unsub = spriteStore.subscribe(() => {
      setUseCustom(spriteStore.useCustomSprites);
      setGlobalFpsState(spriteStore.globalFps);
      setCategoryFpsMap({ ...spriteStore.categoryFps });
      setFrames(spriteStore.customSprites[activeTab] || []);
    });
    return unsub;
  }, [activeTab]);

  const handleToggleUseCustom = () => {
    const nextVal = !useCustom;
    setUseCustom(nextVal);
    spriteStore.setUseCustom(nextVal);
    showToast(
      nextVal
        ? 'Sprites personalizados ativados no jogo!'
        : 'Arte padrão procedural reativada.'
    );
  };

  const handleCategoryFpsChange = (catKey: AnimationStateName, newFps: number) => {
    const valid = Math.max(1, Math.min(30, Math.round(newFps)));
    spriteStore.setCategoryFps(catKey, valid);
    setCategoryFpsMap((prev) => ({ ...prev, [catKey]: valid }));
  };

  const handleResetCategoryFps = (catKey: AnimationStateName) => {
    spriteStore.setCategoryFps(catKey, null);
    setCategoryFpsMap((prev) => {
      const copy = { ...prev };
      delete copy[catKey];
      return copy;
    });
    showToast(`Velocidade de "${catKey}" resetada para o padrão global.`);
  };

  const handleGlobalFpsChange = (newFps: number) => {
    const valid = Math.max(1, Math.min(30, Math.round(newFps)));
    setGlobalFpsState(valid);
    spriteStore.setGlobalFps(valid);
  };

  const handleApplyToAllCategories = (fps: number) => {
    spriteStore.setAllCategoriesFps(fps);
    showToast(`Todas as categorias configuradas para ${fps} FPS!`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let addedCount = 0;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target?.result as string;
        if (dataUrl) {
          spriteStore.addFrame(activeTab, dataUrl);
          addedCount++;
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
    setTimeout(() => {
      showToast(`${addedCount || files.length} frame(s) adicionado(s) e salvo(s) com sucesso!`);
    }, 300);
  };

  const handleRemoveFrame = (frameId: string) => {
    spriteStore.removeFrame(activeTab, frameId);
    showToast('Frame removido.');
  };

  const handleClearCategory = () => {
    if (confirm(`Tem certeza que deseja apagar todos os frames de "${activeTab}"?`)) {
      spriteStore.clearCategory(activeTab);
      showToast(`Todos os frames de "${activeTab}" foram removidos.`);
    }
  };

  const handleExportBackup = () => {
    const json = spriteStore.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `echoward_sprites_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON exportado com sucesso!');
  };

  const handleCopyEmbeddedCode = () => {
    const code = spriteStore.exportAsEmbeddedCode();
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCodeToast(true);
      showToast('Código TypeScript copiado para a Área de Transferência!');
      setTimeout(() => setCopiedCodeToast(false), 3000);
    });
  };

  const handleDownloadEmbeddedFile = () => {
    const code = spriteStore.exportAsEmbeddedCode();
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'embeddedSprites.ts';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Arquivo embeddedSprites.ts baixado!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (loadEvt) => {
      const text = loadEvt.target?.result as string;
      if (text) {
        const result = await spriteStore.importBackup(text);
        if (result.success) {
          showToast(`Backup importado! ${result.frameCount} frames carregados.`);
        } else {
          showToast('Erro ao importar arquivo de backup.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredCategories = ANIMATION_CATEGORIES.filter((c) => {
    if (groupFilter !== 'all' && c.group !== groupFilter) return false;
    return true;
  });

  const activeCategory =
    ANIMATION_CATEGORIES.find((c) => c.key === activeTab) || ANIMATION_CATEGORIES[0];
  const totalFrames = spriteStore.getTotalFrameCount();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md select-none font-sans">
      <div className="relative flex h-[94vh] w-full max-w-6xl flex-col rounded-2xl border border-slate-700/80 bg-[#090e17] text-slate-200 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 px-6 py-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-950 border border-cyan-700/50 shadow-inner text-cyan-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold tracking-wider text-slate-100 font-serif">
                  Gerenciador de Sprites & Animações
                </h2>
                <div
                  className="flex items-center gap-1 rounded-full bg-emerald-950/80 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300 border border-emerald-700/60 shadow-sm"
                  title="Armazenamento permanente IndexedDB ativo: suas imagens e alterações nunca somem ao recarregar a página!"
                >
                  <Database className="h-3 w-3 text-emerald-400" />
                  <span>Salvo Permanente (IndexedDB)</span>
                  <Check className="h-3 w-3 text-emerald-400" />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Nox, NPCs (interação e diálogo) e Inimigos - suporte a PNGs transparentes e código embutido
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900/90 p-1 text-xs">
              <button
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors ${
                  viewMode === 'editor'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Editor de Sprites
              </button>
              <button
                onClick={() => setViewMode('speeds')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors ${
                  viewMode === 'speeds'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                Velocidades (FPS)
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors ${
                  viewMode === 'code'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                Salvar no Código
              </button>

              {onOpenOtherPlayersAnimations && (
                <button
                  onClick={onOpenOtherPlayersAnimations}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-colors bg-sky-950/80 border border-sky-500/40 text-sky-300 hover:bg-sky-900 shadow-sm"
                  title="Personalizar animações dos outros jogadores co-op"
                >
                  <Sparkles className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
                  <span className="hidden sm:inline">Animações dos Outros Players</span>
                </button>
              )}
            </div>

            {/* Toggle Custom vs Procedural */}
            <button
              onClick={handleToggleUseCustom}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all border ${
                useCustom
                  ? 'border-cyan-500/70 bg-cyan-950/80 text-cyan-300 shadow-md shadow-cyan-900/40'
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>{useCustom ? 'Sprites Custom: ATIVO' : 'Sprites Custom: DESLIGADO'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusToast && (
          <div className="absolute top-16 right-6 z-50 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xl animate-bounce">
            <Check className="h-4 w-4" />
            <span>{statusToast}</span>
          </div>
        )}

        {/* VIEW 1: EDITOR */}
        {viewMode === 'editor' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar with Groups and Categories */}
            <div className="w-80 border-r border-slate-800 bg-[#060a12] flex flex-col">
              {/* Group Filters */}
              <div className="p-2 border-b border-slate-800/80 flex gap-1 bg-slate-950/60">
                <button
                  onClick={() => setGroupFilter('all')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded ${
                    groupFilter === 'all'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos ({ANIMATION_CATEGORIES.length})
                </button>
                <button
                  onClick={() => setGroupFilter('nox')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded flex items-center justify-center gap-1 ${
                    groupFilter === 'nox'
                      ? 'bg-cyan-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-3 h-3" />
                  Nox
                </button>
                <button
                  onClick={() => setGroupFilter('npc')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded flex items-center justify-center gap-1 ${
                    groupFilter === 'npc'
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  NPCs
                </button>
                <button
                  onClick={() => setGroupFilter('enemy')}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded flex items-center justify-center gap-1 ${
                    groupFilter === 'enemy'
                      ? 'bg-rose-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Skull className="w-3 h-3" />
                  Inimigos
                </button>
              </div>

              {/* Category List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredCategories.map((cat) => {
                  const count = spriteStore.customSprites[cat.key]?.length || 0;
                  const isSelected = activeTab === cat.key;
                  const catFps = spriteStore.getFps(cat.key);
                  const isCustomFps =
                    spriteStore.categoryFps[cat.key] !== undefined &&
                    spriteStore.categoryFps[cat.key] !== null;

                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveTab(cat.key)}
                      className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-200 shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <div className="truncate mr-2">
                        <div className="font-semibold truncate flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cat.group === 'nox'
                                ? 'bg-cyan-400'
                                : cat.group === 'npc'
                                ? 'bg-emerald-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          {cat.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">{cat.desc}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
                            isCustomFps
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {catFps} FPS
                        </span>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            count > 0 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Footer info */}
              <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400 flex justify-between items-center">
                <span>Total de Frames:</span>
                <span className="font-mono font-bold text-cyan-300">{totalFrames} frames</span>
              </div>
            </div>

            {/* Main Stage: Preview & Frame Upload */}
            <div className="flex-1 flex flex-col overflow-y-auto p-6 space-y-6">
              {/* Category Info Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 font-serif">
                      <span>{activeCategory.label}</span>
                    </h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        activeCategory.group === 'nox'
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
                          : activeCategory.group === 'npc'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                          : 'bg-rose-950 text-rose-300 border border-rose-700/60'
                      }`}
                    >
                      {activeCategory.group}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{activeCategory.desc}</p>
                </div>

                {/* Individual Speed Regulator */}
                <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="flex justify-between items-center text-[11px] mb-1">
                      <span className="text-slate-400 font-semibold">Velocidade desta ação:</span>
                      <span className="font-mono font-bold text-amber-400 ml-2">
                        {currentActiveFps} FPS
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={currentActiveFps}
                        onChange={(e) =>
                          handleCategoryFpsChange(activeTab, parseInt(e.target.value, 10))
                        }
                        className="w-28 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
                      />
                      {categoryFpsMap[activeTab] && (
                        <button
                          onClick={() => handleResetCategoryFps(activeTab)}
                          className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                          title="Restaurar padrão global"
                        >
                          Resetar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Box & Upload Dropzone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Live Preview Animation */}
                <div className="flex flex-col items-center justify-center p-6 bg-slate-950/80 rounded-2xl border border-slate-800/80 relative min-h-[220px]">
                  <span className="absolute top-3 left-3 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                    Prévia ao Vivo ({currentActiveFps} FPS)
                  </span>

                  {frames.length > 0 ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-36 h-36 flex items-center justify-center bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
                        <img
                          src={frames[previewFrameIdx]?.dataUrl}
                          alt="Preview"
                          className="max-h-full max-w-full object-contain filter drop-shadow-md"
                        />
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        Frame {previewFrameIdx + 1} de {frames.length}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 p-4">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30 text-slate-400" />
                      <p className="text-xs">Nenhum frame customizado adicionado ainda.</p>
                      <p className="text-[11px] text-slate-600 mt-1">
                        O jogo usará a renderização padrão até você adicionar imagens PNG.
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Control */}
                <div className="flex flex-col justify-center p-6 bg-slate-950/80 rounded-2xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 transition-colors">
                  <div className="text-center">
                    <Upload className="w-10 h-10 mx-auto text-cyan-400 mb-2 opacity-80" />
                    <h4 className="text-sm font-bold text-slate-200">
                      Adicionar Frames PNG
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Selecione um ou vários arquivos PNG com fundo transparente para compor esta animação.
                    </p>

                    <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-cyan-600/30 transition-all">
                      <Upload className="w-4 h-4" />
                      Escolher Imagens PNG
                      <input
                        type="file"
                        multiple
                        accept="image/png,image/webp,image/gif"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Frames Gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Frames desta Categoria ({frames.length})
                  </h4>

                  {frames.length > 0 && (
                    <button
                      onClick={handleClearCategory}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Limpar Todos os Frames
                    </button>
                  )}
                </div>

                {frames.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {frames.map((frame, idx) => (
                      <div
                        key={frame.id}
                        className={`group relative flex flex-col items-center bg-slate-900 border rounded-xl p-2 transition-all ${
                          previewFrameIdx === idx
                            ? 'border-cyan-400 shadow-md shadow-cyan-500/20'
                            : 'border-slate-800'
                        }`}
                      >
                        <div className="w-16 h-16 flex items-center justify-center overflow-hidden mb-1">
                          <img
                            src={frame.dataUrl}
                            alt={`Frame ${idx + 1}`}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">#{idx + 1}</span>

                        <button
                          onClick={() => handleRemoveFrame(frame.id)}
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-rose-950/90 text-rose-400 rounded-lg hover:bg-rose-900 transition-opacity"
                          title="Remover frame"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800/40">
                    Nenhum frame carregado. Arraste ou clique em "Escolher Imagens PNG" acima.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: ALL SPEEDS PANEL */}
        {viewMode === 'speeds' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Global Speed Banner */}
            <div className="p-5 bg-slate-950/80 rounded-2xl border border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Velocidade Global de Fallback
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Taxa de quadros aplicada a qualquer ação que não possua velocidade individual customizada.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="24"
                  value={globalFps}
                  onChange={(e) => handleGlobalFpsChange(parseInt(e.target.value, 10))}
                  className="w-32 h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
                />
                <span className="font-mono font-bold text-amber-300 text-sm">{globalFps} FPS</span>

                <button
                  onClick={() => handleApplyToAllCategories(globalFps)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow"
                >
                  Aplicar a Todas
                </button>
              </div>
            </div>

            {/* Filter Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Pesquisar categoria de animação..."
                  value={speedSearch}
                  onChange={(e) => setSpeedSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Grid of All Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ANIMATION_CATEGORIES.filter((c) =>
                c.label.toLowerCase().includes(speedSearch.toLowerCase()) ||
                c.key.toLowerCase().includes(speedSearch.toLowerCase())
              ).map((cat) => {
                const effectiveFps = spriteStore.getFps(cat.key);
                const isCustom = categoryFpsMap[cat.key] !== undefined && categoryFpsMap[cat.key] !== null;

                return (
                  <div
                    key={cat.key}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-xs text-slate-200 truncate">{cat.label}</div>
                        <div className="text-[10px] text-slate-400">{cat.desc}</div>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          isCustom
                            ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {effectiveFps} FPS
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={effectiveFps}
                        onChange={(e) =>
                          handleCategoryFpsChange(cat.key, parseInt(e.target.value, 10))
                        }
                        className="flex-1 h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
                      />
                      {isCustom && (
                        <button
                          onClick={() => handleResetCategoryFps(cat.key)}
                          className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                        >
                          Padrão
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3: SAVE TO CODE (EMBEDDED CODE EXPORT) */}
        {viewMode === 'code' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="p-5 bg-purple-950/20 border border-purple-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-purple-300 flex items-center gap-2 font-serif">
                  <Code className="w-5 h-5 text-purple-400" />
                  Salvar Sprites Diretamente no Código Fonte
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Seus sprites já estão seguros permanentemente no navegador via IndexedDB. Você também pode
                  exportar o arquivo TypeScript <code className="text-purple-300">src/game/embeddedSprites.ts</code> com 1 clique para que as artes fiquem guardadas para sempre no repositório Git!
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyEmbeddedCode}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
                >
                  {copiedCodeToast ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedCodeToast ? 'Código Copiado!' : 'Copiar Código TypeScript'}
                </button>

                <button
                  onClick={handleDownloadEmbeddedFile}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/50 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Baixar embeddedSprites.ts
                </button>
              </div>
            </div>

            {/* Backups JSON */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  Backup Completo em Arquivo JSON
                </h4>
                <p className="text-[11px] text-slate-400">
                  Exporte ou importe todos os seus frames e configurações em um arquivo portátil.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportBackup}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Exportar Backup JSON
                </button>

                <label className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-medium flex items-center gap-1.5 border border-slate-700 cursor-pointer">
                  <FileUp className="w-3.5 h-3.5" />
                  Importar Backup
                  <input
                    type="file"
                    accept="application/json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Code Snippet Preview */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Prévia do Código Gerado:
              </span>
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
                {spriteStore.exportAsEmbeddedCode().slice(0, 1800)}...
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>IndexedDB Ativo</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg shadow-md shadow-cyan-600/20"
          >
            Concluir & Voltar ao Jogo
          </button>
        </div>
      </div>
    </div>
  );
};
