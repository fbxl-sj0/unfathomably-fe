/*
  Project: Unfathomably Frontend Test Suite
  -----------------------------------------

  File: src/components/native-status-context.test.tsx

  Purpose:

    Prove extension status metadata becomes useful UI without inventing remote
    controls.

  Responsibilities:

    * render BookWyrm rating and book context
    * render Wanderer route and GPX context
    * render the backend-approved native object link
    * ignore resource metadata on the status surface

  This file intentionally does NOT contain:

    * network requests
    * status visibility tests
    * remote mutation tests
*/

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';

import NativeStatusContext from './native-status-context.tsx';

describe('NativeStatusContext', () => {
  it('renders bounded BookWyrm context and the approved open control', () => {
    renderContext({
      canonical_id: 'https://books.example.test/reviews/1',
      class: 'status',
      context: 'https://books.example.test/reviews/1',
      controls: ['open'],
      fields: {
        in_reply_to_book: 'https://books.example.test/books/1',
        rating: 4.5,
        reading_status: 'read',
      },
      type: 'Review',
    });

    expect(screen.getByText('BookWyrm Review')).toBeInTheDocument();
    expect(screen.getByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('read')).toBeInTheDocument();
    expect(screen.getByText('books.example.test/books/1')).toHaveAttribute('href', 'https://books.example.test/books/1');
    expect(screen.getByText('Open native object')).toHaveAttribute('href', 'https://books.example.test/reviews/1');
  });

  it('does not place resources on the status context surface', () => {
    renderContext({
      canonical_id: 'https://books.example.test/books/1',
      class: 'resource',
      context: null,
      controls: ['open'],
      fields: {},
      type: 'Edition',
    });

    expect(screen.queryByTestId('native-status-context')).not.toBeInTheDocument();
  });

  it('renders NeoDB rating and catalog context without inventing controls', () => {
    renderContext({
      canonical_id: 'https://neodb.example.test/@reviewer/posts/1',
      class: 'status',
      context: 'https://neodb.example.test/@reviewer/posts/1',
      controls: ['open'],
      fields: {
        catalog_item: 'https://neodb.example.test/movie/1',
        catalog_type: 'Movie',
        platform: 'neodb',
        rating: 7,
        rating_best: 10,
        reading_status: 'complete',
      },
      type: 'Article',
    });

    expect(screen.getByText('NeoDB Article')).toBeInTheDocument();
    expect(screen.getByText('7/10')).toBeInTheDocument();
    expect(screen.getByText('complete')).toBeInTheDocument();
    expect(screen.getByText('Movie')).toBeInTheDocument();
    expect(screen.getByText('neodb.example.test/movie/1')).toHaveAttribute('href', 'https://neodb.example.test/movie/1');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders Wanderer route context without inventing route mutations', () => {
    renderContext({
      canonical_id: 'https://wanderer.example.test/api/v1/trail/1',
      class: 'status',
      context: null,
      controls: ['open'],
      fields: {
        category: 'Hiking',
        difficulty: 'hard',
        distance: '12450.000000m',
        elevation_gain: '890.000000m',
        gpx_url: 'https://wanderer.example.test/files/trail.gpx',
        location: 'Alien Escarpment',
        platform: 'wanderer',
        route_kind: 'trail',
        start_time: '2026-07-17T08:00:00Z',
      },
      type: 'Note',
    });

    expect(screen.getByText('Wanderer Trail')).toBeInTheDocument();
    expect(screen.getByText('Hiking')).toBeInTheDocument();
    expect(screen.getByText('hard')).toBeInTheDocument();
    expect(screen.getByText('12450.000000m')).toBeInTheDocument();
    expect(screen.getByText('890.000000m')).toBeInTheDocument();
    expect(screen.getByText('Alien Escarpment')).toBeInTheDocument();
    expect(screen.getByText('wanderer.example.test/files/trail.gpx')).toHaveAttribute(
      'href',
      'https://wanderer.example.test/files/trail.gpx',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders bounded Flohmarkt listing context', () => {
    renderContext({
      canonical_id: 'https://market.example.test/alice/items/42',
      class: 'status',
      context: null,
      controls: ['open'],
      fields: {
        currency: 'CAD',
        latitude: 43.6532,
        listing_name: 'Alien radio',
        longitude: -79.3832,
        platform: 'flohmarkt',
        price: '25.00',
      },
      type: 'Note',
    });

    expect(screen.getByText('Flohmarkt listing')).toBeInTheDocument();
    expect(screen.getByText('Alien radio')).toBeInTheDocument();
    expect(screen.getByText('25.00 CAD')).toBeInTheDocument();
    expect(screen.getByText('43.6532, -79.3832')).toBeInTheDocument();
    expect(screen.getByText('Open native object')).toHaveAttribute('href', 'https://market.example.test/alice/items/42');
  });

  it('renders bounded Castling.club game context', () => {
    renderContext({
      canonical_id: 'https://castling.example.test/objects/22222222-2222-4222-8222-222222222222',
      class: 'status',
      context: null,
      controls: ['open'],
      fields: {
        fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
        game: 'https://castling.example.test/games/11111111-1111-4111-8111-111111111111',
        platform: 'castling',
        san: 'e4',
      },
      type: 'Note',
    });

    expect(screen.getByText('Castling.club game')).toBeInTheDocument();
    expect(screen.getByText('e4')).toBeInTheDocument();
    expect(screen.getByText('rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2')).toBeInTheDocument();
    expect(screen.getByText('castling.example.test/games/11111111-1111-4111-8111-111111111111')).toHaveAttribute(
      'href',
      'https://castling.example.test/games/11111111-1111-4111-8111-111111111111',
    );
  });

  it('renders bounded Bonfire ValueFlows context without mutation controls', () => {
    renderContext({
      canonical_id: 'https://bonfire.example.test/pub/objects/event-1',
      class: 'status',
      context: null,
      controls: ['open'],
      fields: {
        action: 'transfer',
        has_point_in_time: '2026-07-18T12:00:00Z',
        platform: 'bonfire_valueflows',
        provider: 'https://bonfire.example.test/pub/actors/alice',
        receiver: 'https://remote.example.test/pub/actors/bob',
        resource_inventoried_as: 'https://bonfire.example.test/pub/objects/radio',
        resource_quantity: 3,
        resource_quantity_unit: 'https://units.example.test/items/radio',
        valueflows_type: 'EconomicEvent',
      },
      type: 'ValueFlows:EconomicEvent',
    });

    expect(screen.getByText('Bonfire ValueFlows EconomicEvent')).toBeInTheDocument();
    expect(screen.getByText('transfer')).toBeInTheDocument();
    expect(screen.getByText('3 https://units.example.test/items/radio')).toBeInTheDocument();
    expect(screen.getByText('bonfire.example.test/pub/actors/alice')).toHaveAttribute(
      'href',
      'https://bonfire.example.test/pub/actors/alice',
    );
    expect(screen.getByText('remote.example.test/pub/actors/bob')).toHaveAttribute(
      'href',
      'https://remote.example.test/pub/actors/bob',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders ZenPub publishing metadata and only bounded links', () => {
    renderContext({
      canonical_id: 'https://zenpub.example.test/pub/objects/resource-1',
      class: 'status',
      context: 'https://zenpub.example.test/pub/actors/library',
      controls: ['open'],
      fields: {
        author: 'Alien Federation Working Group',
        language: 'en',
        level: 'intermediate',
        license: 'CC-BY-SA-4.0',
        platform: 'zenpub',
        resource_url: 'https://zenpub.example.test/uploads/resource-1.pdf',
        subject: 'ActivityPub interoperability',
      },
      type: 'Document',
    });

    expect(screen.getByText('ZenPub publishing resource')).toBeInTheDocument();
    expect(screen.getByText('Alien Federation Working Group')).toBeInTheDocument();
    expect(screen.getByText('ActivityPub interoperability')).toBeInTheDocument();
    expect(screen.getByText('CC-BY-SA-4.0')).toBeInTheDocument();
    expect(screen.getByText('zenpub.example.test/uploads/resource-1.pdf')).toHaveAttribute(
      'href',
      'https://zenpub.example.test/uploads/resource-1.pdf',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

function renderContext(native: unknown) {
  return render(
    <IntlProvider locale='en'>
      <NativeStatusContext native={native} />
    </IntlProvider>,
  );
}

/* end of src/components/native-status-context.test.tsx */
