/*
 * Unfathomably chess discovery panel
 * -----------------------------------
 *
 * File: chess-discovery-panel.tsx
 *
 * Purpose:
 *   Turn Castling federation into a useful Games workflow in Worlds.
 *
 * Responsibilities:
 *   - load public challengers and recent games when the Games workflow opens
 *   - render validated FEN positions and move context
 *   - prepare human-reviewable public challenge posts
 *   - link back to the authoritative game and local move resolution
 *
 * This file intentionally does not send a challenge without confirmation,
 * claim Unfathomably is the chess arbiter, or modify a remote game.
 */

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import WorldObjectStateControl from '@/components/world-object-state-control.tsx';
import NativeDiscoveryLoading from '@/features/native-federation/native-discovery-loading.tsx';
import NativeDiscoveryState from '@/features/native-federation/native-discovery-state.tsx';
import { openComposeWithText } from '@/actions/compose.ts';
import { useChessDiscovery } from '@/api/hooks/discovery/useChessDiscovery.ts';
import ChessPosition from '@/components/chess-position.tsx';
import Button from '@/components/ui/button.tsx';
import Input from '@/components/ui/input.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';

import type {
  ChessCastlingDiscoveryProvider,
  ChessDiscoveryProvider,
  ChessGameDiscoveryItem,
  ReceivedChessGameDiscoveryItem,
} from '@/api/hooks/discovery/useChessDiscovery.ts';
import NativeDiscoveryArticle from './native-discovery-article.tsx';
import type { PresentationFamily } from './presentation-family.ts';

interface ChessDiscoveryPanelProps {
  enabled: boolean;
  family: PresentationFamily;
}

const normalizeOpponent = (value: string): string | null => {
  const candidate = value.trim().startsWith('@') ? value.trim() : `@${value.trim()}`;
  if (candidate.length > 300 || /\s/.test(candidate)) return null;

  const separator = candidate.lastIndexOf('@');
  if (separator <= 1 || separator === candidate.length - 1) return null;

  const username = candidate.slice(1, separator);
  const host = candidate.slice(separator + 1);
  if (username.includes('@') || host.includes('..')) return null;
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?$/.test(host)) return null;

  return `@${username}@${host.toLowerCase()}`;
};

const playerName = (game: ChessGameDiscoveryItem, color: 'white' | 'black') => {
  const player = game[color];
  return player?.handle || (player ? `@${player.username.replace(/^@/, '')}` : color);
};

const PlayerReference: React.FC<{ game: ChessGameDiscoveryItem; color: 'white' | 'black' }> = ({ game, color }) => {
  const player = game[color];
  const label = playerName(game, color);

  return player?.actor_url ? (
    <Link className='hover:underline' to={`/search?q=${encodeURIComponent(player.actor_url)}`}>{label}</Link>
  ) : <>{label}</>;
};

const isCastlingProvider = (
  provider: ChessDiscoveryProvider,
): provider is ChessCastlingDiscoveryProvider => provider.type === 'castling';

