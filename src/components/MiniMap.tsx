import React, { useState, useMemo } from 'react';
import { PlayerState, GameRoom, RemotePlayer, SavePoint, ActiveEnemy } from '../game/types';
import { GAME_ROOMS } from '../game/worldMap';
import { REGIONS } from '../game/regionsData';
import {
  Compass,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Flame,
  BookOpen,
  Sparkles,
  User,
  Skull,
  DoorOpen,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MapPin,
  Layers,
} from 'lucide-react';

interface MiniMapProps {
  player: PlayerState;
  currentRoom: GameRoom;
  remotePlayers: RemotePlayer[];
  discoveredRooms: string[];
  activeSavePoint?: SavePoint | null;
  activeBoss?: ActiveEnemy | null;
  onOpenMap: () => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  player,
  currentRoom,
  remotePlayers,
  discoveredRooms,
  activeSavePoint,
  activeBoss,
  onOpenMap,
}) => {
  const [mode, setMode] = useState<'room' | 'nearby'>('room');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [hoveredPOI, setHoveredPOI] = useState<{
    title: string;
    type: string;
    subtitle?: string;
  } | null>(null);

  const region = REGIONS[currentRoom.regionId] || REGIONS.lumen_village;

  // Remote players in current room
  const localRemotes = useMemo(() => {
    return remotePlayers.filter((rp) => rp.currentRoomId === currentRoom.id);
  }, [remotePlayers, currentRoom.id]);

  // Uncollected items in current room
  const activeCollectibles = useMemo(() => {
    return currentRoom.collectibles.filter((c) => !c.collected);
  }, [currentRoom.collectibles]);

  // Analyze room transitions and discovered status
  const transitionData = useMemo(() => {
    return currentRoom.transitions.map((tr) => {
      const target = GAME_ROOMS[tr.targetRoomId];
      const isDiscovered = discoveredRooms.includes(tr.targetRoomId);
      const targetRegion = target ? REGIONS[target.regionId] : null;

      let directionLabel = 'Passagem';
      if (tr.side === 'left') directionLabel = 'Oeste';
      if (tr.side === 'right') directionLabel = 'Leste';
      if (tr.side === 'top') directionLabel = 'Norte';
      if (tr.side === 'bottom') directionLabel = 'Sul';

      return {
        ...tr,
        target,
        targetRegion,
        isDiscovered,
        directionLabel,
      };
    });
  }, [currentRoom.transitions, discoveredRooms]);

  // Player position clamped to room bounds for marker
  const playerX = Math.max(10, Math.min(currentRoom.width - 10, player.x + player.width / 2));
  const playerY = Math.max(10, Math.min(currentRoom.height - 10, player.y + player.height / 2));

  // Player facing chevron points
  const chevronSize = Math.max(14, Math.round(currentRoom.width * 0.015));
  const chevronFacingOffset = player.facing === 'right' ? chevronSize : -chevronSize;

  // Total POIs in current room
  const totalPOIs =
    currentRoom.totems.length +
    currentRoom.npcs.length +
    currentRoom.tablets.length +
    activeCollectibles.length;

  return (
    <div
      className={`pointer-events-auto flex flex-col rounded-xl border border-slate-800/90 bg-slate-950/90 shadow-2xl backdrop-blur-md transition-all duration-200 select-none ${
        isCollapsed
          ? 'w-56'
          : isExpanded
          ? 'w-80 md:w-96'
          : 'w-64 md:w-72'
      }`}
    >
      {/* Mini-Map Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/70 px-3 py-1.5">
        {/* Room Title & Region Pill */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: region.primaryColor }}
            title={region.name}
          />
          <h3 className="truncate font-display text-xs font-semibold text-slate-200" title={currentRoom.name}>
            {currentRoom.name}
          </h3>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {/* Mode Switcher: Sala vs Arredores */}
          {!isCollapsed && (
            <div className="flex items-center rounded-md bg-slate-900/90 p-0.5 border border-slate-800 text-[10px]">
              <button
                onClick={() => setMode('room')}
                className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                  mode === 'room'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ver layout e pontos de interesse da sala atual"
              >
                Sala
              </button>
              <button
                onClick={() => setMode('nearby')}
                className={`px-1.5 py-0.5 rounded font-medium transition-colors ${
                  mode === 'nearby'
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ver conexões e salas vizinhas descobertas"
              >
                Arredores
              </button>
            </div>
          )}

          {/* Size Expansion Toggle */}
          {!isCollapsed && (
            <button
              onClick={() => setIsExpanded((prev) => !prev)}
              className="flex h-6 w-6 items-center justify-center rounded border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors"
              title={isExpanded ? 'Reduzir mini-mapa' : 'Expandir mini-mapa'}
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </button>
          )}

          {/* Open Full Kingdom World Map */}
          <button
            onClick={onOpenMap}
            className="flex h-6 w-6 items-center justify-center rounded border border-cyan-800/80 bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900 hover:border-cyan-500 transition-colors"
            title="Abrir Mapa do Reino Completo (Tecla M)"
          >
            <Compass className="h-3.5 w-3.5 text-cyan-400" />
          </button>

          {/* Collapse/Expand widget */}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="flex h-6 w-6 items-center justify-center rounded border border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors"
            title={isCollapsed ? 'Expandir mini-mapa' : 'Recolher mini-mapa'}
          >
            {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Main Mini-Map Content Body */}
      {!isCollapsed && (
        <div className="relative flex flex-col p-2">
          {mode === 'room' ? (
            /* ========================================================== */
            /* MODE 1: REAL-TIME ROOM ARCHITECTURE & POI VIEW            */
            /* ========================================================== */
            <div className="relative">
              {/* Scaled Room SVG Display */}
              <div
                className={`relative w-full overflow-hidden rounded-lg border border-slate-800/90 bg-slate-950 shadow-inner flex items-center justify-center ${
                  isExpanded ? 'h-48' : 'h-36'
                }`}
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.4) 0%, rgba(2, 6, 23, 0.95) 100%)',
                }}
              >
                {/* Subtle Grid Backdrop */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)',
                    backgroundSize: '16px 16px',
                  }}
                />

                <svg
                  viewBox={`0 0 ${currentRoom.width} ${currentRoom.height}`}
                  preserveAspectRatio="xMidYMid meet"
                  className="h-full w-full select-none"
                >
                  {/* Outer Room Boundary Stroke */}
                  <rect
                    x="2"
                    y="2"
                    width={currentRoom.width - 4}
                    height={currentRoom.height - 4}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="6"
                    rx="8"
                  />

                  {/* Room Platforms */}
                  {currentRoom.platforms.map((plat, idx) => {
                    let fill = '#334155';
                    let stroke = '#475569';
                    let strokeDash = undefined;

                    if (plat.type === 'fragile') {
                      fill = '#7c2d12';
                      stroke = '#ea580c';
                      strokeDash = '12,8';
                    } else if (plat.type === 'resonance_barrier') {
                      fill = 'rgba(56, 189, 248, 0.3)';
                      stroke = '#38bdf8';
                    } else if (plat.type === 'spike') {
                      fill = '#7f1d1d';
                      stroke = '#ef4444';
                    } else if (plat.type === 'bouncy_mushroom') {
                      fill = '#581c87';
                      stroke = '#a855f7';
                    } else if (plat.type === 'water') {
                      fill = 'rgba(14, 116, 144, 0.4)';
                      stroke = '#0284c7';
                    }

                    return (
                      <rect
                        key={idx}
                        x={plat.x}
                        y={plat.y}
                        width={plat.width}
                        height={plat.height}
                        fill={fill}
                        stroke={stroke}
                        strokeWidth="3"
                        strokeDasharray={strokeDash}
                        rx="2"
                      />
                    );
                  })}

                  {/* Room Exits / Transitions */}
                  {transitionData.map((tr, idx) => {
                    const isDiscovered = tr.isDiscovered;
                    const strokeColor = isDiscovered ? '#38bdf8' : '#eab308';
                    const fillColor = isDiscovered
                      ? 'rgba(56, 189, 248, 0.35)'
                      : 'rgba(234, 179, 8, 0.25)';

                    return (
                      <g
                        key={`tr-${idx}`}
                        className="cursor-pointer transition-opacity hover:opacity-100"
                        onMouseEnter={() =>
                          setHoveredPOI({
                            title: `Saída ${tr.directionLabel}: ${
                              isDiscovered && tr.target ? tr.target.name : 'Área Inexplorada'
                            }`,
                            type: 'Saída',
                            subtitle: isDiscovered
                              ? `Destino descoberto · ${tr.targetRegion?.name || 'Reino'}`
                              : 'Ainda não explorado pelo andarilho',
                          })
                        }
                        onMouseLeave={() => setHoveredPOI(null)}
                      >
                        <rect
                          x={tr.rect.x}
                          y={tr.rect.y}
                          width={tr.rect.width}
                          height={tr.rect.height}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth="4"
                          strokeDasharray={isDiscovered ? undefined : '6,4'}
                        />
                      </g>
                    );
                  })}

                  {/* Resting Totems / Save Points */}
                  {currentRoom.totems.map((totem) => {
                    const isSaveCheckpoint =
                      activeSavePoint?.id === totem.id ||
                      (activeSavePoint?.roomId === currentRoom.id &&
                        activeSavePoint?.name === totem.name);

                    return (
                      <g
                        key={totem.id}
                        className="cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredPOI({
                            title: totem.name,
                            type: isSaveCheckpoint ? 'Ponto de Salve Ativo' : 'Totem de Repouso',
                            subtitle: isSaveCheckpoint
                              ? 'Último checkpoint salvo pelo andarilho'
                              : 'Pressione [W] ou [↑] no jogo para descansar e salvar progresso',
                          })
                        }
                        onMouseLeave={() => setHoveredPOI(null)}
                      >
                        {/* Aura glow ring */}
                        <circle
                          cx={totem.x}
                          cy={totem.y}
                          r={isSaveCheckpoint ? 24 : 16}
                          fill={isSaveCheckpoint ? 'rgba(245, 158, 11, 0.35)' : 'rgba(45, 212, 191, 0.25)'}
                          stroke={isSaveCheckpoint ? '#fbbf24' : '#2dd4bf'}
                          strokeWidth="3"
                        />
                        {/* Inner totem flame beacon */}
                        <circle
                          cx={totem.x}
                          cy={totem.y}
                          r="9"
                          fill={isSaveCheckpoint ? '#f59e0b' : '#14b8a6'}
                        />
                      </g>
                    );
                  })}

                  {/* NPCs */}
                  {currentRoom.npcs.map((npc) => (
                    <g
                      key={npc.id}
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredPOI({
                          title: npc.name,
                          type: 'Habitante (NPC)',
                          subtitle: npc.title,
                        })
                      }
                      onMouseLeave={() => setHoveredPOI(null)}
                    >
                      <circle
                        cx={npc.x}
                        cy={npc.y}
                        r="14"
                        fill="rgba(16, 185, 129, 0.3)"
                        stroke="#10b981"
                        strokeWidth="3"
                      />
                      <circle cx={npc.x} cy={npc.y} r="7" fill="#34d399" />
                    </g>
                  ))}

                  {/* Lore Tablets */}
                  {currentRoom.tablets.map((tab) => (
                    <g
                      key={tab.id}
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredPOI({
                          title: tab.title,
                          type: 'Monólito de Lore',
                          subtitle: `Inscrição antiga de ${tab.author}`,
                        })
                      }
                      onMouseLeave={() => setHoveredPOI(null)}
                    >
                      <rect
                        x={tab.x - 10}
                        y={tab.y - 12}
                        width="20"
                        height="24"
                        fill="rgba(245, 158, 11, 0.3)"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        rx="3"
                      />
                    </g>
                  ))}

                  {/* Collectibles */}
                  {activeCollectibles.map((col) => (
                    <g
                      key={col.id}
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredPOI({
                          title: col.label,
                          type: col.type === 'ability' ? 'Habilidade Antiga' : 'Fragmento de Eco',
                          subtitle: 'Aproxime-se para coletar',
                        })
                      }
                      onMouseLeave={() => setHoveredPOI(null)}
                    >
                      <polygon
                        points={`${col.x},${col.y - 12} ${col.x + 10},${col.y} ${col.x},${col.y + 12} ${col.x - 10},${col.y}`}
                        fill="rgba(168, 85, 247, 0.5)"
                        stroke="#c084fc"
                        strokeWidth="3"
                      />
                    </g>
                  ))}

                  {/* Active Boss or Enemy Spawns */}
                  {currentRoom.isBossRoom && (
                    <g
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredPOI({
                          title: activeBoss?.name || 'Ameaça de Chefe',
                          type: 'Arena de Chefe',
                          subtitle: 'Inimigo formidável do Reino',
                        })
                      }
                      onMouseLeave={() => setHoveredPOI(null)}
                    >
                      <circle
                        cx={currentRoom.width / 2}
                        cy={currentRoom.height / 2}
                        r="24"
                        fill="rgba(239, 68, 68, 0.25)"
                        stroke="#ef4444"
                        strokeWidth="3"
                        strokeDasharray="6,4"
                      />
                    </g>
                  )}

                  {/* Remote Companions in Room */}
                  {localRemotes.map((rp) => (
                    <g
                      key={rp.id}
                      className="cursor-pointer"
                      onMouseEnter={() =>
                        setHoveredPOI({
                          title: rp.name,
                          type: 'Companheiro Co-op',
                          subtitle: `HP: ${rp.hp}/${rp.maxHp} · Aperte [T] para reunir`,
                        })
                      }
                      onMouseLeave={() => setHoveredPOI(null)}
                    >
                      <circle
                        cx={rp.x}
                        cy={rp.y}
                        r="18"
                        fill="rgba(16, 185, 129, 0.4)"
                        stroke="#10b981"
                        strokeWidth="3"
                      />
                      <circle cx={rp.x} cy={rp.y} r="8" fill="#34d399" />
                    </g>
                  ))}

                  {/* Local Player Live Marker */}
                  <g className="transition-all duration-75">
                    {/* Glowing Radar Pulse */}
                    <circle
                      cx={playerX}
                      cy={playerY}
                      r="26"
                      fill="rgba(6, 182, 212, 0.3)"
                      stroke="#22d3ee"
                      strokeWidth="3"
                    />
                    {/* Inner Core */}
                    <circle
                      cx={playerX}
                      cy={playerY}
                      r="12"
                      fill="#06b6d4"
                      stroke="#ffffff"
                      strokeWidth="3"
                    />
                    {/* Directional Facing Chevron */}
                    <polygon
                      points={`${playerX + chevronFacingOffset},${playerY} ${playerX},${playerY - 8} ${playerX},${playerY + 8}`}
                      fill="#ffffff"
                    />
                  </g>
                </svg>

                {/* Compass Rose Mini Indicator */}
                <div className="pointer-events-none absolute bottom-1 right-1.5 flex items-center gap-1 text-[9px] font-mono font-bold text-slate-500">
                  <span>W</span>
                  <span className="text-cyan-400">✦</span>
                  <span>E</span>
                </div>
              </div>

              {/* POI Legend Strip */}
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1" title="Você (Nox)">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                    <span className="text-slate-300">Você</span>
                  </div>

                  {currentRoom.totems.length > 0 && (
                    <div className="flex items-center gap-1" title="Totem de Repouso e Salve">
                      <Flame className="h-3 w-3 text-amber-400" />
                      <span>Totem</span>
                    </div>
                  )}

                  {currentRoom.npcs.length > 0 && (
                    <div className="flex items-center gap-1" title="NPC / Habitante">
                      <User className="h-3 w-3 text-emerald-400" />
                      <span>NPC</span>
                    </div>
                  )}

                  {activeCollectibles.length > 0 && (
                    <div className="flex items-center gap-1" title="Item / Fragmento">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      <span>Item</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 text-slate-500 font-mono">
                  <span>{transitionData.length} Saídas</span>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================== */
            /* MODE 2: NEARBY ROOMS & AREA DISCOVERY NETWORK              */
            /* ========================================================== */
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>Rotas e Conexões Imediatas</span>
                <span className="text-cyan-400 font-mono text-[10px]">
                  {transitionData.filter((t) => t.isDiscovered).length} / {transitionData.length} Descobertas
                </span>
              </div>

              {/* List of Connected Adjacent Rooms */}
              <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                {transitionData.map((tr, idx) => {
                  const target = tr.target;
                  const isDiscovered = tr.isDiscovered;
                  const targetRegion = tr.targetRegion;

                  return (
                    <div
                      key={idx}
                      className={`flex items-center justify-between rounded-lg border p-2 transition-all ${
                        isDiscovered
                          ? 'border-slate-800 bg-slate-900/80 hover:border-cyan-500/50'
                          : 'border-slate-800/60 bg-slate-950/60 border-dashed opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border ${
                            isDiscovered
                              ? 'border-cyan-500/40 bg-cyan-950/60 text-cyan-300'
                              : 'border-slate-800 bg-slate-900 text-slate-600'
                          }`}
                        >
                          {tr.side === 'left' && <ArrowLeft className="h-3 w-3" />}
                          {tr.side === 'right' && <ArrowRight className="h-3 w-3" />}
                          {tr.side === 'top' && <ArrowUp className="h-3 w-3" />}
                          {tr.side === 'bottom' && <ArrowDown className="h-3 w-3" />}
                        </div>

                        <div className="min-w-0 flex flex-col">
                          <span
                            className={`truncate text-xs font-semibold ${
                              isDiscovered ? 'text-slate-100' : 'text-slate-400 italic'
                            }`}
                          >
                            {isDiscovered && target ? target.name : '??? Área Não Explorada'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {tr.directionLabel} · {isDiscovered && targetRegion ? targetRegion.name : 'Caminho Oculto'}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isDiscovered ? (
                          <span className="rounded bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 text-[9px] font-medium text-cyan-300">
                            Conhecido
                          </span>
                        ) : (
                          <span className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-amber-400/80">
                            Inexplorado
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hovered POI Info Banner */}
          {hoveredPOI && (
            <div className="mt-1.5 flex flex-col rounded-md border border-cyan-500/40 bg-slate-900/95 px-2.5 py-1.5 shadow-md">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-200">{hoveredPOI.title}</span>
                <span className="font-mono text-[10px] text-cyan-400">{hoveredPOI.type}</span>
              </div>
              {hoveredPOI.subtitle && (
                <span className="text-[10px] text-slate-400">{hoveredPOI.subtitle}</span>
              )}
            </div>
          )}

          {/* Coordinates & Active Save Point Footer */}
          <div className="mt-2 flex items-center justify-between border-t border-slate-800/80 pt-1.5 text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-cyan-400" />
              <span className="tabular-nums">
                X: {Math.round(player.x)} · Y: {Math.round(player.y)}
              </span>
            </div>

            {activeSavePoint && (
              <div
                className="flex items-center gap-1 text-amber-300 font-medium truncate max-w-[140px]"
                title={`Checkpoint Ativo: ${activeSavePoint.name}`}
              >
                <span>✦</span>
                <span className="truncate">{activeSavePoint.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
