/**
 * Echoward: Reino das Cinzas - Main Application
 */

import React, { useState, useEffect } from 'react';
import { PlayerState, GameRoom, ActiveEnemy, NPC, LoreTablet, RemotePlayer } from './game/types';
import { GAME_ROOMS } from './game/worldMap';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { WorldMapModal } from './components/WorldMapModal';
import { LoreModal } from './components/LoreModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { SpriteManagerModal } from './components/SpriteManagerModal';
import { DialogueBox } from './components/DialogueBox';
import { ControlsGuide } from './components/ControlsGuide';
import { multiplayerClient } from './game/multiplayerClient';
import { soundEngine } from './game/audio';
import { Sparkles, HelpCircle } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<'TITLE' | 'PLAYING'>('TITLE');

  // Player State for HUD
  const [player, setPlayer] = useState<PlayerState>({
    x: 200,
    y: 520,
    vx: 0,
    vy: 0,
    width: 28,
    height: 44,
    facing: 'right',
    isGrounded: true,
    isWallSliding: false,
    wallDirection: 0,
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    dashDirection: 1,
    isAttacking: false,
    attackTimer: 0,
    attackDirection: 'side',
    attackCooldown: 0,
    isGroundPounding: false,
    isHealing: false,
    healHoldTimer: 0,
    isMemoryVisionActive: false,
    invulnerableTimer: 0,
    hp: 5,
    maxHp: 5,
    pulse: 100,
    maxPulse: 100,
    maskCracks: 0,
    abilities: {
      dash: true,
      doubleJump: true,
      wallClimb: true,
      groundPound: true,
      rewind: true,
      memoryVision: true,
    },
    shardsCount: 0,
    geoOrbs: 0,
    landingTimer: 0,
    isDying: false,
    deathTimer: 0,
    currentAnimation: 'idle',
    lanternBrightness: 'bright',
    trailHistory: [],
  });

  // Cavern Lantern Illumination Level: normal, bright, max
  const [lanternBrightness, setLanternBrightness] = useState<'normal' | 'bright' | 'max'>('bright');

  // Current Room
  const [currentRoom, setCurrentRoom] = useState<GameRoom>(GAME_ROOMS.room_lumen_haven);
  const [discoveredRooms, setDiscoveredRooms] = useState<string[]>(['room_lumen_haven']);
  const [discoveredTablets, setDiscoveredTablets] = useState<LoreTablet[]>([]);
  const [activeBoss, setActiveBoss] = useState<ActiveEnemy | null>(null);

  // Modals & UI States
  const [showMap, setShowMap] = useState(false);
  const [showLore, setShowLore] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showSpriteManager, setShowSpriteManager] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [abilityToast, setAbilityToast] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Multiplayer Room State
  const [roomCode, setRoomCode] = useState('LUMEN');
  const [playerName, setPlayerName] = useState('Nox');
  const [colorIndex, setColorIndex] = useState(0);
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Connect to default multiplayer room on start
  useEffect(() => {
    multiplayerClient.connect(roomCode, playerName, colorIndex);

    const unsub = multiplayerClient.on((event, data) => {
      if (event === 'connected' || event === 'room_joined') {
        setIsConnected(true);
      } else if (event === 'disconnected') {
        setIsConnected(false);
      }
    });

    const interval = setInterval(() => {
      setRemotePlayers(multiplayerClient.getRemotePlayersArray());
    }, 100);

    return () => {
      unsub();
      clearInterval(interval);
      multiplayerClient.disconnect();
    };
  }, []);

  // Track discovered rooms
  useEffect(() => {
    if (!discoveredRooms.includes(currentRoom.id)) {
      setDiscoveredRooms((prev) => [...prev, currentRoom.id]);
    }
  }, [currentRoom.id, discoveredRooms]);

  // Global hotkeys for modals
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.code === 'KeyM') {
        setShowMap((v) => !v);
      } else if (e.code === 'KeyL') {
        setShowLore((v) => !v);
      } else if (e.code === 'KeyP') {
        setShowMultiplayer((v) => !v);
      } else if (e.code === 'KeyI') {
        setShowSpriteManager((v) => !v);
      } else if (e.code === 'Slash' || e.code === 'KeyH') {
        setShowControls((v) => !v);
      } else if (e.code === 'Escape') {
        setShowMap(false);
        setShowLore(false);
        setShowMultiplayer(false);
        setShowSpriteManager(false);
        setShowControls(false);
        setActiveNPC(null);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState]);

  const handleToggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  const handleCycleLantern = () => {
    setLanternBrightness((curr) => {
      if (curr === 'normal') return 'bright';
      if (curr === 'bright') return 'max';
      return 'normal';
    });
  };

  const handleToggleAbility = (abilityName: keyof PlayerState['abilities']) => {
    setPlayer((prev) => {
      const nextVal = !prev.abilities[abilityName];
      const abilityLabels: Record<string, string> = {
        dash: 'Passo Fantasma',
        doubleJump: 'Salto de Ressonância',
        wallClimb: 'Garra de Cinza',
        groundPound: 'Mergulho Abissal',
        rewind: 'Eco Reverso',
        memoryVision: 'Visão de Memória',
      };
      setAbilityToast(
        `${abilityLabels[abilityName] || abilityName}: ${nextVal ? 'ATIVADO' : 'DESATIVADO'}`
      );
      setTimeout(() => setAbilityToast(null), 2500);
      return {
        ...prev,
        abilities: {
          ...prev.abilities,
          [abilityName]: nextVal,
        },
      };
    });
  };

  const handleDiscoverAbility = (abilityName: string) => {
    setAbilityToast(`Habilidade Revelada: ${abilityName}`);
    setTimeout(() => {
      setAbilityToast(null);
    }, 4500);
  };

  const handleReadTablet = (tablet: LoreTablet) => {
    if (!discoveredTablets.some((t) => t.id === tablet.id)) {
      setDiscoveredTablets((prev) => [...prev, tablet]);
    }
    setShowLore(true);
  };

  const handleJoinRoom = (newRoomCode: string) => {
    setRoomCode(newRoomCode);
    multiplayerClient.connect(newRoomCode, playerName, colorIndex);
  };

  const handleUpdatePlayer = (newName: string, newColor: number) => {
    setPlayerName(newName);
    setColorIndex(newColor);
    multiplayerClient.connect(roomCode, newName, newColor);
  };

  const handleSendEmote = (emoteText: string) => {
    multiplayerClient.sendEmote(emoteText);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#06080d] font-sans antialiased">
      {gameState === 'TITLE' ? (
        <TitleScreen
          onStartGame={() => {
            soundEngine.startAmbientMusic(currentRoom.regionId);
            setGameState('PLAYING');
          }}
          onOpenMap={() => {
            setShowMap(true);
            setGameState('PLAYING');
          }}
          onOpenMultiplayer={() => {
            setShowMultiplayer(true);
            setGameState('PLAYING');
          }}
          onOpenLore={() => {
            setShowLore(true);
            setGameState('PLAYING');
          }}
        />
      ) : (
        <>
          {/* Main 2D Canvas */}
          <GameCanvas
            initialPlayer={player}
            onPlayerHUDUpdate={(updated) => setPlayer(updated)}
            currentRoom={currentRoom}
            setCurrentRoom={setCurrentRoom}
            onInteractNPC={(npc) => setActiveNPC(npc)}
            onReadTablet={handleReadTablet}
            onDiscoverAbility={handleDiscoverAbility}
            activeBoss={activeBoss}
            setActiveBoss={setActiveBoss}
            remotePlayers={remotePlayers}
            lanternBrightness={lanternBrightness}
          />

          {/* Game HUD */}
          <HUD
            player={player}
            currentRoom={currentRoom}
            activeBoss={activeBoss}
            remotePlayers={remotePlayers}
            onOpenMap={() => setShowMap(true)}
            onOpenLore={() => setShowLore(true)}
            onOpenMultiplayer={() => setShowMultiplayer(true)}
            onOpenSpriteManager={() => setShowSpriteManager(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onSendQuickEmote={handleSendEmote}
            lanternBrightness={lanternBrightness}
            onCycleLantern={handleCycleLantern}
            onToggleAbility={handleToggleAbility}
          />

          {/* Ability Discovery Banner */}
          {abilityToast && (
            <div className="pointer-events-none fixed top-20 inset-x-0 z-50 flex justify-center">
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/80 bg-slate-950/95 px-6 py-3.5 shadow-2xl shadow-amber-950/60 backdrop-blur-md animate-bounce">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span className="font-display text-sm font-bold tracking-wider text-amber-200">
                  {abilityToast}
                </span>
              </div>
            </div>
          )}

          {/* Floating Controls Helper Button */}
          <button
            onClick={() => setShowControls(true)}
            className="pointer-events-auto fixed bottom-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-slate-400 hover:border-slate-500 hover:text-slate-100 transition-colors shadow-lg"
            title="Guia de Controles"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          {/* Sprite & Animation Manager Modal */}
          {showSpriteManager && (
            <SpriteManagerModal onClose={() => setShowSpriteManager(false)} />
          )}

          {/* NPC Dialogue Box */}
          {activeNPC && (
            <DialogueBox
              speakerName={activeNPC.name}
              speakerTitle={activeNPC.title}
              portraitIcon={activeNPC.portraitIcon}
              lines={activeNPC.dialogue}
              onFinish={() => {
                setActiveNPC(null);
                setPlayer((p) => ({ ...p, isTalking: false }));
              }}
            />
          )}

          {/* Kingdom Map Modal */}
          {showMap && (
            <WorldMapModal
              currentRoom={currentRoom}
              discoveredRooms={discoveredRooms}
              remotePlayers={remotePlayers}
              onClose={() => setShowMap(false)}
              onFastTravel={(targetRoomId) => {
                const targetRoom = GAME_ROOMS[targetRoomId];
                if (targetRoom) {
                  setCurrentRoom(targetRoom);
                  setPlayer((prev) => ({
                    ...prev,
                    x: 200,
                    y: 520,
                    vx: 0,
                    vy: 0,
                  }));
                }
              }}
            />
          )}

          {/* Lore Chronicles & Bestiary Modal */}
          {showLore && (
            <LoreModal
              player={player}
              discoveredTablets={discoveredTablets}
              onClose={() => setShowLore(false)}
            />
          )}

          {/* Multiplayer Co-op Modal */}
          {showMultiplayer && (
            <MultiplayerModal
              currentRoomCode={roomCode}
              isConnected={isConnected}
              remotePlayers={remotePlayers}
              playerName={playerName}
              colorIndex={colorIndex}
              onUpdatePlayer={handleUpdatePlayer}
              onJoinRoom={handleJoinRoom}
              onClose={() => setShowMultiplayer(false)}
              onSendEmote={handleSendEmote}
            />
          )}

          {/* Controls Guide Modal */}
          {showControls && (
            <ControlsGuide onClose={() => setShowControls(false)} />
          )}
        </>
      )}
    </main>
  );
}
