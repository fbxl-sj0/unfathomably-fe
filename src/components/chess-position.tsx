/*
  Unfathomably native chess presentation
  ---------------------------------------

  File: src/components/chess-position.tsx

  Purpose:

    Turn a bounded Forsyth-Edwards Notation position into an understandable,
    accessible chess board for Castling-compatible activities.

  Responsibilities:

    * validate the board and active-color portions of FEN
    * render all 64 squares without executing or fetching notation
    * provide piece and coordinate labels for assistive technology

  This file intentionally does NOT contain a chess engine, move validation,
  clocks, matchmaking, or remote game mutation.
*/

import React from 'react';

type PieceCode = 'b' | 'B' | 'k' | 'K' | 'n' | 'N' | 'p' | 'P' | 'q' | 'Q' | 'r' | 'R';

interface ParsedFen {
  activeColor: 'black' | 'white';
  board: Array<PieceCode | null>;
}

interface ChessPositionProps {
  fen: string;
  lastMove?: string | null;
}

const pieceGlyphs: Record<PieceCode, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

const pieceNames: Record<PieceCode, string> = {
  K: 'white king', Q: 'white queen', R: 'white rook', B: 'white bishop', N: 'white knight', P: 'white pawn',
  k: 'black king', q: 'black queen', r: 'black rook', b: 'black bishop', n: 'black knight', p: 'black pawn',
};

const pieceCodes = new Set(Object.keys(pieceGlyphs));
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const parseFen = (fen: string): ParsedFen | null => {
  if (typeof fen !== 'string' || fen.length === 0 || fen.length > 256) return null;

  const [position, active = 'w'] = fen.trim().split(/\s+/, 3);
  const ranks = position?.split('/');

  if (ranks?.length !== 8 || !['w', 'b'].includes(active)) return null;

  const board: Array<PieceCode | null> = [];

  for (const rank of ranks) {
    let squares = 0;

    for (const token of rank) {
      if (/^[1-8]$/.test(token)) {
        const emptySquares = Number(token);
        board.push(...Array<null>(emptySquares).fill(null));
        squares += emptySquares;
      } else if (pieceCodes.has(token)) {
        board.push(token as PieceCode);
        squares += 1;
      } else {
        return null;
      }
    }

    if (squares !== 8) return null;
  }

  if (board.length !== 64) return null;

  return { activeColor: active === 'w' ? 'white' : 'black', board };
};

const ChessPosition: React.FC<ChessPositionProps> = ({ fen, lastMove }) => {
  const parsed = parseFen(fen);

  if (!parsed) return null;

  return (
    <figure className='mx-auto w-full max-w-sm' aria-label={`Chess position, ${parsed.activeColor} to move`}>
      <div className='grid aspect-square grid-cols-8 overflow-hidden rounded-md border border-gray-300 shadow-sm dark:border-gray-600'>
        {parsed.board.map((piece, index) => {
          const rankIndex = Math.floor(index / 8);
          const fileIndex = index % 8;
          const rank = 8 - rankIndex;
          const square = `${files[fileIndex]}${rank}`;
          const light = (rankIndex + fileIndex) % 2 === 0;

          return (
            <div
              className={`relative flex aspect-square items-center justify-center text-[clamp(1.35rem,7vw,2.6rem)] leading-none ${light ? 'bg-gray-100 text-gray-900 dark:bg-gray-300' : 'bg-primary-600 text-white dark:bg-primary-700'}`}
              key={square}
              aria-label={`${square}: ${piece ? pieceNames[piece] : 'empty'}`}
            >
              {piece ? <span aria-hidden='true' className='drop-shadow-sm'>{pieceGlyphs[piece]}</span> : null}
              {fileIndex === 0 ? <span aria-hidden='true' className='absolute left-0.5 top-0.5 text-[9px] font-semibold opacity-70'>{rank}</span> : null}
              {rankIndex === 7 ? <span aria-hidden='true' className='absolute bottom-0 right-0.5 text-[9px] font-semibold opacity-70'>{files[fileIndex]}</span> : null}
            </div>
          );
        })}
      </div>
      <figcaption className='mt-2 flex flex-wrap justify-between gap-2 text-xs text-gray-600 dark:text-gray-300'>
        <span>{parsed.activeColor === 'white' ? 'White' : 'Black'} to move</span>
        {lastMove ? <span>Move: {lastMove}</span> : null}
      </figcaption>
    </figure>
  );
};

export { parseFen };
export default ChessPosition;

/* end of src/components/chess-position.tsx */
