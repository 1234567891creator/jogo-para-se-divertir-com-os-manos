import React, { useState } from 'react';
import { PlayerState } from '../game/types';
import { X, BookOpen, Skull, Shield, Sparkles, Feather } from 'lucide-react';

interface LoreModalProps {
  player: PlayerState;
  discoveredTablets: Array<{ id: string; title: string; text: string; author: string }>;
  onClose: () => void;
}

export const LoreModal: React.FC<LoreModalProps> = ({
  player,
  discoveredTablets,
  onClose,
}) => {
  const [tab, setTab] = useState<'chronicles' | 'mask' | 'bestiary'>('chronicles');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-xl border border-slate-700/80 bg-[#0a0f18] text-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="font-display text-lg font-bold tracking-wider text-slate-100">
                Crônicas de Echoward & Ecos da Ressonância
              </h2>
              <p className="text-xs text-slate-400">
                Memórias antigas resgatadas das cinzas subterrâneas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800/80 bg-[#080c14] px-6">
          <button
            onClick={() => setTab('chronicles')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold tracking-wide transition-colors ${
              tab === 'chronicles'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Feather className="h-4 w-4" />
            Monólitos & O Silêncio
          </button>
          <button
            onClick={() => setTab('mask')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold tracking-wide transition-colors ${
              tab === 'mask'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            A Máscara de Nox ({player.maskCracks}/3 Trincas)
          </button>
          <button
            onClick={() => setTab('bestiary')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-semibold tracking-wide transition-colors ${
              tab === 'bestiary'
                ? 'border-red-400 text-red-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Skull className="h-4 w-4" />
            Bestiário das Cinzas
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {tab === 'chronicles' && (
            <div className="space-y-6">
              {/* Introduction Story */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-5">
                <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                  A Origem da Catástrofe
                </span>
                <h3 className="font-display text-xl font-bold text-slate-100 mt-1">
                  A Ressonância e O Silêncio
                </h3>
                <p className="text-sm leading-relaxed text-slate-300 mt-3">
                  Séculos atrás, a grande civilização de Echoward descobriu a Ressonância nas camadas mais profundas da terra — uma força primordial que respondia a memórias, música, emoções e pensamentos. Inicialmente tratada como energia abundante, a rede começou a manifestar distorções: objetos sussurravam, mortos repetiam suas últimas palavras e cidades inteiras ficaram aprisionadas em seus próprios sonhos.
                </p>
                <p className="text-sm leading-relaxed text-slate-300 mt-2">
                  Até que adveio <strong>O Silêncio</strong>: o colapso simultâneo de todas as frequências do reino. Os habitantes evaporaram, e as ruínas foram engolidas pelas cinzas.
                </p>
              </div>

              {/* Tablets List */}
              <div>
                <h4 className="font-display text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Monólitos Descobertos ({discoveredTablets.length})
                </h4>
                {discoveredTablets.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Nenhum monólito foi lido ainda. Aproxime-se dos pilares com glifos no reino e pressione [W] ou [↑].
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {discoveredTablets.map((tab) => (
                      <div
                        key={tab.id}
                        className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition-colors"
                      >
                        <h5 className="font-display text-sm font-bold text-amber-300">
                          {tab.title}
                        </h5>
                        <p className="text-xs text-slate-300 italic mt-2 leading-relaxed">
                          {tab.text}
                        </p>
                        <span className="block mt-3 text-[11px] text-slate-400">
                          — {tab.author}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'mask' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Character Portrait */}
              <div className="flex flex-col items-center rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <img
                  src="/src/assets/images/nox_protagonist_portrait_1790162359687.jpg"
                  alt="Nox, o Andarilho das Cinzas"
                  className="w-48 h-48 rounded-lg object-cover border border-slate-700 shadow-md"
                  referrerPolicy="no-referrer"
                />
                <span className="font-display text-base font-bold text-slate-100 mt-3">
                  Nox
                </span>
                <span className="text-xs text-cyan-400">O Andarilho Mascarado</span>
              </div>

              {/* Mask Crack Progression */}
              <div className="col-span-2 space-y-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
                    Evolução Anatômica
                  </span>
                  <h3 className="font-display text-xl font-bold text-slate-100">
                    As Três Trincas da Consciência
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-300 mt-1">
                    Nox despertou sem memória e sem voz em uma câmara subterrânea. A máscara de porcelana antiga não é um adorno, mas um selo que retém a Ressonância original.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className={`p-3 rounded-lg border ${player.maskCracks >= 1 ? 'border-cyan-500/60 bg-cyan-950/30 text-slate-200' : 'border-slate-800 bg-slate-900/30 text-slate-500'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-bold">1ª Trinca · O Despertar</span>
                      <span className="text-[11px]">{player.maskCracks >= 1 ? 'Manifestada' : 'Bloqueada'}</span>
                    </div>
                    <p className="text-xs mt-1 text-slate-400">
                      Rachadura sutil na bochecha direita. Emite tênues partículas de luz e permite a canalização de Pulso para regenerar tecidos.
                    </p>
                  </div>

                  <div className={`p-3 rounded-lg border ${player.maskCracks >= 2 ? 'border-cyan-500/60 bg-cyan-950/30 text-slate-200' : 'border-slate-800 bg-slate-900/30 text-slate-500'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-bold">2ª Trinca · A Memória das Pedras</span>
                      <span className="text-[11px]">{player.maskCracks >= 2 ? 'Manifestada' : 'Derrote o Guardião do Silêncio'}</span>
                    </div>
                    <p className="text-xs mt-1 text-slate-400">
                      Fissura profunda que cruza a fronte até o olho esquerdo. Aumenta o dano da Lâmina de Eco e concede o Mergulho Abissal para quebrar o solo.
                    </p>
                  </div>

                  <div className={`p-3 rounded-lg border ${player.maskCracks >= 3 ? 'border-cyan-500/60 bg-cyan-950/30 text-slate-200' : 'border-slate-800 bg-slate-900/30 text-slate-500'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-bold">3ª Trinca · O Eco Absoluto</span>
                      <span className="text-[11px]">{player.maskCracks >= 3 ? 'Manifestada' : 'Explore o Abismo de Ner'}</span>
                    </div>
                    <p className="text-xs mt-1 text-slate-400">
                      A quebra central do nariz e queixo. A máscara verte luz contínua; Nox não busca mais uma saída, pois compreende que é o nexo de todo o reino.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'bestiary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <h5 className="font-display text-sm font-bold text-slate-200">
                  Crawler de Cinzas
                </h5>
                <span className="text-[11px] text-slate-400">Habitat: Bosque do Eco & Minas</span>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Pequeno artrópode com carapaça de cinza compactada. Rasteja por plataformas e investe quando avista movimento. Pode ser usado para salto pogo.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <h5 className="font-display text-sm font-bold text-sky-300">
                  Espectro do Eco
                </h5>
                <span className="text-[11px] text-slate-400">Habitat: Bosque & Cidades Submersas</span>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Espírito volátil que absorveu frequências sonoras residuais. Flutua em ondas e dispara projéteis luminescentes de ressonância.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <h5 className="font-display text-sm font-bold text-amber-400">
                  Sentinela de Varron
                </h5>
                <span className="text-[11px] text-slate-400">Habitat: Minas de Varron & Catedral</span>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Autômato de cobre pesado que empunha um escudo colossal. Bloqueia ataques frontais; o jogador precisa usar o Passo Fantasma (Dash) para golpear suas costas.
                </p>
              </div>

              <div className="rounded-lg border border-amber-600/40 bg-amber-950/20 p-4">
                <h5 className="font-display text-sm font-bold text-amber-300">
                  O Guardião do Silêncio (Chefe)
                </h5>
                <span className="text-[11px] text-amber-400/80">Catedral Quebrada · Altar Central</span>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Colosso de basalto que guarda as relíquias do primeiro templo. Seus golpes de alabarda criam ondas de choque pelo chão e sinos que caem do teto. Na Fase 2, seu núcleo se expõe emitindo anéis de som!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-3 bg-[#080c14] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
