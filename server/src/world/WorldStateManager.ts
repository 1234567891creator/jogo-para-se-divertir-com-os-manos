/**
 * Echoward Server - World State Manager
 * Authoritative manager for boss health, door openings, totems, and loot.
 */

import { WorldStateSync } from '../../../shared/types';

export class WorldStateManager {
  public static createDefaultWorld(): WorldStateSync {
    return {
      bossHp: {
        guardian: 30,
        sentinel: 45,
      },
      defeatedBosses: [],
      openedDoors: [],
      activatedTotems: ['totem_lumen_init'],
      collectedLoot: [],
    };
  }

  public static applyBossDamage(
    world: WorldStateSync,
    bossId: string,
    damage: number
  ): { currentHp: number; defeated: boolean } {
    if (!world.bossHp[bossId]) {
      world.bossHp[bossId] = 30;
    }

    world.bossHp[bossId] = Math.max(0, world.bossHp[bossId] - damage);
    const defeated = world.bossHp[bossId] <= 0;

    if (defeated && !world.defeatedBosses.includes(bossId)) {
      world.defeatedBosses.push(bossId);
    }

    return {
      currentHp: world.bossHp[bossId],
      defeated,
    };
  }

  public static claimLoot(world: WorldStateSync, lootId: string): boolean {
    if (world.collectedLoot.includes(lootId)) {
      return false; // Already collected
    }
    world.collectedLoot.push(lootId);
    return true;
  }
}
