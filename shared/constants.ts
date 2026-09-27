/**
 * Echoward: Reino das Cinzas - Shared Constants
 */

export const PROTOCOL_VERSION = '1.0.0';

export const MAX_PLAYERS_PER_ROOM = 4;
export const MAX_PUBLIC_ROOM_PLAYERS = 16;

export const SERVER_TICK_RATE = 20; // 20 ticks/sec (50ms interval)
export const CLIENT_SYNC_RATE = 20; // 20 times/sec

export const PUBLIC_SANCTUARY_ROOMS = ['LUMEN', 'CINZAS', 'NER', 'ECOS'] as const;

export const DEFAULT_MAIN_SERVER_ROOM = 'LUMEN';
