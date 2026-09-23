import React, { useState } from 'react';
import { REGIONS } from '../game/regionsData';
import { RegionId, GameRoom, RemotePlayer } from '../game/types';
import { GAME_ROOMS } from '../game/worldMap';
import {
  X,
  Compass,
  MapPin,
  Shield,
  Flame,
  Eye,
  CheckCircle2,
  Lock,
  Anchor,
  Skull,
  ShoppingBag,
  User,
  AlertCircle,
  DoorOpen,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';

interface WorldMapModalProps {
  currentRoom: GameRoom;
  discoveredRooms: string[];
  remotePlayers: RemotePlayer[];
  onClose: () => void;
  onFastTravel?: (roomId: string) => void;
}

interface MapRegionPoint {
  id: RegionId;
  name: string;
  number: number;
  x: number; // percentage
  y: number; // percentage
  color: string;
  accentGlow: string;
  defaultRoomId: string;
  bossName: string;
  totemCount: number;
  unlockedByDefault?: boolean;
}

const MAP_REGIONS: MapRegionPoint[] = [
  {
    id: 'lumen_village',
    name: 'VILA DE LUMEN',
    number: 1,
    x: 23,
    y: 18,
    color: '#EDE8E1',
    accentGlow: '#CBD5E1',
    defaultRoomId: 'room_lumen_haven',
    bossName: 'Guardião Espectral',
    totemCount: 2,
    unlockedByDefault: true,
  },
  {
    id: 'echo_forest',
    name: 'BOSQUE DO ECO',
    number: 2,
    x: 41,
    y: 16,
    color: '#2DD4BF',
    accentGlow: '#059669',
    defaultRoomId: 'room_echo_woods',
    bossName: 'Esporo Ancestral',
    totemCount: 3,
    unlockedByDefault: true,
  },
  {
    id: 'varron_mines',
    name: 'MINAS DE VARRON',
    number: 3,
    x: 62,
    y: 15,
    color: '#FB923C',
    accentGlow: '#EA580C',
    defaultRoomId: 'room_varron_shaft',
    bossName: 'Golias da Forja',
    totemCount: 2,
  },
  {
    id: 'submerged_city',
    name: 'CIDADE SUBMERSA',
    number: 4,
    x: 84,
    y: 17,
    color: '#38BDF8',
    accentGlow: '#0284C7',
    defaultRoomId: 'room_submerged_ruins',
    bossName: 'Vigias das Marés',
    totemCount: 3,
  },
  {
    id: 'dead_gardens',
    name: 'JARDINS MORTOS',
    number: 5,
    x: 27,
    y: 44,
    color: '#D946EF',
    accentGlow: '#A21CAF',
    defaultRoomId: 'room_dead_gardens_entry',
    bossName: 'Rainha das Pétalas',
    totemCount: 2,
  },
  {
    id: 'broken_cathedral',
    name: 'CATEDRAL QUEBRADA',
    number: 6,
    x: 50,
    y: 43,
    color: '#FACC15',
    accentGlow: '#CA8A04',
    defaultRoomId: 'room_broken_cathedral_nave',
    bossName: 'Guardião do Silêncio',
    totemCount: 4,
  },
  {
    id: 'tower_of_voices',
    name: 'TORRE DAS VOZES',
    number: 7,
    x: 69,
    y: 45,
    color: '#60A5FA',
    accentGlow: '#2563EB',
    defaultRoomId: 'room_tower_of_voices',
    bossName: 'Coro Fragmentado',
    totemCount: 3,
  },
  {
    id: 'ash_fields',
    name: 'CAMPOS DE CINZA',
    number: 8,
    x: 88,
    y: 48,
    color: '#94A3B8',
    accentGlow: '#64748B',
    defaultRoomId: 'room_ash_fields',
    bossName: 'Sentinela Esquecido',
    totemCount: 2,
  },
  {
    id: 'drowned_palace',
    name: 'PALÁCIO AFOGADO',
    number: 9,
    x: 24,
    y: 72,
    color: '#22D3EE',
    accentGlow: '#0891B2',
    defaultRoomId: 'room_drowned_palace',
    bossName: 'Leviatã das Sombras',
    totemCount: 3,
  },
  {
    id: 'ner_abyss',
    name: 'ABISMO DE NER',
    number: 10,
    x: 46,
    y: 82,
    color: '#38BDF8',
    accentGlow: '#1E3A8A',
    defaultRoomId: 'room_ner_abyss',
    bossName: 'Eco do Vazio',
    totemCount: 2,
  },
  {
    id: 'ancient_nursery',
    name: 'BERÇÁRIO ANTIGO',
    number: 11,
    x: 68,
    y: 78,
    color: '#A855F7',
    accentGlow: '#7E22CE',
    defaultRoomId: 'room_ancient_nursery',
    bossName: 'Matriarca das Máscaras',
    totemCount: 3,
  },
  {
    id: 'echoward_core',
    name: 'CORAÇÃO DE ECHOWARD',
    number: 12,
    x: 89,
    y: 74,
    color: '#F43F5E',
    accentGlow: '#BE123C',
    defaultRoomId: 'room_echoward_core',
    bossName: 'Coração Pulsante de Echoward',
    totemCount: 1,
  },
];

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  currentRoom,
  discoveredRooms,
  remotePlayers,
  onClose,
  onFastTravel,
}) => {
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId>(currentRoom.regionId);
  const selectedPoint = MAP_REGIONS.find((p) => p.id === selectedRegionId) || MAP_REGIONS[0];
  const selectedRegionData = REGIONS[selectedRegionId] || REGIONS.lumen_village;

  const currentPoint = MAP_REGIONS.find((p) => p.id === currentRoom.regionId) || MAP_REGIONS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2 md:p-4 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative flex h-[95vh] w-full max-w-7xl flex-col rounded-2xl border border-slate-700/80 bg-[#070a12] text-slate-200 shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#05070d] px-6 py-3.5">
          <div className="flex items-center gap-3">
            <Compass className="h-5 w-5 text-cyan-400 animate-spin-slow" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg font-extrabold tracking-widest text-slate-100 uppercase">
                  Nox: O Eco Que Caminha
                </span>
                <span className="rounded bg-cyan-950 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-800">
                  MAPA DO MUNDO
                </span>
              </div>
              <p className="text-xs text-slate-400 italic">
                "Entre ruínas e lembranças, o caminho de Nox se revela."
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-400">
              Regiões Exploradas: <strong className="text-cyan-300">12 / 12</strong>
            </span>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Master Map Body */}
        <div className="relative flex-1 overflow-hidden bg-[#04060b]">
          {/* Subtle Cartographic Background Texture */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />

          {/* Master Interconnecting Path Lines (Main & Alternative) */}
          <svg className="absolute inset-0 h-full w-full pointer-events-none z-10">
            <defs>
              <linearGradient id="mainPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#72E7FE" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="abyssPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Main Solid Paths */}
            {/* 1. Vila de Lumen -> 2. Bosque do Eco */}
            <path d="M 23% 18% Q 32% 14% 41% 16%" stroke="url(#mainPathGrad)" strokeWidth="2.5" fill="none" />
            {/* 2. Bosque do Eco -> 3. Minas de Varron */}
            <path d="M 41% 16% Q 51% 12% 62% 15%" stroke="url(#mainPathGrad)" strokeWidth="2.5" fill="none" />
            {/* 3. Minas de Varron -> 4. Cidade Submersa */}
            <path d="M 62% 15% Q 73% 13% 84% 17%" stroke="url(#mainPathGrad)" strokeWidth="2.5" fill="none" />

            {/* 1. Vila de Lumen -> 5. Jardins Mortos */}
            <path d="M 23% 18% Q 21% 31% 27% 44%" stroke="url(#mainPathGrad)" strokeWidth="2.5" fill="none" />
            {/* 5. Jardins Mortos -> 6. Catedral Quebrada */}
            <path d="M 27% 44% Q 38% 46% 50% 43%" stroke="url(#mainPathGrad)" strokeWidth="2.5" fill="none" />
            {/* 2. Bosque do Eco -> 6. Catedral Quebrada */}
            <path d="M 41% 16% Q 44% 30% 50% 43%" stroke="url(#mainPathGrad)" strokeWidth="2.5" fill="none" />
            {/* 6. Catedral Quebrada -> 7. Torre das Vozes */}
            <path d="M 50% 43% Q 60% 41% 69% 45%" stroke="url(#mainPathGrad)" strokeWidth="2.5" fill="none" />
            {/* 7. Torre das Vozes -> 8. Campos de Cinza */}
            <path d="M 69% 45% Q 79% 44% 88% 48%" stroke="url(#mainPathGrad)" strokeWidth="2.5" fill="none" />
            {/* 4. Cidade Submersa -> 8. Campos de Cinza */}
            <path d="M 84% 17% Q 89% 32% 88% 48%" stroke="url(#mainPathGrad)" strokeWidth="2.5" fill="none" />

            {/* 5. Jardins Mortos -> 9. Palácio Afogado */}
            <path d="M 27% 44% Q 22% 58% 24% 72%" stroke="url(#mainPathGrad)" strokeWidth="2.5" fill="none" />
            {/* 9. Palácio Afogado -> 10. Abismo de Ner */}
            <path d="M 24% 72% Q 35% 80% 46% 82%" stroke="url(#mainPathGrad)" strokeWidth="2.5" fill="none" />
            {/* 6. Catedral Quebrada -> 11. Berçário Antigo */}
            <path d="M 50% 43% Q 58% 61% 68% 78%" stroke="url(#mainPathGrad)" strokeWidth="2.5" fill="none" />
            {/* 10. Abismo de Ner -> 11. Berçário Antigo */}
            <path d="M 46% 82% Q 57% 83% 68% 78%" stroke="url(#mainPathGrad)" strokeWidth="2.5" fill="none" />
            {/* 11. Berçário Antigo -> 12. Coração de Echoward */}
            <path d="M 68% 78% Q 79% 79% 89% 74%" stroke="url(#abyssPathGrad)" strokeWidth="3" fill="none" />
            {/* 8. Campos de Cinza -> 12. Coração de Echoward */}
            <path d="M 88% 48% Q 92% 61% 89% 74%" stroke="url(#abyssPathGrad)" strokeWidth="3" fill="none" />

            {/* Alternative Dashed Secret Paths */}
            {/* Minas de Varron -> Catedral Quebrada */}
            <path d="M 62% 15% Q 59% 29% 50% 43%" stroke="#64748B" strokeWidth="1.8" strokeDasharray="5 5" fill="none" />
            {/* Palácio Afogado -> Berçário Antigo */}
            <path d="M 24% 72% Q 46% 68% 68% 78%" stroke="#64748B" strokeWidth="1.8" strokeDasharray="5 5" fill="none" />
          </svg>

          {/* Left Panel: Official Legend (LEGENDA DO MAPA) */}
          <div className="absolute top-4 left-4 z-30 w-64 rounded-xl border border-slate-800 bg-[#070c16]/90 p-4 shadow-2xl backdrop-blur-md">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-cyan-300 border-b border-slate-800 pb-2 mb-3">
              Legenda do Mapa
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 text-slate-200">
                {/* Nox Mask Icon */}
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 border border-cyan-400/80">
                  <div className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
                <span className="font-semibold text-cyan-200">Nox (jogador)</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Anchor className="h-4 w-4 text-emerald-400" />
                <span>Âncora (ponto de descanso)</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Skull className="h-4 w-4 text-red-400" />
                <span>Chefe</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <ShoppingBag className="h-4 w-4 text-amber-400" />
                <span>Comerciante</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <User className="h-4 w-4 text-sky-400" />
                <span>NPC</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <span>Missão</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <DoorOpen className="h-4 w-4 text-indigo-400" />
                <span>Entrada de área</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <ArrowUpDown className="h-4 w-4 text-slate-400" />
                <span>Elevador</span>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span>Passagem secreta</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-6 bg-cyan-400" />
                  <span>Caminho principal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-6 border-b border-dashed border-slate-400" />
                  <span>Caminho alternativo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Left: Compass Rose & Metric Scale */}
          <div className="absolute bottom-4 left-4 z-30 flex flex-col gap-2 rounded-xl border border-slate-800 bg-[#070c16]/90 p-3.5 shadow-2xl backdrop-blur-md">
            {/* Ornate Compass Rose */}
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-slate-700 opacity-60" />
                <div className="absolute h-10 w-10 rotate-45 border border-cyan-500/30" />
                <span className="absolute top-0 text-[10px] font-bold text-cyan-300 font-mono">N</span>
                <span className="absolute bottom-0 text-[10px] font-bold text-slate-400 font-mono">S</span>
                <span className="absolute right-0 text-[10px] font-bold text-slate-400 font-mono">L</span>
                <span className="absolute left-0 text-[10px] font-bold text-slate-400 font-mono">O</span>
                <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-md shadow-cyan-400" />
              </div>

              {/* Metric Scale Bar: 0 1 2 3 4 5 km */}
              <div className="flex flex-col">
                <div className="flex justify-between text-[9px] font-mono text-slate-400 w-32">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5 km</span>
                </div>
                <div className="relative h-2 w-32 border border-slate-600 bg-slate-900 rounded-xs flex">
                  <div className="h-full w-1/5 bg-slate-300" />
                  <div className="h-full w-1/5 bg-slate-800" />
                  <div className="h-full w-1/5 bg-slate-300" />
                  <div className="h-full w-1/5 bg-slate-800" />
                  <div className="h-full w-1/5 bg-slate-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right: Sacred Quote Plate */}
          <div className="absolute bottom-4 right-4 z-30 rounded-xl border border-slate-700/80 bg-[#070c16]/90 px-5 py-3 shadow-2xl backdrop-blur-md text-right">
            <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-0.5">
              Escritura dos Ecos
            </div>
            <p className="font-display text-xs font-semibold tracking-wider text-slate-200">
              "O QUE ESTÁ PERDIDO TAMBÉM FAZ PARTE DO CAMINHO."
            </p>
          </div>

          {/* 12 Isometric Island Region Nodes */}
          <div className="relative h-full w-full z-20">
            {MAP_REGIONS.map((reg) => {
              const isCurrent = currentRoom.regionId === reg.id;
              const isSelected = selectedRegionId === reg.id;

              return (
                <div
                  key={reg.id}
                  style={{ left: `${reg.x}%`, top: `${reg.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                >
                  <button
                    onClick={() => setSelectedRegionId(reg.id)}
                    className={`group relative flex flex-col items-center rounded-xl p-3 transition-all duration-300 focus:outline-none ${
                      isSelected
                        ? 'scale-115 z-40'
                        : 'hover:scale-105 z-20'
                    }`}
                  >
                    {/* Isometric Castle / Mountain Stylized Island Silhouette */}
                    <div
                      className={`relative flex h-14 w-28 flex-col items-center justify-center rounded-lg border backdrop-blur-md transition-all shadow-xl ${
                        isSelected
                          ? 'border-cyan-400 bg-slate-900/95 shadow-cyan-900/60'
                          : isCurrent
                          ? 'border-emerald-400 bg-slate-900/90 shadow-emerald-950/60'
                          : 'border-slate-800 bg-[#080d18]/85 hover:border-slate-600'
                      }`}
                      style={{
                        boxShadow: isSelected
                          ? `0 0 24px ${reg.accentGlow}60`
                          : undefined,
                      }}
                    >
                      {/* Region Number & Color Gem */}
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: reg.color }}
                        />
                        <span className="font-mono text-[10px] font-bold text-slate-300">
                          {reg.number}.
                        </span>
                      </div>

                      {/* Region Name */}
                      <span className="font-display text-[11px] font-bold tracking-wider text-slate-100 text-center px-1 truncate max-w-full">
                        {reg.name}
                      </span>

                      {/* Sub-status badges */}
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-400 font-mono">
                        <span className="flex items-center gap-0.5">
                          <Anchor className="h-2.5 w-2.5 text-emerald-400" />
                          {reg.totemCount}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Skull className="h-2.5 w-2.5 text-red-400" />
                          1
                        </span>
                      </div>
                    </div>

                    {/* Nox Current Location Pointer */}
                    {isCurrent && (
                      <div className="absolute -top-7 flex flex-col items-center animate-bounce">
                        <div className="flex items-center gap-1 rounded-full bg-cyan-950 px-2.5 py-0.5 border border-cyan-400 text-[10px] font-bold text-cyan-200 shadow-lg shadow-cyan-900/50">
                          <div className="h-2 w-2 rounded-full bg-cyan-400" />
                          Nox Aqui
                        </div>
                        <div className="h-2 w-2 rotate-45 bg-cyan-400 -mt-1" />
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Selected Region Drawer / Detail Popover */}
          {selectedPoint && (
            <div className="absolute top-4 right-4 z-30 w-80 rounded-xl border border-slate-700/80 bg-[#090e18]/95 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      #{selectedPoint.number}
                    </span>
                    <h3 className="font-display text-base font-bold text-slate-100">
                      {selectedPoint.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedRegionData.subtitle}
                  </p>
                </div>
                <div
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: selectedPoint.color }}
                />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {selectedRegionData.description}
              </p>

              <div className="space-y-2 rounded-lg bg-slate-900/70 p-3 text-xs border border-slate-800/80 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Guardião / Chefe:</span>
                  <span className="font-semibold text-red-300 font-display">
                    {selectedPoint.bossName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Âncoras de Descanso:</span>
                  <span className="font-mono text-emerald-300">
                    {selectedPoint.totemCount} Totens
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Atmosfera & Partículas:</span>
                  <span className="text-amber-300 capitalize">{selectedRegionData.bgParticles}</span>
                </div>
              </div>

              {/* Fast Travel / Explore button */}
              {onFastTravel && GAME_ROOMS[selectedPoint.defaultRoomId] && (
                <button
                  onClick={() => {
                    onFastTravel(selectedPoint.defaultRoomId);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition-colors shadow-md shadow-cyan-900/40"
                >
                  <MapPin className="h-4 w-4" />
                  Viajar para {selectedPoint.name}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