const ReceivedGameCard: React.FC<{ game: ReceivedChessGameDiscoveryItem }> = ({ game }) => (
  <NativeDiscoveryArticle item={game} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
    <div className='border-b border-gray-200 black:border-gray-800 bg-primary-50 black:bg-primary-950 p-3 dark:border-gray-700 dark:bg-primary-950'>
      <ChessPosition fen={game.fen} lastMove={game.last_move} />
    </div>
    <div className='pt-4'>
      <h4 className='font-black text-gray-950 black:text-white dark:text-white'>{game.title}</h4>
      <p className='mt-1 text-xs font-bold uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300'>
        {[
          game.last_move ? `last move ${game.last_move}` : null,
          game.active_color ? `${game.active_color} to move` : null,
          game.source_host,
        ].filter(Boolean).join(' / ')}
      </p>
      {game.content && <p className='mt-3 line-clamp-3 text-sm text-gray-700 black:text-gray-200 dark:text-gray-200'>{game.content}</p>}
      <ChessPositionDetails item={game} />
      <WorldObjectStateControl
        family='games'
        objectUri={game.latest_move_url}
        presentation={{ source_host: game.source_host, title: game.title, url: game.url }}
      />
      {game.participants.length > 0 && (
        <div className='mt-3 flex flex-wrap gap-2'>
          {game.participants.map(participant => (
            <Link
              key={participant.actor_url}
              to={`/search?q=${encodeURIComponent(participant.actor_url)}`}
              className='rounded-full border border-primary-300 black:border-primary-700 px-2.5 py-1 text-xs font-bold text-primary-800 black:text-primary-200 hover:bg-primary-50 black:hover:bg-primary-900 dark:border-primary-600 dark:text-primary-200 dark:hover:bg-primary-700'
            >
              {participant.handle || new URL(participant.actor_url).host}
            </Link>
          ))}
        </div>
      )}
      <div className='mt-4 flex flex-wrap gap-2'>
        <a href={game.url} target='_blank' rel='noopener noreferrer' className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
          <FormattedMessage id='native_discovery.games.open_game' defaultMessage='Open game' />
        </a>
        <Link to={`/search?q=${encodeURIComponent(game.latest_move_url)}`} className='rounded-lg border border-primary-300 black:border-primary-700 px-3 py-2 text-sm font-black text-primary-800 black:text-primary-200 hover:bg-primary-50 black:hover:bg-primary-900 dark:border-primary-600 dark:text-primary-200 dark:hover:bg-primary-700'>
          <FormattedMessage id='native_discovery.games.open_move_here' defaultMessage='Open latest move here' />
        </Link>
      </div>
    </div>
  </NativeDiscoveryArticle>
);

