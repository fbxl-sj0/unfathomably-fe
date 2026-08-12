/*
  Unfathomably native chess presentation tests
  ---------------------------------------------

  File: src/components/chess-position.test.tsx

  Purpose:

    Protect bounded FEN parsing and useful board rendering.

  This file intentionally does NOT test chess-engine behavior.
*/

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ChessPosition, { parseFen } from './chess-position.tsx';

describe('ChessPosition', () => {
  it('parses and renders a valid position with all squares', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    expect(parseFen(fen)?.board).toHaveLength(64);
    render(<ChessPosition fen={fen} lastMove='e4' />);

    expect(screen.getByLabelText('Chess position, white to move')).toBeInTheDocument();
    expect(screen.getByLabelText('e1: white king')).toBeInTheDocument();
    expect(screen.getByText('Move: e4')).toBeInTheDocument();
  });

  it('rejects malformed or expanded ranks', () => {
    expect(parseFen('8/8/8/8/8/8/8/9 w')).toBeNull();
    expect(parseFen('8/8/8/8/8/8/8 w')).toBeNull();
  });
});

/* end of src/components/chess-position.test.tsx */
