/**
 * Echoward: Reino das Cinzas - Main Application
 */

import React, { useState, useEffect, useRef } from 'react';
import { PlayerState, GameRoom, ActiveEnemy, NPC, LoreTablet, RemotePlayer, SavePoint } from './game/types';
import { GAME_ROOMS } from './game/worldMap';
import { GameCanvas, setMobileInput, AdminCanvasAction } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { WorldMapModal } from './components/WorldMapModal';
import { LoreModal } from './components/LoreModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { SpriteManagerModal } from './components/SpriteManagerModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SoundStudioModal } from './components/SoundStudioModal';
import { MobileControls } from './components/MobileControls';
import { DialogueBox } from './components/DialogueBox';
import { ControlsGuide } from './components/ControlsGuide';
import { SecretCodeModal } from './components/SecretCodeModal';
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

  // Device detection: detect touchscreen or mobile screen
  const [isMobileDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  });

  // Modals & UI States
  const [showMap, setShowMap] = useState(false);
  const [showLore, setShowLore] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [showSpriteManager, setShowSpriteManager] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [showMobileControls, setShowMobileControls] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  });
  const [showCodeInputModal, setShowCodeInputModal] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('echoward_admin_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [activeNPC, setActiveNPC] = useState<NPC | null>(null);
  const [abilityToast, setAbilityToast] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Admin canvas actions trigger
  const [adminAction, setAdminAction] = useState<AdminCanvasAction | null>(null);

  // Secret code 847717 buffer
  const codeBufferRef = useRef<string>('');

  // Active Save Point & Checkpoint system
  const [activeSavePoint, setActiveSavePoint] = useState<SavePoint | null>(() => {
    try {
      const saved = localStorage.getItem('echoward_saved_checkpoint');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Multiplayer Room State (unique session code by default to prevent stranger clone clutter)
  const [roomCode, setRoomCode] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRoom = urlParams.get('room');
      if (urlRoom) return urlRoom.trim().toUpperCase();
      const saved = localStorage.getItem('echoward_room_code');
      if (saved) return saved;
    } catch {}
    const defaultCode = 'SALA-' + Math.floor(100 + Math.random() * 900);
    try {
      localStorage.setItem('echoward_room_code', defaultCode);
    } catch {}
    return defaultCode;
  });
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem('echoward_player_name') || 'Nox';
    } catch {
      return 'Nox';
    }
  });
  const [colorIndex, setColorIndex] = useState(() => {
    try {
      const s = localStorage.getItem('echoward_color_index');
      return s ? parseInt(s, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });
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

  const unlockAdminCode = () => {
    setIsAdminUnlocked(true);
    try {
      localStorage.setItem('echoward_admin_unlocked', 'true');
    } catch {}
    setShowAdminModal(true);
    soundEngine.playSecretCodeSuccess();
    setAbilityToast('✨ PAINEL ADM DESBLOQUEADO (CÓDIGO 847717)!');
    setTimeout(() => setAbilityToast(null), 3500);
  };

  // Global hotkeys & Secret Code 847717 Detection
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      // Track numeric keys for secret code 847717
      if (e.key && /^[0-9]$/.test(e.key)) {
        codeBufferRef.current = (codeBufferRef.current + e.key).slice(-10);
        if (codeBufferRef.current.endsWith('847717')) {
          codeBufferRef.current = '';
          unlockAdminCode();
          return;
        }
      }

      if (e.code === 'KeyM') {
        setShowMap((v) => !v);
      } else if (e.code === 'KeyL') {
        setShowLore((v) => !v);
      } else if (e.code === 'KeyP') {
        setShowMultiplayer((v) => !v);
      } else if (e.code === 'KeyT') {
        const remotes = multiplayerClient.getRemotePlayersArray();
        if (remotes.length > 0) {
          const comp = remotes[0];
          const targetRoom = GAME_ROOMS[comp.currentRoomId];
          if (targetRoom) {
            handleTeleportRoom(targetRoom, comp.x, comp.y);
            setAbilityToast(`✨ Teleportado para o companheiro ${comp.name}!`);
            setTimeout(() => setAbilityToast(null), 3000);
          }
        }
      } else if (e.code === 'KeyI') {
        setShowSpriteManager((v) => !v);
      } else if (e.code === 'Slash' || e.code === 'KeyH') {
        setShowControls((v) => !v);
      } else if (e.code === 'Escape') {
        setShowMap(false);
        setShowLore(false);
        setShowMultiplayer(false);
        setShowSpriteManager(false);
        setShowAdminModal(false);
        setShowSoundModal(false);
        setShowControls(false);
        setShowCodeInputModal(false);
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

  const handleStartGame = (fromSavePoint: boolean = false) => {
    let startingRoom = currentRoom;
    let spawnX = 200;
    let spawnY = 520;

    if (fromSavePoint && activeSavePoint) {
      const foundRoom = GAME_ROOMS[activeSavePoint.roomId];
      if (foundRoom) {
        startingRoom = foundRoom;
        spawnX = activeSavePoint.x;
        spawnY = activeSavePoint.y;
      }
    }

    setCurrentRoom(startingRoom);
    setPlayer((prev) => ({
      ...prev,
      name: playerName,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      hp: prev.maxHp,
      pulse: prev.maxPulse,
    }));
    setGameState('PLAYING');
    soundEngine.playTotemRest();
    soundEngine.startAmbientMusic(startingRoom.regionId);
  };

  const handleSaveCheckpoint = (sp: SavePoint) => {
    setActiveSavePoint(sp);
    setAbilityToast(`✨ PONTO DE SALVAMENTO ATIVADO: ${sp.name}! (Progresso Salvo)`);
    setTimeout(() => setAbilityToast(null), 3500);
  };

  const handleSendEmote = (text: string) => {
    multiplayerClient.sendEmote(text);
  };

  const handleUpdatePlayer = (newName: string, newColor: number) => {
    setPlayerName(newName);
    setColorIndex(newColor);
    setPlayer((p) => ({ ...p, name: newName }));
    multiplayerClient.setName(newName);
    multiplayerClient.setColorIndex(newColor);
  };

  const handleJoinRoom = (newCode: string) => {
    const cleanCode = newCode.trim().toUpperCase();
    setRoomCode(cleanCode);
    try {
      localStorage.setItem('echoward_room_code', cleanCode);
    } catch {}
    multiplayerClient.connect(cleanCode, playerName, colorIndex);
  };

  // Admin Actions
  const handleTeleportRoom = (room: GameRoom, targetX = 200, targetY = 520) => {
    setCurrentRoom(room);
    setPlayer((prev) => ({
      ...prev,
      x: targetX,
      y: targetY,
      vx: 0,
      vy: 0,
    }));
    setAdminAction({
      type: 'teleport',
      payload: { x: targetX, y: targetY },
      id: Date.now(),
    });
  };

  const handleKillAllEnemies = () => {
    setAdminAction({
      type: 'kill_enemies',
      id: Date.now(),
    });
    setActiveBoss(null);
  };

  const handleSpawnEnemy = (
    type:
      | 'crawler'
      | 'specter'
      | 'varron_sentinel'
      | 'abyss_diver'
      | 'boss_guardian'
      | 'boss_varron_colossus'
      | 'boss_shade'
  ) => {
    setAdminAction({
      type: 'spawn_enemy',
      payload: { type },
      id: Date.now(),
    });
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#06080d] font-sans antialiased text-slate-100 select-none">
      {gameState === 'TITLE' ? (
        <TitleScreen
          onStartGame={() => handleStartGame(false)}
          savedCheckpoint={activeSavePoint}
          onContinueSavedGame={() => handleStartGame(true)}
          onOpenMultiplayer={() => setShowMultiplayer(true)}
          onOpenLore={() => setShowLore(true)}
          onOpenMap={() => setShowMap(true)}
        />
      ) : (
        <>
          {/* Main 60FPS Metroidvania Physics & WebGL/2D Canvas */}
          <GameCanvas
            initialPlayer={player}
            onPlayerHUDUpdate={setPlayer}
            currentRoom={currentRoom}
            setCurrentRoom={setCurrentRoom}
            onInteractNPC={(npc) => {
              setActiveNPC(npc);
              setPlayer((p) => ({ ...p, isTalking: true }));
              soundEngine.playNpcVoice();
            }}
            onReadTablet={(tab) => {
              setShowLore(true);
              if (!discoveredTablets.some((t) => t.id === tab.id)) {
                setDiscoveredTablets((prev) => [...prev, tab]);
              }
            }}
            onDiscoverAbility={handleDiscoverAbility}
            activeBoss={activeBoss}
            setActiveBoss={setActiveBoss}
            remotePlayers={remotePlayers}
            lanternBrightness={lanternBrightness}
            adminAction={adminAction}
            activeSavePoint={activeSavePoint}
            onSaveCheckpoint={handleSaveCheckpoint}
          />

          {/* Top In-Game HUD: Masks, Pulse Vessel, Quick Actions & Real-Time Mini-Map */}
          <HUD
            player={player}
            currentRoom={currentRoom}
            activeBoss={activeBoss}
            remotePlayers={remotePlayers}
            discoveredRooms={discoveredRooms}
            activeSavePoint={activeSavePoint}
            isAdminUnlocked={isAdminUnlocked}
            onOpenMap={() => setShowMap(true)}
            onOpenLore={() => setShowLore(true)}
            onOpenMultiplayer={() => setShowMultiplayer(true)}
            onOpenSpriteManager={() => setShowSpriteManager(true)}
            onOpenAdmin={() => setShowAdminModal(true)}
            onOpenSounds={() => setShowSoundModal(true)}
            onOpenCodeInput={() => setShowCodeInputModal(true)}
            onToggleMobileControls={() => setShowMobileControls((v) => !v)}
            isMobileControlsVisible={showMobileControls}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onSendQuickEmote={handleSendEmote}
            lanternBrightness={lanternBrightness}
            onCycleLantern={handleCycleLantern}
            onToggleAbility={handleToggleAbility}
          />

          {/* Mobile Touch Controls Overlay (Virtual D-Pad & Action Buttons) */}
          <MobileControls
            onInputStateChange={(key, pressed) => setMobileInput(key, pressed)}
            isAdminUnlocked={isAdminUnlocked}
            onOpenAdmin={() => setShowAdminModal(true)}
            onOpenSoundTab={() => setShowSoundModal(true)}
            onOpenSpriteTab={() => setShowSpriteManager(true)}
            onOpenMap={() => setShowMap(true)}
            onOpenCodeInput={() => setShowCodeInputModal(true)}
            isVisible={showMobileControls}
            onToggleVisible={() => setShowMobileControls((v) => !v)}
          />

          {/* Ability Discovery Banner */}
          {abilityToast && (
            <div className="pointer-events-none fixed top-20 inset-x-0 z-50 flex justify-center">
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/80 bg-slate-950/95 px-6 py-3.5 shadow-2xl shadow-amber-950/60 backdrop-blur-md animate-bounce">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <span className="font-serif text-sm font-bold tracking-wider text-amber-200">
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

          {/* Secret Code Input Modal */}
          <SecretCodeModal
            isOpen={showCodeInputModal}
            onClose={() => setShowCodeInputModal(false)}
            onSuccess={unlockAdminCode}
          />

          {/* Admin Panel Modal (Triggered by 847717 or button) */}
          <AdminPanelModal
            isOpen={showAdminModal}
            onClose={() => setShowAdminModal(false)}
            player={player}
            setPlayer={setPlayer}
            currentRoom={currentRoom}
            onTeleportRoom={handleTeleportRoom}
            onOpenSprites={() => setShowSpriteManager(true)}
            onOpenSounds={() => setShowSoundModal(true)}
            onKillAllEnemies={handleKillAllEnemies}
            onSpawnEnemy={handleSpawnEnemy}
          />

          {/* Sound & Music Studio Modal */}
          <SoundStudioModal
            isOpen={showSoundModal}
            onClose={() => setShowSoundModal(false)}
            currentRegion={currentRoom.regionId}
          />

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

          {/* Controls Guide Modal */}
          {showControls && (
            <ControlsGuide onClose={() => setShowControls(false)} />
          )}
        </>
      )}

      {/* Modals Accessible in Title Screen & In-Game */}
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
    </main>
  );
}