const ChessDiscoveryPanel: React.FC<ChessDiscoveryPanelProps> = ({ enabled, family }) => {
  const dispatch = useAppDispatch();
  const [opponent, setOpponent] = useState('');
  const visible = enabled && family === 'games';
  const result = useChessDiscovery(visible);
  const games = result.data.items.filter((item): item is ChessGameDiscoveryItem => item.kind === 'chess_game');
  const receivedGames = result.data.items.filter((item): item is ReceivedChessGameDiscoveryItem => item.kind === 'received_chess_game');
  const challengers = result.data.items.filter(item => item.kind === 'open_challenge');
  const configuredProvider = result.data.providers.find(isCastlingProvider);
  const readyProvider = configuredProvider?.status === 'ready' ? configuredProvider : undefined;
  const normalizedOpponent = normalizeOpponent(opponent);

  if (!visible) return null;

  const prepareArbiterPost = (text: string) => {
    dispatch(openComposeWithText('compose-modal', text));
  };

  const challenge = (arbiterHandle: string, opponentHandle: string) => {
    prepareArbiterPost(`${arbiterHandle} I challenge ${opponentHandle}`);
  };

  return (
    <section className='border-b border-gray-200 bg-white black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900'>
      <div className='border-b border-gray-200 black:border-gray-800 px-4 py-4 dark:border-gray-800 sm:px-5'>
        <div className='flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between'>
          <div>
            <h2 className='text-lg font-black text-gray-950 black:text-white dark:text-white'>
              <FormattedMessage id='native_discovery.games.title' defaultMessage='Chess' />
            </h2>
            <p className='mt-1 max-w-3xl text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
              <FormattedMessage
                id='native_discovery.games.description'
                defaultMessage='Find players, challenges, and recent games.'
              />
            </p>
          </div>
          {readyProvider && <p className='mt-2 text-xs font-bold uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300 sm:mt-0'>{readyProvider.host}</p>}
        </div>

        <form
          className='mt-4 flex flex-col gap-2 sm:flex-row'
          onSubmit={(event) => {
            event.preventDefault();
            if (readyProvider && normalizedOpponent) challenge(readyProvider.arbiter_handle, normalizedOpponent);
          }}
        >
          <label className='sr-only' htmlFor='native-chess-opponent'>
            <FormattedMessage id='native_discovery.games.opponent_label' defaultMessage='Opponent fediverse handle' />
          </label>
          <Input
            id='native-chess-opponent'
            type='text'
            value={opponent}
            maxLength={300}
            className='min-w-0 flex-1'
            disabled={!readyProvider}
            placeholder='@player@example.org'
            onChange={event => setOpponent(event.target.value)}
          />
          <Button type='submit' theme='primary' disabled={!readyProvider || !normalizedOpponent}>
            <FormattedMessage id='native_discovery.games.prepare_challenge' defaultMessage='Prepare challenge' />
          </Button>
        </form>
        {!configuredProvider && result.isFetching && (
          <p className='mt-2 text-xs text-gray-600 black:text-gray-300 dark:text-gray-300' role='status'>
            <FormattedMessage id='native_discovery.games.checking_provider' defaultMessage='Checking whether the challenge service is available...' />
          </p>
        )}
        {!configuredProvider && !result.isFetching && !result.isError && (
          <p className='mt-2 text-xs text-gray-600 black:text-gray-300 dark:text-gray-300'>
            <FormattedMessage id='native_discovery.games.provider_required' defaultMessage='A compatible chess service must be available before a challenge can be prepared.' />
          </p>
        )}
        {readyProvider && (
          <div className='mt-3 rounded-xl border border-primary-200 black:border-primary-800 bg-primary-50 black:bg-primary-950 p-3 dark:border-primary-800 dark:bg-primary-950/30'>
            <p className='text-sm text-gray-700 black:text-gray-200 dark:text-gray-200'>
              <FormattedMessage id='native_discovery.games.challenge_notice' defaultMessage='Castling learns that you are available through an ordinary post. Every action opens the composer first so you can review or cancel it.' />
            </p>
            <div className='mt-3 flex flex-wrap gap-2'>
              <Button type='button' theme='secondary' onClick={() => prepareArbiterPost(`${readyProvider.arbiter_handle} I'm open for challenges!`)}>
                <FormattedMessage id='native_discovery.games.join_board' defaultMessage='Join challenge board' />
              </Button>
              <Button type='button' theme='tertiary' onClick={() => prepareArbiterPost(`${readyProvider.arbiter_handle} Remove me from the challenge board`)}>
                <FormattedMessage id='native_discovery.games.leave_board' defaultMessage='Leave challenge board' />
              </Button>
              <Button theme='tertiary' to={`/search?q=${encodeURIComponent(readyProvider.arbiter_handle)}`}>
                <FormattedMessage id='native_discovery.games.open_arbiter' defaultMessage='Open arbiter here' />
              </Button>
            </div>
          </div>
        )}
      </div>

      {result.isFetching && result.data.items.length === 0 ? (
        <NativeDiscoveryLoading />
      ) : result.isError ? (
        <div className='px-5 py-8 text-center'>
          <p className='text-sm text-red-700 dark:text-red-300'>
            <FormattedMessage id='native_discovery.games.error' defaultMessage='Chess discovery is temporarily unavailable. No challenge was sent.' />
          </p>
          <Button type='button' theme='tertiary' className='mt-3' onClick={() => result.refetch()}>
            <FormattedMessage id='native_discovery.retry' defaultMessage='Try again' />
          </Button>
        </div>
      ) : !configuredProvider && receivedGames.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.games.no_sources' defaultMessage='No chess games have reached your server yet.' />
        </NativeDiscoveryState>
      ) : readyProvider && receivedGames.length === 0 && games.length === 0 && challengers.length === 0 ? (
        <NativeDiscoveryState>
          <FormattedMessage id='native_discovery.games.empty' defaultMessage='No current challengers or recent games were found.' />
        </NativeDiscoveryState>
      ) : (
        <div className='space-y-6 p-4 sm:p-5'>
          {receivedGames.length > 0 && (
            <div>
              <h3 className='text-sm font-black uppercase tracking-wide text-gray-700 black:text-gray-200 dark:text-gray-200'>
                <FormattedMessage id='native_discovery.games.received' defaultMessage='Games received here' />
              </h3>
              <p className='mt-1 text-sm text-gray-600 black:text-gray-300 dark:text-gray-300'>
                <FormattedMessage id='native_discovery.games.received_description' defaultMessage='Latest public positions already delivered to this server, grouped by game.' />
              </p>
              <div className='mt-3 grid gap-4 lg:grid-cols-2'>
                {receivedGames.map(game => <ReceivedGameCard key={game.id} game={game} />)}
              </div>
            </div>
          )}

          {configuredProvider?.status === 'unavailable' && (
            <div className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 black:border-red-900 black:bg-red-950 black:text-red-200 dark:border-red-900 dark:bg-red-950 dark:text-red-200'>
              <FormattedMessage id='native_discovery.games.provider_unavailable' defaultMessage='The configured Castling service is temporarily unavailable. Locally received games remain available above.' />
              <button type='button' className='ml-2 font-black underline' onClick={() => result.refetch()}>
                <FormattedMessage id='native_discovery.retry' defaultMessage='Try again' />
              </button>
            </div>
          )}

          {challengers.length > 0 && (
            <div>
              <h3 className='text-sm font-black uppercase tracking-wide text-gray-700 black:text-gray-200 dark:text-gray-200'>
                <FormattedMessage id='native_discovery.games.open_challengers' defaultMessage='Open for a challenge' />
              </h3>
              <div className='mt-3 flex flex-wrap gap-2'>
                {challengers.map(challenger => (
                  <div key={challenger.id} className='inline-flex overflow-hidden rounded-full border border-primary-300 black:border-primary-700 bg-primary-50 black:bg-primary-950 dark:border-primary-700 dark:bg-primary-800'>
                    <button
                      type='button'
                      className='px-3 py-2 text-sm font-bold text-primary-800 black:text-primary-200 hover:bg-primary-100 black:hover:bg-primary-800 dark:text-primary-100 dark:hover:bg-primary-700'
                      onClick={() => challenge(challenger.arbiter_handle, challenger.handle)}
                    >
                      Challenge {challenger.handle}
                    </button>
                    <Link
                      aria-label={`Open ${challenger.handle} here`}
                      className='border-l border-primary-300 black:border-primary-700 px-3 py-2 text-sm font-black text-primary-800 black:text-primary-200 hover:bg-primary-100 black:hover:bg-primary-800 dark:border-primary-700 dark:text-primary-100 dark:hover:bg-primary-700'
                      to={`/search?q=${encodeURIComponent(challenger.actor_url)}`}
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {games.length > 0 && (
            <div>
              <h3 className='text-sm font-black uppercase tracking-wide text-gray-700 black:text-gray-200 dark:text-gray-200'>
                <FormattedMessage id='native_discovery.games.recent' defaultMessage='Recent games' />
              </h3>
              <div className='mt-3 grid gap-4 lg:grid-cols-2'>
                {games.map(game => (
                  <NativeDiscoveryArticle item={game} key={game.id} className='bg-white black:bg-black dark:bg-primary-900 px-5 py-4'>
                    {game.fen && (
                      <div className='border-b border-gray-200 black:border-gray-800 bg-primary-50 black:bg-primary-950 p-3 dark:border-gray-700 dark:bg-primary-950'>
                        <ChessPosition fen={game.fen} lastMove={game.last_move} />
                      </div>
                    )}
                    <div className='pt-4'>
                      <h4 className='font-black text-gray-950 black:text-white dark:text-white'><PlayerReference game={game} color='white' /> vs. <PlayerReference game={game} color='black' /></h4>
                      <p className='mt-1 text-xs font-bold uppercase tracking-wide text-primary-700 black:text-primary-300 dark:text-primary-300'>
                        {[
                          game.turn !== undefined ? `turn ${game.turn}` : null,
                          game.last_move ? `last move ${game.last_move}` : null,
                          game.active_color ? `${game.active_color} to move` : null,
                        ].filter(Boolean).join(' / ')}
                      </p>
                      {game.setup_note && <p className='mt-3 line-clamp-3 text-sm text-gray-700 black:text-gray-200 dark:text-gray-200'>{game.setup_note}</p>}
                      <ChessPositionDetails item={game} />
                      <WorldObjectStateControl
                        family='games'
                        objectUri={game.url}
                        presentation={{ title: `${playerName(game, 'white')} vs. ${playerName(game, 'black')}`, url: game.url }}
                      />
                      <div className='mt-4 flex flex-wrap gap-2'>
                        <a href={game.url} target='_blank' rel='noopener noreferrer' className='rounded-lg bg-primary-600 px-3 py-2 text-sm font-black text-white hover:bg-primary-500'>
                          <FormattedMessage id='native_discovery.games.open_game' defaultMessage='Open game' />
                        </a>
                        {game.latest_move_url && (
                          <Link to={`/search?q=${encodeURIComponent(game.latest_move_url)}`} className='rounded-lg border border-primary-300 black:border-primary-700 px-3 py-2 text-sm font-black text-primary-800 black:text-primary-200 hover:bg-primary-50 black:hover:bg-primary-900 dark:border-primary-600 dark:text-primary-200 dark:hover:bg-primary-700'>
                            <FormattedMessage id='native_discovery.games.open_move_here' defaultMessage='Open latest move here' />
                          </Link>
                        )}
                      </div>
                    </div>
                  </NativeDiscoveryArticle>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

interface ChessPositionDetailsItem {
  kind: 'chess_game' | 'received_chess_game';
  url: string;
  latest_move_url?: string;
  move_count?: number;
  position_ply?: number;
  fullmove_number?: number;
  loaded_move_count?: number;
  reported_status?: 'active' | 'checkmate' | 'draw';
  recent_moves?: Array<{
    san: string;
    url: string;
  }>;
}

const ChessPositionDetails = ({ item }: { item: ChessPositionDetailsItem }) => {
  const positionCount = item.position_ply ?? item.move_count;
  const pgnUrl = item.kind === 'chess_game'
    ? `${item.url}${item.url.includes('?') ? '&' : '?'}pgn`
    : undefined;
  const status = item.reported_status === 'checkmate'
    ? 'Checkmate reported by the game service'
    : item.reported_status === 'draw'
      ? 'Draw reported by the game service'
      : item.reported_status === 'active'
        ? 'Game in progress'
        : undefined;

  return (
    <div className='mt-3 space-y-2 rounded-lg bg-primary-50 black:bg-primary-950 p-3 text-sm text-gray-900 black:text-white dark:bg-primary-900/30 dark:text-gray-100'>
      <div className='flex flex-wrap gap-x-4 gap-y-1'>
        {status ? <span className='font-bold'>{status}</span> : null}
        {positionCount !== undefined ? (
          <span>{positionCount} {positionCount === 1 ? 'ply' : 'plies'} in the current position</span>
        ) : null}
        {item.fullmove_number !== undefined ? <span>Move {item.fullmove_number}</span> : null}
        {item.loaded_move_count !== undefined ? <span>{item.loaded_move_count} locally known moves</span> : null}
      </div>

      {item.recent_moves?.length ? (
        <div>
          <div className='mb-1 font-bold'>Recent locally known moves</div>
          <div className='flex flex-wrap gap-1.5'>
            {item.recent_moves.map((move, index) => (
              <Link
                className='rounded bg-white black:bg-black px-2 py-1 font-mono text-primary-700 black:text-primary-300 hover:underline dark:bg-primary-900 dark:text-primary-300'
                key={`${move.url}-${index}`}
                to={`/search?q=${encodeURIComponent(move.url)}`}
              >
                {move.san}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className='flex flex-wrap gap-3'>
        {item.kind === 'received_chess_game' && item.latest_move_url ? (
          <Link
            className='font-bold text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300'
            to={`/search?q=${encodeURIComponent(item.latest_move_url)}`}
          >
            Open latest move to reply with SAN
          </Link>
        ) : null}
        {pgnUrl ? (
          <a
            className='font-bold text-primary-700 black:text-primary-300 hover:underline dark:text-primary-300'
            href={pgnUrl}
            rel='noopener noreferrer'
            target='_blank'
          >
            Download authoritative PGN
          </a>
        ) : null}
      </div>
    </div>
  );
};

export default ChessDiscoveryPanel;

/* end of chess-discovery-panel.tsx */
