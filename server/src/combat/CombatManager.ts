/**
 * Echoward Server - Combat & Damage Manager
 * Authoritative combat validation, hit registration, damage broadcast,
 * downing, and revive coordination.
 */

import { GameRoomState, RoomPlayerSession } from '../types';
import { WorldStateManager } from '../world/WorldStateManager';

export class CombatManager {
  /**
   * Validates player attack intent and registers boss hit
   */
  public static handleBossDamage(
    room: GameRoomState,
    session: RoomPlayerSession,
    bossId: string,
    damage: number
  ): { valid: boolean; currentHp: number; defeated: boolean } {
    // Basic anti-cheat: damage cannot exceed 5 per hit
    const sanitizedDamage = Math.max(1, Math.min(5, Math.floor(damage)));

    const result = WorldStateManager.applyBossDamage(room.worldState, bossId, sanitizedDamage);
    return {
      valid: true,
      currentHp: result.currentHp,
      defeated: result.defeated,
    };
  }

  /**
   * Applies damage to a player and checks for downed/death state
   */
  public static applyPlayerDamage(
    session: RoomPlayerSession,
    amount: number
  ): { hp: number; isDowned: boolean; isDead: boolean } {
    session.hp = Math.max(0, session.hp - amount);
    session.isDowned = session.hp <= 0;
    return {
      hp: session.hp,
      isDowned: session.isDowned,
      isDead: session.hp <= 0,
    };
  }

  /**
   * Revives a downed co-op companion
   */
  public static revivePlayer(
    room: GameRoomState,
    reviverSession: RoomPlayerSession,
    targetPlayerId: string
  ): RoomPlayerSession | null {
    for (const target of room.players.values()) {
      if (target.id === targetPlayerId && target.isDowned) {
        // Distance check between players (within 120px)
        const dist = Math.hypot(reviverSession.x - target.x, reviverSession.y - target.y);
        if (dist <= 150) {
          target.isDowned = false;
          target.hp = Math.max(2, Math.floor(target.maxHp / 2));
          target.currentAnimation = 'idle';
          return target;
        }
      }
    }
    return null;
  }
}
