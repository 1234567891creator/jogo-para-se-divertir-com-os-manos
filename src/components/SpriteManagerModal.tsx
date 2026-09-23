import React, { useState, useEffect } from 'react';
import { spriteStore, AnimationStateName, CustomFrame } from '../game/spriteStore';
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
  Sword,
  DoorOpen,
  HandMetal,
  MessageSquare,
  Sliders,
  Clock,
  Search,
} from 'lucide-react';

interface SpriteManagerModalProps {
  onClose: () => void;
}

const ANIMATION_CATEGORIES: Array<{
  key: AnimationStateName;
  label: string;
  desc: string;
  icon?: string;
}> = [
  { key: 'idle', label: 'Idle (Parado)', desc: 'Respiração e ondulação suave da capa' },
  { key: 'correr', label: 'Correr (Movimentação)', desc: 'Animação de corrida para toda locomoção no chão' },
  { key: 'pulo_inicio', label: 'Pulo (Ao Apertar / Impulso)', desc: 'Momento exato em que aperta o botão saindo do chão' },
  { key: 'pulo_ar', label: 'Pulo no Ar (Subida)', desc: 'Ascendendo pelo ar após o impulso inicial' },
  { key: 'queda_ar', label: 'Queda no Ar (Descida)', desc: 'Caindo pelo ar com a capa flutuando para cima' },
  { key: 'aterrissagem', label: 'Aterrissagem (Ao Tocar o Chão)', desc: 'Impacto no solo e agachamento com poeira' },
  { key: 'pular', label: 'Pulo Geral (Fallback)', desc: 'Usado caso não defina início ou subida separadamente' },
  { key: 'queda', label: 'Queda Geral (Fallback)', desc: 'Usado caso não defina queda no ar' },
  { key: 'dash', label: 'Dash (Passo Fantasma)', desc: 'Torpedo horizontal com arco de choque ciano' },
  { key: 'dash_aereo', label: 'Dash Aéreo', desc: 'Investida horizontal em pleno voo' },
  { key: 'escalada', label: 'Escalada / Deslize', desc: 'Apoiado em paredes rochosas' },
  { key: 'mergulho', label: 'Mergulho Abissal', desc: 'Descida vertical com lâmina para baixo' },
  { key: 'lamina', label: 'Lâmina (Efeito do Corte / Slash FX)', desc: 'Efeito do arco cortante no ar (PNG sem fundo)' },
  { key: 'lamina_vertical', label: 'Lâmina (Corte para Cima)', desc: 'Efeito do corte ascendente' },
  { key: 'lamina_baixo', label: 'Lâmina (Corte Baixo / Pogo)', desc: 'Efeito do corte descendente para quicar' },
  { key: 'espada', label: 'Espada (Golpe do Personagem)', desc: 'Animação de Nox desferindo o golpe de espada' },
  { key: 'ataque_horizontal', label: 'Ataque Lateral', desc: 'Corte horizontal com arco ciano' },
  { key: 'ataque_vertical', label: 'Ataque Vertical', desc: 'Corte ascendente em arco' },
  { key: 'ataque_baixo', label: 'Ataque Baixo (Pogo)', desc: 'Golpe descendente para quicar' },
  { key: 'entrar_porta', label: 'Entrar em Portas', desc: 'Passagem por arcos, portais e transições de tela' },
  { key: 'interagir', label: 'Interagir', desc: 'Comunhão em totens de repouso, tábuas e altares' },
  { key: 'falar', label: 'Falar / Conversar', desc: 'Postura de diálogo ao conversar com NPCs' },
  { key: 'curar', label: 'Curar (Pulso)', desc: 'Ajoelhado com relíquia de ressonância' },
  { key: 'dano', label: 'Receber Dano', desc: 'Recuo com fagulhas púrpuras' },
  { key: 'morrer', label: 'Morrer', desc: 'Dissolução pacífica em cinzas' },
];

