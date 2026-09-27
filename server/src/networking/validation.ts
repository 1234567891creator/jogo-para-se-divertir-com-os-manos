/**
 * Echoward Server - Networking Validation & Security Guards
 */

import { RoomPlayerSession } from '../types';

export class NetworkSecurity {
  // Max 60 messages per second per client to prevent spam/flooding
  private static MAX_MESSAGES_PER_SECOND = 60;
  // Max JSON message size: 32 KB
  private static MAX_MESSAGE_SIZE = 32 * 1024;

  public static checkRateLimit(session: RoomPlayerSession): boolean {
    const now = Date.now();
    if (now - session.lastRateReset > 1000) {
      session.lastRateReset = now;
      session.messageCount = 0;
    }

    session.messageCount++;
    return session.messageCount <= this.MAX_MESSAGES_PER_SECOND;
  }

  public static isPayloadSizeValid(rawLength: number): boolean {
    return rawLength <= this.MAX_MESSAGE_SIZE;
  }

  public static validatePosition(x: number, y: number): boolean {
    // Map bounds guard: reasonable coordinates within 0..6000
    return (
      typeof x === 'number' &&
      typeof y === 'number' &&
      !isNaN(x) &&
      !isNaN(y) &&
      x >= -200 &&
      x <= 5000 &&
      y >= -500 &&
      y <= 3000
    );
  }

  public static validateHp(hp: number, maxHp: number): boolean {
    return (
      typeof hp === 'number' &&
      typeof maxHp === 'number' &&
      !isNaN(hp) &&
      hp >= 0 &&
      hp <= 20 &&
      maxHp >= 1 &&
      maxHp <= 20
    );
  }
}
