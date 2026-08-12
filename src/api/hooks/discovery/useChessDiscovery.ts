/*
 * Unfathomably chess discovery
 * ----------------------------
 *
 * File: useChessDiscovery.ts
 *
 * Purpose:
 *   Load explicitly requested Castling challengers and recent games.
 *
 * Responsibilities:
 *   - request the bounded Games discovery result from the local backend
 *   - validate provider, player, board, and move fields before rendering
 *   - distinguish a reachable empty service from an unavailable service
 *
 * This file intentionally does not contact Castling directly, issue a
 * challenge, or trust remote chess markup without backend validation.
 */

import { useQuery } from '@tanstack/react-query';

import { useApi } from '@/hooks/useApi.ts';

import { withNativeDiscoveryStatus } from './nativeDiscoveryStatus.ts';

interface ChessPlayer {
  username: string;
  actor_url?: string;
  handle?: string;
}

interface ChessParticipant {
  actor_url: string;
  handle?: string;
}

interface ChessMove {
  san: string;
  url: string;
  published_at?: string;
}

export interface ChessGameDiscoveryItem {
  id: string;
  family: 'game';
  kind: 'chess_game';
  title: string;
  url: string;
  source_host: string;
  arbiter_handle: string;
  white?: ChessPlayer;
  black?: ChessPlayer;
  next_player?: ChessPlayer;
  fen?: string;
  last_move?: string;
  latest_move_url?: string;
  board_image_url?: string;
  setup_note?: string;
  badge?: string;
  active_color?: 'white' | 'black';
  turn?: number;
  move_count?: number;
  published_at?: string;
}

export interface ChessChallengerDiscoveryItem {
  id: string;
  family: 'game';
  kind: 'open_challenge';
  title: string;
  handle: string;
  actor_url: string;
  source_host: string;
  arbiter_handle: string;
}

export interface ReceivedChessGameDiscoveryItem {
  id: string;
  family: 'game';
  kind: 'received_chess_game';
  title: string;
  url: string;
  latest_move_url: string;
  source_host: string;
  fen: string;
  last_move?: string;
  board_image_url?: string;
  content?: string;
  active_color?: 'white' | 'black';
  participants: ChessParticipant[];
  white?: ChessParticipant;
  black?: ChessParticipant;
  fullmove_number?: number;
  position_ply?: number;
  loaded_move_count?: number;
  recent_moves?: ChessMove[];
  reported_status?: 'active' | 'checkmate' | 'draw';
  published_at?: string;
}

export type ChessDiscoveryItem =
  | ChessGameDiscoveryItem
  | ChessChallengerDiscoveryItem
  | ReceivedChessGameDiscoveryItem;

export interface ChessCastlingDiscoveryProvider {
  type: 'castling';
  host: string;
  url?: string;
  arbiter_handle: string;
  status: 'ready' | 'unavailable';
}

export interface ChessLocalDiscoveryProvider {
  type: 'local_chess';
  host: string;
  status: 'ready' | 'unavailable';
}

export type ChessDiscoveryProvider = ChessCastlingDiscoveryProvider | ChessLocalDiscoveryProvider;

interface ChessDiscoveryResponse {
  items: ChessDiscoveryItem[];
  providers: ChessDiscoveryProvider[];
}

const emptyResponse: ChessDiscoveryResponse = { items: [], providers: [] };
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const stringValue = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 ? value : undefined;
const boundedString = (value: unknown, maximum: number): string | undefined => {
  const text = stringValue(value)?.trim();
  return text && text.length <= maximum ? text : undefined;
};
const numberValue = (value: unknown): number | undefined => (
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100000 ? value : undefined
);
const httpsUrl = (value: unknown): string | undefined => {
  const text = boundedString(value, 2048);
  if (!text) return undefined;

  try {
    const url = new URL(text);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : undefined;
  } catch {
    return undefined;
  }
};

const normalizePlayer = (value: unknown): ChessPlayer | undefined => {
  if (!isRecord(value)) return undefined;

  const username = boundedString(value.username, 100);
  if (!username) return undefined;

  return {
    username,
    actor_url: httpsUrl(value.actor_url),
    handle: boundedString(value.handle, 300),
  };
};

const normalizeParticipant = (value: unknown): ChessParticipant | null => {
  if (!isRecord(value)) return null;

  const actorUrl = httpsUrl(value.actor_url);
  if (!actorUrl) return null;

  return {
    actor_url: actorUrl,
    handle: boundedString(value.handle, 300),
  };
};

const normalizeMove = (value: unknown): ChessMove | null => {
  if (!isRecord(value)) return null;

  const san = boundedString(value.san, 32);
  const url = httpsUrl(value.url);
  if (!san || !url) return null;

  return {
    san,
    url,
    published_at: boundedString(value.published_at, 100),
  };
};

const normalizeGame = (value: Record<string, unknown>): ChessGameDiscoveryItem | null => {
  const id = boundedString(value.id, 300);
  const title = boundedString(value.title, 250);
  const url = httpsUrl(value.url);
  const sourceHost = boundedString(value.source_host, 253);
  const arbiterHandle = boundedString(value.arbiter_handle, 300);

  if (!id || !title || !url || !sourceHost || !arbiterHandle) return null;

  const activeColor = value.active_color === 'white' || value.active_color === 'black'
    ? value.active_color
    : undefined;

  return {
    id,
    family: 'game',
    kind: 'chess_game',
    title,
    url,
    source_host: sourceHost,
    arbiter_handle: arbiterHandle,
    white: normalizePlayer(value.white),
    black: normalizePlayer(value.black),
    next_player: normalizePlayer(value.next_player),
    fen: boundedString(value.fen, 128),
    last_move: boundedString(value.last_move, 16),
    latest_move_url: httpsUrl(value.latest_move_url),
    board_image_url: httpsUrl(value.board_image_url),
    setup_note: boundedString(value.setup_note, 500),
    badge: boundedString(value.badge, 80),
    active_color: activeColor,
    turn: numberValue(value.turn),
    move_count: numberValue(value.move_count),
    published_at: boundedString(value.published_at, 100),
  };
};

