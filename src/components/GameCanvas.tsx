import React, { useEffect, useRef, useCallback } from 'react';
import {
  PlayerState,
  GameRoom,
  ActiveEnemy,
  Platform,
  LoreTablet,
  NPC,
  RemotePlayer,
} from '../game/types';
import { GAME_ROOMS } from '../game/worldMap';
import { physicsEngine, InputState, checkAABB } from '../game/physics';
import { enemyManager } from '../game/enemies';
import { gameRenderer } from '../game/renderer';
import { soundEngine } from '../game/audio';
import { multiplayerClient } from '../game/multiplayerClient';

interface GameCanvasProps {
  initialPlayer: PlayerState;
  onPlayerHUDUpdate: (player: PlayerState) => void;
  currentRoom: GameRoom;
  setCurrentRoom: (room: GameRoom) => void;
  onInteractNPC: (npc: NPC) => void;
  onReadTablet: (tab: LoreTablet) => void;
  onDiscoverAbility: (name: string) => void;
  activeBoss: ActiveEnemy | null;
  setActiveBoss: (b: ActiveEnemy | null) => void;
  remotePlayers: RemotePlayer[];
  lanternBrightness: 'normal' | 'bright' | 'max';
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  initialPlayer,
  onPlayerHUDUpdate,
  currentRoom,
  setCurrentRoom,
  onInteractNPC,
  onReadTablet,
  onDiscoverAbility,
  setActiveBoss,
  remotePlayers,
  lanternBrightness,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Authoritative in-game physics player state
  const playerRef = useRef<PlayerState>({
    ...initialPlayer,
    lanternBrightness,
  });

  playerRef.current.lanternBrightness = lanternBrightness;

  // Stable references for rooms and external state
  const currentRoomRef = useRef<GameRoom>(currentRoom);
  currentRoomRef.current = currentRoom;

  const remotePlayersRef = useRef<RemotePlayer[]>(remotePlayers);
  remotePlayersRef.current = remotePlayers;

  const activeEnemiesRef = useRef<ActiveEnemy[]>([]);

  // Input states
  const keysRef = useRef<{ [code: string]: boolean }>({});
  const inputStateRef = useRef<InputState>({
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    jumpPressed: false,
    attackPressed: false,
    dashPressed: false,
    healHold: false,
    spellPressed: false,
    rewindPressed: false,
    visionPressed: false,
  });

  // Spawn room enemies when entering a room
  const initRoomEnemies = useCallback((room: GameRoom) => {
    enemyManager.clearProjectiles();
    const spawned: ActiveEnemy[] = [];
    for (const sp of room.enemies) {
      const en = enemyManager.createEnemy(sp.id, sp.type, sp.x, sp.y, sp.patrolDist);
      spawned.push(en);
      if (en.isBoss) {
        setActiveBoss(en);
      }
    }
    if (!spawned.some((e) => e.isBoss)) {
      setActiveBoss(null);
    }
    activeEnemiesRef.current = spawned;
  }, [setActiveBoss]);

  // When current room changes
  useEffect(() => {
    initRoomEnemies(currentRoom);
    soundEngine.startAmbientMusic(currentRoom.regionId);
  }, [currentRoom.id, initRoomEnemies]);

  // Setup Keyboard Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      keysRef.current[e.code] = true;

