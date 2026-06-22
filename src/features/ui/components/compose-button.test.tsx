import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MODAL_CLOSE, MODAL_OPEN } from '@/actions/modals.ts';
import { mockStore, render, rootState } from '@/jest/test-helpers.tsx';

import ComposeButton from './compose-button.tsx';

const renderComposeButton = () => {
  const store = mockStore(rootState);
  render(<ComposeButton />, undefined, store);
  return store;
};

describe('<ComposeButton />', () => {
  it('renders a button element', () => {
    renderComposeButton();

    expect(screen.getByRole('button')).toHaveTextContent('Compose');
  });

  it('dispatches the MODAL_OPEN action', () => {
    const store = renderComposeButton();

    store.clearActions();
    expect(store.getActions().length).toEqual(0);
    fireEvent.click(screen.getByRole('button'));
    expect(store.getActions()[0].type).toEqual(MODAL_CLOSE);
    expect(store.getActions()[1].type).toEqual(MODAL_OPEN);
  });
});