export const SpriteManagerModal: React.FC<SpriteManagerModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<AnimationStateName>('idle');
  const [viewMode, setViewMode] = useState<'editor' | 'speeds'>('editor');
  const [speedSearch, setSpeedSearch] = useState('');
  const [useCustom, setUseCustom] = useState(spriteStore.useCustomSprites);
  const [frames, setFrames] = useState<CustomFrame[]>(spriteStore.customSprites[activeTab] || []);
  const [previewFrameIdx, setPreviewFrameIdx] = useState(0);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Speed regulation states
  const [globalFps, setGlobalFpsState] = useState(spriteStore.globalFps);
  const [categoryFpsMap, setCategoryFpsMap] = useState<Record<string, number>>({ ...spriteStore.categoryFps });

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
      setFrames([...(spriteStore.customSprites[activeTab] || [])]);
      setGlobalFpsState(spriteStore.globalFps);
      setCategoryFpsMap({ ...spriteStore.categoryFps });
    });
    return () => {
      unsub();
    };
  }, [activeTab]);

  // Direct individual adjustment for a category
  const handleIndividualCategoryFps = (catKey: AnimationStateName, newFps: number) => {
    spriteStore.setCategoryFps(catKey, newFps);
    setCategoryFpsMap({ ...spriteStore.categoryFps });
  };

  const handleApplyPreset = (fps: number) => {
    handleIndividualCategoryFps(activeTab, fps);
    showToast(`Velocidade de [${activeCategory?.label || activeTab}] ajustada para ${fps} FPS`);
  };

  const handleApplyToAllCategories = (fps: number) => {
    spriteStore.setAllCategoriesFps(fps);
    setGlobalFpsState(fps);
    setCategoryFpsMap({ ...spriteStore.categoryFps });
    showToast(`Todas as animações configuradas para ${fps} FPS`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let count = 0;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          spriteStore.addFrame(activeTab, dataUrl);
          count++;
          setFrames([...(spriteStore.customSprites[activeTab] || [])]);
          setUseCustom(true);
          showToast(`${count} frame(s) adicionados e salvos permanentemente!`);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleToggleUseCustom = (val: boolean) => {
    spriteStore.setUseCustom(val);
    setUseCustom(val);
    showToast(
      val
        ? 'Modo: Sprites Personalizados ativado!'
        : 'Modo: Visual Ilustrado Original ativado!'
    );
  };

  const handleRemoveFrame = (frameId: string) => {
    spriteStore.removeFrame(activeTab, frameId);
    setFrames([...(spriteStore.customSprites[activeTab] || [])]);
    showToast('Frame removido e salvo no banco de dados!');
  };

  const handleClearCategory = () => {
    spriteStore.clearCategory(activeTab);
    setFrames([]);
    showToast(`Frames de [${activeCategory.label}] limpos!`);
  };

  // Export full sprite package as JSON file
  const handleExportBackup = () => {
    const jsonStr = spriteStore.exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `echoward_sprites_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso! Guarde este arquivo em seu computador.');
  };

  // Import full sprite package from JSON file
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      if (text) {
        const res = await spriteStore.importBackup(text);
        if (res.success) {
          setFrames([...(spriteStore.customSprites[activeTab] || [])]);
          setUseCustom(true);
          showToast(`Backup importado com sucesso! ${res.frameCount} frames carregados.`);
        } else {
          showToast('Erro ao importar arquivo de backup.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const activeCategory = ANIMATION_CATEGORIES.find((c) => c.key === activeTab)!;
  const totalFrames = spriteStore.getTotalFrameCount();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md select-none">
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col rounded-xl border border-slate-700/80 bg-[#090e17] text-slate-200 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 px-6 py-3.5 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-700/50 shadow-inner">
              <ImageIcon className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg font-bold tracking-wider text-slate-100">
                  Gerenciador de Animações & Sprites de Nox
                </h2>
                {/* Permanent Storage Badge */}
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
                Adicione suas imagens sem fundo (PNG) frame por frame para todas as ações de combate e exploração
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-900/90 p-1 text-xs">
              <button
                onClick={() => setViewMode('editor')}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-semibold transition-colors ${
                  viewMode === 'editor'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Editor & Frames</span>
              </button>
              <button
                onClick={() => setViewMode('speeds')}
                className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-semibold transition-colors ${
                  viewMode === 'speeds'
                    ? 'bg-cyan-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="h-3.5 w-3.5 text-cyan-300" />
                <span>Painel de Todas as Velocidades</span>
              </button>
            </div>

            {/* Backup Export / Import */}
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
              title="Baixar cópia de segurança de todos os seus sprites"
            >
              <FileDown className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden md:inline">Backup</span>
            </button>

            <label
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
              title="Restaurar sprites a partir de um backup .json"
            >
              <FileUp className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden md:inline">Restaurar</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>

            {/* Toggle Mode */}
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-xs">
              <span className="text-slate-400 hidden lg:inline">Modo:</span>
              <button
                onClick={() => handleToggleUseCustom(!useCustom)}
                className={`flex items-center gap-1 font-semibold rounded px-2 py-0.5 transition-colors ${
                  useCustom
                    ? 'bg-cyan-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {useCustom ? 'Sprites Importados' : 'Ilustrado Procedural'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Fechar gerenciador"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Live Notification Toast */}
        {statusToast && (
          <div className="absolute top-16 inset-x-0 z-50 flex justify-center pointer-events-none">
            <div className="flex items-center gap-2 rounded-lg border border-cyan-500/70 bg-slate-950/95 px-4 py-2 text-xs font-semibold text-cyan-200 shadow-xl backdrop-blur-md animate-fade-in">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>{statusToast}</span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="grid flex-1 grid-cols-1 md:grid-cols-4 overflow-hidden">
          {/* Categories Sidebar */}
          <div className="border-r border-slate-800/80 bg-[#06090e] p-3 overflow-y-auto space-y-1">
            <div className="flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Categorias ({ANIMATION_CATEGORIES.length})</span>
              <span className="font-mono text-cyan-400">{totalFrames} frames</span>
            </div>

            {ANIMATION_CATEGORIES.map((cat) => {
              const count = spriteStore.customSprites[cat.key]?.length || 0;
              const isSelected = activeTab === cat.key;
              const catFpsVal = spriteStore.getFps(cat.key);
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveTab(cat.key);
                    if (viewMode === 'speeds') setViewMode('editor');
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? 'border border-cyan-500/60 bg-slate-900 text-cyan-200 font-semibold shadow-sm shadow-cyan-950'
                      : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="truncate">{cat.label}</span>
                    <span className="text-[10px] text-slate-400 truncate">{cat.desc}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="rounded bg-slate-950 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 border border-slate-800" title={`Velocidade Individual: ${catFpsVal} FPS`}>
                      {catFpsVal} FPS
                    </span>
                    {count > 0 ? (
                      <span className="rounded-full bg-cyan-950 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-700">
                        {count}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600 font-mono">0</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Content Area */}
          <div className="col-span-3 flex flex-col justify-between p-6 overflow-y-auto bg-[#090e17]">
            {viewMode === 'speeds' ? (
              /* All Categories Individual Speeds Panel */
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-display text-xl font-bold text-slate-100 flex items-center gap-2">
                      <Sliders className="h-5 w-5 text-cyan-400" />
                      Regulador de Velocidades Individuais
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Ajuste individualmente a taxa de quadros (FPS) de cada uma das {ANIMATION_CATEGORIES.length} ações.
                    </p>
                  </div>

                  {/* Search / Filter */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filtrar ação (ex: correr, pulo, lamina)..."
                      value={speedSearch}
                      onChange={(e) => setSpeedSearch(e.target.value)}
                      className="rounded-lg border border-slate-700 bg-slate-900/90 pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none w-64"
                    />
                  </div>
                </div>

                {/* Batch presets */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#060a12] p-4">
                  <span className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    Ajustar todas de uma vez:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleApplyToAllCategories(2)}
                      className="px-3 py-1 text-xs rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-white transition-colors"
                    >
                      🐌 Todas em 2 FPS (Muito Lenta)
                    </button>
                    <button
                      onClick={() => handleApplyToAllCategories(4)}
                      className="px-3 py-1 text-xs rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-white transition-colors"
                    >
                      🐢 Todas em 4 FPS (Lenta)
                    </button>
                    <button
                      onClick={() => handleApplyToAllCategories(5)}
                      className="px-3 py-1 text-xs rounded-md bg-cyan-950 border border-cyan-700 text-cyan-200 hover:bg-cyan-900/60 transition-colors font-medium"
                    >
                      ✨ Todas em 5 FPS (Recomendada)
                    </button>
                    <button
                      onClick={() => handleApplyToAllCategories(8)}
                      className="px-3 py-1 text-xs rounded-md bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-500 hover:text-white transition-colors"
                    >
                      🏃 Todas em 8 FPS (Padrão)
                    </button>
                  </div>
                </div>

                {/* Grid of Individual Category Speed Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ANIMATION_CATEGORIES.filter((cat) => {
                    if (!speedSearch.trim()) return true;
                    const q = speedSearch.toLowerCase();
                    return cat.label.toLowerCase().includes(q) || cat.desc.toLowerCase().includes(q);
                  }).map((cat) => {
                    const currentFps = spriteStore.getFps(cat.key);
                    const count = spriteStore.customSprites[cat.key]?.length || 0;
                    return (
                      <div
                        key={cat.key}
                        className="rounded-xl border border-slate-800 bg-[#080d17] p-4 shadow-sm hover:border-slate-700 transition-colors flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display text-sm font-bold text-slate-200">
                                {cat.label}
                              </h4>
                              {count > 0 && (
                                <span className="rounded-full bg-cyan-950 px-2 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-800">
                                  {count} frames
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{cat.desc}</p>
                          </div>

                          <div className="flex items-center gap-1.5 rounded-full border border-cyan-800/80 bg-cyan-950/70 px-2.5 py-0.5 text-xs font-mono text-cyan-300 shrink-0">
                            <Clock className="h-3 w-3 text-cyan-400" />
                            <span className="font-bold">{currentFps} FPS</span>
                          </div>
                        </div>

                        {/* Individual Slider */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>1 FPS</span>
                            <span className="text-cyan-300">~{Math.round(1000 / currentFps)}ms por frame</span>
                            <span>20 FPS</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={20}
                            step={1}
                            value={currentFps}
                            onChange={(e) => handleIndividualCategoryFps(cat.key, Number(e.target.value))}
                            className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Presets and Go to frames button */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                          <div className="flex items-center gap-1">
                            {[2, 4, 5, 8, 12].map((pVal) => (
                              <button
                                key={pVal}
                                onClick={() => handleIndividualCategoryFps(cat.key, pVal)}
                                className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                                  currentFps === pVal
                                    ? 'bg-cyan-600 text-white font-bold'
                                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {pVal} FPS
                              </button>
                            ))}
                          </div>

                          <button
                            onClick={() => {
                              setActiveTab(cat.key);
                              setViewMode('editor');
                            }}
                            className="text-cyan-400 hover:text-cyan-300 underline font-medium text-[11px]"
                          >
                            Editar frames
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Single Category Frame Editor & Individual Speed Card */
              <div>
                {/* Category Title & Actions */}
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 mb-5 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-xl font-bold text-slate-100">
                        {activeCategory.label}
                      </h3>
                      <span className="text-xs font-mono text-cyan-400">
                        [{frames.length} frame{frames.length !== 1 ? 's' : ''}]
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeCategory.desc}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition-colors shadow-md shadow-cyan-900/40">
                      <Upload className="h-4 w-4" />
                      Adicionar Imagens PNG (Sem Fundo)
                      <input
                        type="file"
                        accept="image/png,image/webp"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {frames.length > 0 && (
                      <button
                        onClick={handleClearCategory}
                        className="flex items-center gap-1 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300 hover:bg-red-900/60 transition-colors"
                        title="Limpar todos os frames desta animação"
                      >
                        <Trash2 className="h-4 w-4" />
                        Limpar Categoria
                      </button>
                    )}
                  </div>
                </div>

                {/* Dedicated Individual Speed Regulator for Active Category */}
                <div className="rounded-xl border border-cyan-800/60 bg-[#060a12] p-4 mb-6 shadow-inner">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-cyan-400" />
                      <h4 className="font-display font-bold text-sm text-cyan-200">
                        Velocidade Individual de [{activeCategory.label}]
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        (Ajuste diretamente a velocidade desta ação específica)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 rounded-full border border-cyan-600/80 bg-cyan-950 px-3 py-1 text-xs font-mono text-cyan-300 shadow">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" />
                        <span className="font-bold">{currentActiveFps} FPS</span>
                        <span className="text-slate-400 text-[10px]">
                          (~{Math.round(1000 / currentActiveFps)}ms por frame)
                        </span>
                      </div>

                      <button
                        onClick={() => setViewMode('speeds')}
                        className="flex items-center gap-1 rounded-lg border border-cyan-800/80 bg-cyan-950/40 px-2.5 py-1 text-xs text-cyan-300 hover:bg-cyan-900/60 hover:text-white transition-colors"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        <span>Ver Todas as Velocidades</span>
                      </button>
                    </div>
                  </div>

                  {/* Slider bar directly setting this category */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400 min-w-[75px] font-medium">
                        1 FPS (Muito lenta)
                      </span>
                      <input
                        type="range"
                        min={1}
                        max={20}
                        step={1}
                        value={currentActiveFps}
                        onChange={(e) => handleIndividualCategoryFps(activeTab, Number(e.target.value))}
                        className="flex-1 accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer transition-all"
                      />
                      <span className="text-[11px] text-slate-400 min-w-[75px] text-right font-medium">
                        20 FPS (Rápida)
                      </span>
                    </div>

                    {/* Preset quick buttons & copy to all */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 mr-1">Atalhos individuais:</span>
                        {[
                          { fps: 2, label: '🐌 2 FPS' },
                          { fps: 3, label: '3 FPS' },
                          { fps: 4, label: '🐢 4 FPS' },
                          { fps: 5, label: '✨ 5 FPS' },
                          { fps: 6, label: '6 FPS' },
                          { fps: 8, label: '🏃 8 FPS' },
                          { fps: 12, label: '⚡ 12 FPS' },
                        ].map((p) => (
                          <button
                            key={p.fps}
                            onClick={() => handleApplyPreset(p.fps)}
                            className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                              currentActiveFps === p.fps
                                ? 'bg-cyan-600 text-white font-bold shadow-sm'
                                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApplyToAllCategories(currentActiveFps)}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
                          title="Configura todas as outras 24 animações com este mesmo valor"
                        >
                          Copiar {currentActiveFps} FPS para todas as outras animações
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-Time Animation Preview Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-[#06090f] p-5 shadow-inner">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 mb-3">
                    Prévia da Animação ({frames.length} frames)
                  </span>
                  <div className="relative flex h-36 w-36 items-center justify-center rounded-lg border border-slate-700/60 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:12px_12px] overflow-hidden">
                    {frames.length > 0 ? (
                      <img
                        src={frames[previewFrameIdx]?.dataUrl}
                        alt="Preview"
                        className="h-28 w-28 object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400 text-xs text-center p-2">
                        <ImageIcon className="h-8 w-8 text-slate-600 mb-1" />
                        <span>Nenhum frame enviado</span>
                        <span className="text-[10px] text-cyan-400/80 mt-1">Usando visual ilustrado</span>
                      </div>
                    )}
                  </div>
                  {frames.length > 1 && (
                    <span className="mt-2 text-[11px] font-mono text-cyan-300">
                      Reproduzindo Frame {previewFrameIdx + 1} de {frames.length}
                    </span>
                  )}
                </div>

                {/* Instructions & Guidelines matching User Sheet */}
                <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-xs text-slate-300 space-y-3">
                  <h4 className="font-display font-bold text-sm text-cyan-300 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                    Pulo, Queda & Ações Solicitadas:
                  </h4>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-400">
                    <li>
                      <strong className="text-slate-200">Pulo Separado:</strong> Agora você tem <em>"Pulo (Ao Apertar / Impulso)"</em> para o frame exato da saída do chão e <em>"Pulo no Ar (Subida)"</em> enquanto Nox estiver ascendendo pelo ar.
                    </li>
                    <li>
                      <strong className="text-slate-200">Queda Separada:</strong> Use <em>"Queda no Ar (Descida)"</em> para o sprite enquanto Nox cai pelo ar e <em>"Aterrissagem (Ao Tocar o Chão)"</em> para o impacto e agachamento no solo.
                    </li>
                    <li>
                      <strong className="text-slate-200">Permanência Absoluta:</strong> Todos os frames enviados são salvos de forma assíncrona no <strong>IndexedDB</strong> local do seu navegador e nunca somem ao recarregar a página.
                    </li>
                    <li>
                      <strong className="text-slate-200">Animação da Lâmina (Slash FX):</strong> Na categoria <em>"Lâmina (Efeito do Corte / Slash FX)"</em> você pode enviar os frames da onda de corte / arco cortante da lâmina sem fundo (PNG). O jogo projeta e rotaciona o efeito diretamente na ponta da lâmina ao atacar!
                    </li>
                    <li>
                      <strong className="text-slate-200">Espada, Portas & Interações:</strong> Categorias dedicadas para golpe do personagem, entrar em portas, falar com NPCs e interagir com totens/altares.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Uploaded Frames Grid */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300">
                    Frames Cadastrados para [{activeCategory.label}]
                  </h4>
                  {frames.length > 0 && (
                    <span className="text-xs text-slate-400">
                      Passe o mouse sobre um frame para excluí-lo individualmente
                    </span>
                  )}
                </div>

                {frames.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400">
                    Nenhum frame adicionado ainda nesta categoria. Clique em <strong>"Adicionar Imagens PNG"</strong> acima para carregar suas artes sem fundo.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {frames.map((f, idx) => (
                      <div
                        key={f.id}
                        className="group relative flex flex-col items-center rounded-lg border border-slate-800 bg-slate-900/70 p-2 hover:border-slate-600 transition-colors"
                      >
                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded bg-black/50">
                          <img
                            src={f.dataUrl}
                            alt={`Frame ${idx + 1}`}
                            className="h-18 w-18 object-contain"
                          />
                        </div>
                        <span className="mt-1 font-mono text-[10px] text-slate-400">
                          Frame #{idx + 1}
                        </span>
                        <button
                          onClick={() => handleRemoveFrame(f.id)}
                          className="absolute -top-1.5 -right-1.5 rounded-full bg-red-600 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          title="Remover este frame"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-emerald-400" />
                <span>
                  Armazenamento ativo: <strong>IndexedDB Local</strong> (Suporta centenas de megabytes de imagens sem limites).
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg bg-cyan-600 px-6 py-2 font-semibold text-white hover:bg-cyan-500 transition-colors shadow-md shadow-cyan-950"
              >
                Concluir & Voltar ao Jogo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
