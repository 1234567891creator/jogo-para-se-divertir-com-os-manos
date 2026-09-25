import React, { useEffect, useRef, useCallback } from 'react';
import {
  PlayerState,
  GameRoom,
  ActiveEnemy,
  Platform,
  LoreTablet,
  NPC,
  RemotePlayer,
  SavePoint,
} from '../game/types';
import { GAME_ROOMS } from '../game/worldMap';
import { physicsEngine, InputState, checkAABB } from '../game/physics';
import { enemyManager } from '../game/enemies';
import { gameRenderer } from '../game/renderer';
import { soundEngine } from '../game/audio';
import { multiplayerClient } from '../game/multiplayerClient';

export interface AdminCanvasAction {
  type: 'kill_enemies' | 'spawn_enemy' | 'teleport' | 'heal_full' | 'pulse_full' | 'unlock_abilities';
  payload?: any;
  id: number;
}

export const mobileInputState = {
  left: false,
  right: false,
  up: false,
  down: false,
  jump: false,
  jumpPressed: false,
  attackPressed: false,
  dashPressed: false,
  healHold: false,
  visionPressed: false,
};

export const setMobileInput = (action: string, pressed: boolean) => {
  if (action === 'left') mobileInputState.left = pressed;
  if (action === 'right') mobileInputState.right = pressed;
  if (action === 'up') mobileInputState.up = pressed;
  if (action === 'down') mobileInputState.down = pressed;
  if (action === 'jump') {
    mobileInputState.jump = pressed;
    if (pressed) mobileInputState.jumpPressed = true;
  }
  if (action === 'attack') {
    if (pressed) mobileInputState.attackPressed = true;
  }
  if (action === 'dash') {
    if (pressed) mobileInputState.dashPressed = true;
  }
  if (action === 'heal') mobileInputState.healHold = pressed;
  if (action === 'vision') {
    if (pressed) mobileInputState.visionPressed = true;
  }
};

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
  adminAction?: AdminCanvasAction | null;
  activeSavePoint?: SavePoint | null;
  onSaveCheckpoint?: (sp: SavePoint) => void;
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
  adminAction,
  activeSavePoint,
  onSaveCheckpoint,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Authoritative in-game physics player state
  const playerRef = useRef<PlayerState>({
    ...initialPlayer,
    lanternBrightness,
  });

  playerRef.current.lanternBrightness = lanternBrightness;
  playerRef.current.name = initialPlayer.name;

  // Stable references for rooms, savepoints, and external state
  const currentRoomRef = useRef<GameRoom>(currentRoom);
  currentRoomRef.current = currentRoom;

  const activeSavePointRef = useRef<SavePoint | null>(activeSavePoint || null);
  activeSavePointRef.current = activeSavePoint || null;

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

  // Handle Admin Canvas Actions (cheat execution, enemy spawns, teleports)
  const lastAdminActionId = useRef<number>(0);
  useEffect(() => {
    if (!adminAction || adminAction.id === lastAdminActionId.current) return;
    lastAdminActionId.current = adminAction.id;

    if (adminAction.type === 'kill_enemies') {
      activeEnemiesRef.current = [];
      enemyManager.clearProjectiles();
      setActiveBoss(null);
    } else if (adminAction.type === 'spawn_enemy') {
      const type = adminAction.payload?.type || 'crawler';
      const p = playerRef.current;
      const spawnX = p.facing === 'right' ? p.x + 90 : p.x - 90;
      const spawnY = p.y - 10;
      const en = enemyManager.createEnemy(
        `admin_${Date.now()}`,
        type,
        spawnX,
        spawnY,
        150
      );
      activeEnemiesRef.current.push(en);
      if (en.isBoss) {
        setActiveBoss(en);
      }
    } else if (adminAction.type === 'teleport') {
      if (adminAction.payload) {
        playerRef.current.x = adminAction.payload.x ?? 200;
        playerRef.current.y = adminAction.payload.y ?? 500;
        playerRef.current.vx = 0;
        playerRef.current.vy = 0;
      }
    } else if (adminAction.type === 'heal_full') {
      playerRef.current.hp = playerRef.current.maxHp;
      onPlayerHUDUpdate({ ...playerRef.current });
    } else if (adminAction.type === 'pulse_full') {
      playerRef.current.pulse = playerRef.current.maxPulse;
      onPlayerHUDUpdate({ ...playerRef.current });
    } else if (adminAction.type === 'unlock_abilities') {
      playerRef.current.abilities = {
        dash: true,
        doubleJump: true,
        wallClimb: true,
        groundPound: true,
        rewind: true,
        memoryVision: true,
      };
      onPlayerHUDUpdate({ ...playerRef.current });
    }
  }, [adminAction, setActiveBoss, onPlayerHUDUpdate]);

  // When current room changes
  useEffect(() => {
    initRoomEnemies(currentRoom);
    soundEngine.startAmbientMusic(currentRoom.regionId);
  }, [currentRoom.id, initRoomEnemies]);

  // Listen to co-op multiplayer events
  useEffect(() => {
    const unsub = multiplayerClient.on((event, data) => {
      if (event === 'self_revived') {
        const p = playerRef.current;
        p.hp = data.hp || 3;
        p.isDying = false;
        soundEngine.playHealComplete();
        gameRenderer.addSparks(p.x + 14, p.y + 20, '#10b981', 35);
        onPlayerHUDUpdate({ ...p });
      } else if (event === 'boss_synced') {
        const boss = activeEnemiesRef.current.find((e) => e.id === data.bossId);
        if (boss) {
          boss.hp = data.currentHp;
          gameRenderer.addSparks(boss.x + boss.width / 2, boss.y + boss.height / 2, '#f59e0b', 20);
          if (data.isDefeated || data.currentHp <= 0) {
            boss.hp = 0;
            setActiveBoss(null);
            soundEngine.playHealComplete();
          }
        }
      }
    });
    return () => {
      unsub();
    };
  }, [setActiveBoss, onPlayerHUDUpdate]);



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

        const sp: SavePoint = {
          id: totem.id,
          roomId: room.id,
          roomName: room.name,
          x: totem.x + 20,
          y: totem.y - 10,
          name: totem.name,
          activated: true,
          timestamp: Date.now(),
        };

        try {
          localStorage.setItem('echoward_saved_checkpoint', JSON.stringify(sp));
        } catch {}

        if (onSaveCheckpoint) {
          onSaveCheckpoint(sp);
        }
        activeSavePointRef.current = sp;

        onPlayerHUDUpdate({ ...p });
        return;
      }
    }

    // Check revive for downed co-op companions
    for (const remote of remotePlayersRef.current) {
      if (remote.isDowned && remote.currentRoomId === room.id) {
        if (Math.hypot(p.x - remote.x, p.y - remote.y) < 70) {
          multiplayerClient.sendRevive(remote.id);
          soundEngine.playHealComplete();
          gameRenderer.addSparks(remote.x + 14, remote.y + 20, '#10b981', 30);
          physicsEngine.screenShake = 6;
          p.isInteracting = true;
          p.interactionTimer = 0.5;
          return;
        }
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

      input.left = Boolean(keys['KeyA'] || keys['ArrowLeft'] || mobileInputState.left);
      input.right = Boolean(keys['KeyD'] || keys['ArrowRight'] || mobileInputState.right);
      input.up = Boolean(keys['KeyW'] || keys['ArrowUp'] || mobileInputState.up);
      input.down = Boolean(keys['KeyS'] || keys['ArrowDown'] || mobileInputState.down);
      input.jump = Boolean(keys['Space'] || keys['KeyW'] || keys['ArrowUp'] || mobileInputState.jump);
      input.healHold = Boolean(keys['KeyF'] || keys['KeyE'] || mobileInputState.healHold);

      if (mobileInputState.jumpPressed) {
        input.jumpPressed = true;
        mobileInputState.jumpPressed = false;
      }
      if (mobileInputState.attackPressed) {
        input.attackPressed = true;
        mobileInputState.attackPressed = false;
      }
      if (mobileInputState.dashPressed) {
        input.dashPressed = true;
        mobileInputState.dashPressed = false;
      }
      if (mobileInputState.visionPressed) {
        input.visionPressed = true;
        mobileInputState.visionPressed = false;
      }

      if (mobileInputState.up) {
        checkPlayerInteractions();
      }

      const p = playerRef.current;
      const room = currentRoomRef.current;

      const onBreakFragileFloor = (plat: Platform) => {
        gameRenderer.addSparks(plat.x + plat.width / 2, plat.y + plat.height / 2, '#ea580c', 20);
        room.platforms = room.platforms.filter((pl) => pl !== plat);
      };

      const onRespawn = () => {
        soundEngine.playTotemRest();
        physicsEngine.screenShake = 12;
        p.hp = p.maxHp;
        p.pulse = p.maxPulse;
        p.vx = 0;
        p.vy = 0;

        let targetSpawnX = 200;
        let targetSpawnY = 520;
        let targetRoom = room;

        if (activeSavePointRef.current) {
          const sp = activeSavePointRef.current;
          const foundRoom = GAME_ROOMS[sp.roomId];
          if (foundRoom) {
            targetRoom = foundRoom;
            targetSpawnX = sp.x;
            targetSpawnY = sp.y;
          }
        }

        p.x = targetSpawnX;
        p.y = targetSpawnY;

        if (targetRoom.id !== currentRoomRef.current.id) {
          setCurrentRoom(targetRoom);
        }
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
      if (input.attackPressed) {
        multiplayerClient.sendPlayerAttack(p.attackDirection);
      }

      if (physicsEngine.activeSlash) {
        const hit = enemyManager.checkPlayerSlash(
          physicsEngine.activeSlash,
          activeEnemiesRef.current,
          p,
          () => physicsEngine.triggerPogoBounce(p)
        );
        if (hit) {
          onPlayerHUDUpdate({ ...p });
          for (const en of activeEnemiesRef.current) {
            if (en.isBoss) {
              multiplayerClient.sendBossDamage(en.id, 1, en.hp);
            }
          }
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

      // 7. Update HUD & Mini-Map state throttled (every 50ms / 20 FPS)
      hudThrottleTimer += dt;
      if (hudThrottleTimer >= 0.05) {
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

      // 8. Render Frame to Canvas - Only players inside this room appear
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const roomPlayers = remotePlayersRef.current.filter(
            (rp) => rp.currentRoomId === room.id && typeof rp.x === 'number' && typeof rp.y === 'number'
          );
          gameRenderer.render(
            ctx,
            canvas.width,
            canvas.height,
            room,
            p,
            activeEnemiesRef.current,
            enemyManager.projectiles,
            physicsEngine.activeSlash,
            roomPlayers,
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
