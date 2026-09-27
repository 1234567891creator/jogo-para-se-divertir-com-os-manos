/**
 * Echoward: Reino das Cinzas - Network Protocol Helpers & Validators
 */

import { PROTOCOL_VERSION } from './constants';
import { CharacterArchetype } from './types';

export function isProtocolCompatible(version?: string): boolean {
  if (!version) return true; // lenient fallback
  const [major] = version.split('.');
  const [currentMajor] = PROTOCOL_VERSION.split('.');
  return major === currentMajor;
}

export function sanitizeRoomCode(raw: string): string {
  return (raw || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').substring(0, 10);
}

export function sanitizePlayerName(raw: string): string {
  const trimmed = (raw || 'Nox').trim().replace(/[<>]/g, '');
  return trimmed.substring(0, 16) || 'Nox';
}

export function isValidCharacter(char: any): char is CharacterArchetype {
  return ['Nox', 'Veyra', 'Orin', 'Kael'].includes(char);
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