      if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) {
        inputStateRef.current.jumpPressed = true;
      }
      if (['KeyC', 'KeyJ'].includes(e.code)) {
        inputStateRef.current.attackPressed = true;
      }
      if (['ShiftLeft', 'ShiftRight', 'KeyK', 'KeyZ'].includes(e.code)) {
        inputStateRef.current.dashPressed = true;
      }
      if (['KeyX'].includes(e.code)) {
        inputStateRef.current.spellPressed = true;
      }
      if (['KeyR'].includes(e.code)) {
        inputStateRef.current.rewindPressed = true;
      }
      if (['KeyV'].includes(e.code)) {
        inputStateRef.current.visionPressed = true;
      }

      // Check interaction
      if (['KeyW', 'ArrowUp', 'KeyE'].includes(e.code)) {
        checkPlayerInteractions();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        inputStateRef.current.attackPressed = true;
      } else if (e.button === 2) {
        inputStateRef.current.dashPressed = true;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('contextmenu', onContextMenu);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('contextmenu', onContextMenu);
    };
  }, []);

  const checkPlayerInteractions = () => {
    const p = playerRef.current;
    const room = currentRoomRef.current;

    for (const npc of room.npcs) {
      if (Math.hypot(p.x - npc.x, p.y - npc.y) < 75) {
        p.isTalking = true;
        p.isInteracting = true;
        p.interactionTimer = 1.0;
        onInteractNPC(npc);
        soundEngine.playDash();
        return;
      }
    }

    for (const tab of room.tablets) {
      if (Math.hypot(p.x - tab.x, p.y - tab.y) < 75) {
        p.isInteracting = true;
        p.interactionTimer = 0.8;
        onReadTablet(tab);
        soundEngine.playTotemRest();
        return;
      }
    }

    for (const totem of room.totems) {
      if (Math.hypot(p.x - totem.x, p.y - totem.y) < 85) {
        p.hp = p.maxHp;
        p.pulse = p.maxPulse;
        totem.activated = true;
        p.isInteracting = true;
        p.interactionTimer = 0.8;
        physicsEngine.screenShake = 8;
        soundEngine.playTotemRest();
        onPlayerHUDUpdate({ ...p });
        return;
      }
    }
  };

  // Main 60FPS Game Loop - Independent of React state updates to prevent any hitching or freezing!
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let syncThrottleTimer = 0;
    let hudThrottleTimer = 0;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05); // capped at 50ms
      lastTime = time;

      const keys = keysRef.current;
      const input = inputStateRef.current;

      input.left = Boolean(keys['KeyA'] || keys['ArrowLeft']);
      input.right = Boolean(keys['KeyD'] || keys['ArrowRight']);
      input.up = Boolean(keys['KeyW'] || keys['ArrowUp']);
      input.down = Boolean(keys['KeyS'] || keys['ArrowDown']);
      input.jump = Boolean(keys['Space'] || keys['KeyW'] || keys['ArrowUp']);
      input.healHold = Boolean(keys['KeyF'] || keys['KeyE']);

      const p = playerRef.current;
      const room = currentRoomRef.current;

      const onBreakFragileFloor = (plat: Platform) => {
        gameRenderer.addSparks(plat.x + plat.width / 2, plat.y + plat.height / 2, '#ea580c', 20);
        room.platforms = room.platforms.filter((pl) => pl !== plat);
      };

      const onRespawn = () => {
        // Respawn Nox at room start
        p.x = 200;
        p.y = 520;
        p.vx = 0;
        p.vy = 0;
        soundEngine.playTotemRest();
        physicsEngine.screenShake = 10;
        onPlayerHUDUpdate({ ...p });
      };

      // 1. Update Player Physics & Animation States
      physicsEngine.update(p, input, room.platforms, dt, onBreakFragileFloor, onRespawn);

      // 2. Check Collectibles
      for (const item of room.collectibles) {
        if (!item.collected) {
          if (Math.hypot(p.x - item.x, p.y - item.y) < 36) {
            item.collected = true;
            soundEngine.playHealComplete();
            physicsEngine.screenShake = 12;
            gameRenderer.addSparks(item.x, item.y, '#f59e0b', 30);

            if (item.type === 'ability' && item.abilityName) {
              p.abilities[item.abilityName] = true;
              onDiscoverAbility(item.label);
            } else if (item.type === 'shard') {
              p.geoOrbs += 50;
              p.pulse = p.maxPulse;
            }
            onPlayerHUDUpdate({ ...p });
          }
        }
      }

      // 3. Attack Check vs Enemies
      if (physicsEngine.activeSlash) {
        const hit = enemyManager.checkPlayerSlash(
          physicsEngine.activeSlash,
          activeEnemiesRef.current,
          p,
          () => physicsEngine.triggerPogoBounce(p)
        );
        if (hit) {
          onPlayerHUDUpdate({ ...p });
        }
      }

      // 4. Update Enemies AI
      enemyManager.update(
        activeEnemiesRef.current,
        p,
        dt,
        (defeatedEnemy) => {
          gameRenderer.addSparks(defeatedEnemy.x, defeatedEnemy.y, '#72E7FE', 25);
          if (defeatedEnemy.isBoss) {
            setActiveBoss(null);
            p.maskCracks = Math.min(3, p.maskCracks + 1) as any;
            soundEngine.playHealComplete();
            onPlayerHUDUpdate({ ...p });
          }
        },
        () => physicsEngine.triggerPogoBounce(p)
      );

      // 5. Room Transitions
      const playerRect = { x: p.x, y: p.y, width: p.width, height: p.height };
      for (const tr of room.transitions) {
        if (checkAABB(playerRect, tr.rect)) {
          const nextRoom = GAME_ROOMS[tr.targetRoomId];
          if (nextRoom) {
            p.x = tr.targetSpawn.x;
            p.y = tr.targetSpawn.y;
            p.vx = 0;
            p.vy = 0;
            p.isEnteringDoor = true;
            p.doorTransitionTimer = 0.35;
            soundEngine.playDash();
            setCurrentRoom(nextRoom);
            onPlayerHUDUpdate({ ...p });
            break;
          }
        }
      }

      // 6. Multiplayer Sync (20Hz)
      syncThrottleTimer += dt;
      if (syncThrottleTimer >= 0.05) {
        syncThrottleTimer = 0;
        multiplayerClient.sendPlayerSync(p, room.id);
      }

      // 7. Update HUD state throttled (every 100ms)
      hudThrottleTimer += dt;
      if (hudThrottleTimer >= 0.1) {
        hudThrottleTimer = 0;
        onPlayerHUDUpdate({ ...p });
      }

      // Reset one-shot input triggers
      input.jumpPressed = false;
      input.attackPressed = false;
      input.dashPressed = false;
      input.spellPressed = false;
      input.rewindPressed = false;
      input.visionPressed = false;

      // 8. Render Frame to Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          gameRenderer.render(
            ctx,
            canvas.width,
            canvas.height,
            room,
            p,
            activeEnemiesRef.current,
            enemyManager.projectiles,
            physicsEngine.activeSlash,
            remotePlayersRef.current,
            physicsEngine.screenShake,
            dt
          );
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId);
  }, []); // Run once on mount! Never cancel the loop!

  // Canvas Window Resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      tabIndex={0}
      onClick={() => canvasRef.current?.focus()}
      className="absolute inset-0 h-full w-full bg-[#06080d] block cursor-crosshair select-none outline-none"
    />
  );
};