const normalizeChallenger = (value: Record<string, unknown>): ChessChallengerDiscoveryItem | null => {
  const id = boundedString(value.id, 300);
  const title = boundedString(value.title, 150);
  const handle = boundedString(value.handle, 300);
  const actorUrl = httpsUrl(value.actor_url);
  const sourceHost = boundedString(value.source_host, 253);
  const arbiterHandle = boundedString(value.arbiter_handle, 300);

  if (!id || !title || !handle || !actorUrl || !sourceHost || !arbiterHandle) return null;

  return {
    id,
    family: 'game',
    kind: 'open_challenge',
    title,
    handle,
    actor_url: actorUrl,
    source_host: sourceHost,
    arbiter_handle: arbiterHandle,
  };
};

const normalizeReceivedGame = (value: Record<string, unknown>): ReceivedChessGameDiscoveryItem | null => {
  const id = boundedString(value.id, 300);
  const title = boundedString(value.title, 500);
  const url = httpsUrl(value.url);
  const latestMoveUrl = httpsUrl(value.latest_move_url);
  const sourceHost = boundedString(value.source_host, 253);
  const fen = boundedString(value.fen, 128);

  if (!id || !title || !url || !latestMoveUrl || !sourceHost || !fen) return null;

  const activeColor = value.active_color === 'white' || value.active_color === 'black'
    ? value.active_color
    : undefined;
  const participants = Array.isArray(value.participants)
    ? value.participants.map(normalizeParticipant).filter((item): item is ChessParticipant => item !== null).slice(0, 8)
    : [];
  const recentMoves = Array.isArray(value.recent_moves)
    ? value.recent_moves.map(normalizeMove).filter((item): item is ChessMove => item !== null).slice(0, 12)
    : [];
  const reportedStatus = value.reported_status === 'active'
    || value.reported_status === 'checkmate'
    || value.reported_status === 'draw'
    ? value.reported_status
    : undefined;

  return {
    id,
    family: 'game',
    kind: 'received_chess_game',
    title,
    url,
    latest_move_url: latestMoveUrl,
    source_host: sourceHost,
    fen,
    last_move: boundedString(value.last_move, 32),
    board_image_url: httpsUrl(value.board_image_url),
    content: boundedString(value.content, 500),
    active_color: activeColor,
    participants,
    white: normalizeParticipant(value.white) || undefined,
    black: normalizeParticipant(value.black) || undefined,
    fullmove_number: numberValue(value.fullmove_number),
    position_ply: numberValue(value.position_ply),
    loaded_move_count: numberValue(value.loaded_move_count),
    recent_moves: recentMoves.length > 0 ? recentMoves : undefined,
    reported_status: reportedStatus,
    published_at: boundedString(value.published_at, 100),
  };
};

const normalizeItem = (value: unknown): ChessDiscoveryItem | null => {
  if (!isRecord(value) || value.family !== 'game') return null;
  if (value.kind === 'chess_game') return normalizeGame(value);
  if (value.kind === 'open_challenge') return normalizeChallenger(value);
  if (value.kind === 'received_chess_game') return normalizeReceivedGame(value);
  return null;
};

const normalizeResponse = (value: unknown): ChessDiscoveryResponse => {
  if (!isRecord(value)) throw new Error('Invalid chess discovery response');

  const items = Array.isArray(value.items)
    ? value.items.map(rawItem => withNativeDiscoveryStatus(normalizeItem(rawItem), rawItem)).filter((item): item is ChessDiscoveryItem => item !== null)
    : [];
  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((provider): ChessDiscoveryProvider[] => {
      if (!isRecord(provider)) return [];

      const host = boundedString(provider.host, 253);
      const status = provider.status === 'ready' || provider.status === 'unavailable' ? provider.status : null;

      if (provider.type === 'local_chess' && host && status) {
        return [{
          type: 'local_chess',
          host,
          status,
        }];
      }

      const arbiterHandle = boundedString(provider.arbiter_handle, 300);

      return provider.type === 'castling' && host && arbiterHandle && status
        ? [{
          type: 'castling',
          host,
          url: httpsUrl(provider.url),
          arbiter_handle: arbiterHandle,
          status,
        }]
        : [];
    })
    : [];

  return { items, providers };
};

export const useChessDiscovery = (enabled: boolean) => {
  const api = useApi();
  const result = useQuery<ChessDiscoveryResponse>({
    queryKey: ['nativeDiscovery', api.baseUrl, 'game'],
    queryFn: async () => {
      const response = await api.get('/api/v1/discovery/native?family=game&limit=18');
      return normalizeResponse(await response.json());
    },
    enabled,
    staleTime: 10 * 60 * 1000,
    placeholderData: emptyResponse,
  });

  return { ...result, data: result.data || emptyResponse };
};

/* end of useChessDiscovery.ts */
