/*
  Unfathomably FE
  ----------------

  File: native-catalog-lookup.tsx

  Purpose:
    Help a user seed a Worlds draft from an approved metadata catalog.

  Responsibilities:
    - submit bounded, intentional catalog searches through the local backend
    - present provider-labelled candidates and useful empty/error states
    - copy a selected candidate into the editable composer draft

  This file intentionally does not call third-party services from the browser,
  publish objects, import remote artwork, or hide metadata provenance.
*/

import React, { useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import Button from '@/components/ui/button.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Input from '@/components/ui/input.tsx';
import Select from '@/components/ui/select.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useApi } from '@/hooks/useApi.ts';

interface CatalogCandidate {
  federatable?: boolean;
  id: string;
  provider: string;
  provider_label: string;
  reference_url?: string;
  source_url: string;
  subtitle: string;
  title: string;
  fields: Record<string, string>;
}

interface NativeCatalogLookupProps {
  template: string;
  onApply: (candidate: CatalogCandidate) => void;
}

const messages = defineMessages({
  apply: { id: 'worlds.catalog.apply', defaultMessage: 'Use this {item}' },
  empty: { id: 'worlds.catalog.empty', defaultMessage: 'No matching {items} were found. You can still enter the details yourself.' },
  error: { id: 'worlds.catalog.error', defaultMessage: 'The {catalog} catalog could not be reached. Your draft is safe, and you can keep entering it manually.' },
  imported: { id: 'worlds.catalog.imported', defaultMessage: 'Draft details imported from {provider}. Review and change anything before publishing.' },
  federated: { id: 'worlds.catalog.federated', defaultMessage: 'Federated edition' },
  metadata: { id: 'worlds.catalog.metadata', defaultMessage: 'Metadata only' },
  metadataHint: { id: 'worlds.catalog.metadata_hint', defaultMessage: 'Metadata copied from {provider}. Choose a federated BookWyrm edition before publishing a review.' },
  label: { id: 'worlds.catalog.label', defaultMessage: 'Find {items}' },
  placeholder: { id: 'worlds.catalog.placeholder', defaultMessage: '{placeholder}' },
  search: { id: 'worlds.catalog.search', defaultMessage: 'Search {items}' },
  searching: { id: 'worlds.catalog.searching', defaultMessage: 'Searching...' },
  source: { id: 'worlds.catalog.source', defaultMessage: 'View source' },
});

const catalogDefinitions: Record<string, {
  catalog: string;
  item: string;
  items: string;
  placeholder: string;
}> = {
  audio: {
    catalog: 'MusicBrainz',
    item: 'recording',
    items: 'recordings',
    placeholder: 'Track title or artist',
  },
  books: {
    catalog: 'BookWyrm and Open Library',
    item: 'book',
    items: 'books',
    placeholder: 'Title, author, or ISBN',
  },
  culture: {
    catalog: 'NeoDB',
    item: 'catalog item',
    items: 'catalog items',
    placeholder: 'Title, creator, or keyword',
  },
};

const cultureCategories = [
  { label: 'Film', value: 'film' },
  { label: 'TV series', value: 'series' },
  { label: 'Album', value: 'album' },
  { label: 'Podcast', value: 'podcast' },
  { label: 'Game', value: 'game' },
];

const isCandidate = (value: unknown): value is CatalogCandidate => {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<CatalogCandidate>;

  return typeof candidate.id === 'string'
    && typeof candidate.provider === 'string'
    && typeof candidate.provider_label === 'string'
    && (candidate.federatable === undefined || typeof candidate.federatable === 'boolean')
    && (candidate.reference_url === undefined || typeof candidate.reference_url === 'string')
    && typeof candidate.source_url === 'string'
    && typeof candidate.subtitle === 'string'
    && typeof candidate.title === 'string'
    && !!candidate.fields
    && typeof candidate.fields === 'object';
};

const NativeCatalogLookup: React.FC<NativeCatalogLookupProps> = ({ template, onApply }) => {
  const api = useApi();
  const intl = useIntl();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogCandidate[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<CatalogCandidate | null>(null);
  const [cultureCategory, setCultureCategory] = useState('film');
  const definition = catalogDefinitions[template];

  if (!definition) return null;

  const messageValues = {
    catalog: definition.catalog,
    item: definition.item,
    items: definition.items,
    placeholder: definition.placeholder,
  };

  const search = async () => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2 || normalizedQuery.length > 100 || searching) return;

    setSearching(true);
    setFailed(false);
    setSearched(false);

    try {
      const response = await api.get('/api/v1/discovery/native-objects/catalog', {
        searchParams: {
          q: normalizedQuery,
          template,
          ...(template === 'culture' ? { category: cultureCategory } : {}),
        },
      });
      const data = await response.json() as { results?: unknown };
      const nextResults = Array.isArray(data.results) ? data.results.filter(isCandidate) : [];

      setResults(nextResults);
      setSearched(true);
    } catch (_error) {
      setResults([]);
      setFailed(true);
    } finally {
      setSearching(false);
    }
  };

  return (
    <Stack space={3} className='border-y border-gray-200 py-4 black:border-gray-800 dark:border-gray-800'>
      <Text weight='semibold'>{intl.formatMessage(messages.label, messageValues)}</Text>

      {template === 'culture' && (
        <FormGroup labelText='What kind of work are you looking for?'>
          <Select
            aria-label='Kind of cultural work'
            value={cultureCategory}
            onChange={(event) => {
              setCultureCategory(event.target.value);
              setResults([]);
              setSearched(false);
              setSelected(null);
            }}
          >
            {cultureCategories.map(category => <option key={category.value} value={category.value}>{category.label}</option>)}
          </Select>
        </FormGroup>
      )}

      <HStack space={2} alignItems='bottom'>
        <div className='min-w-0 grow'>
          <Input
            aria-label={intl.formatMessage(messages.label, messageValues)}
            type='search'
            value={query}
            placeholder={intl.formatMessage(messages.placeholder, messageValues)}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void search();
              }
            }}
          />
        </div>
        <Button
          type='button'
          theme='primary'
          disabled={query.trim().length < 2 || query.trim().length > 100 || searching}
          onClick={() => void search()}
        >
          {intl.formatMessage(searching ? messages.searching : messages.search, messageValues)}
        </Button>
      </HStack>

      {failed && <Text size='sm' theme='danger'>{intl.formatMessage(messages.error, messageValues)}</Text>}
      {!failed && searched && results.length === 0 && <Text size='sm' theme='muted'>{intl.formatMessage(messages.empty, messageValues)}</Text>}

      {results.length > 0 && (
        <div className='divide-y divide-solid divide-gray-200 border-y border-gray-200 black:divide-gray-800 black:border-gray-800 dark:divide-gray-800 dark:border-gray-800'>
          {results.map((candidate) => (
            <div key={candidate.id} className='py-3'>
              <HStack space={3} alignItems='center' justifyContent='between'>
                <Stack space={1} className='min-w-0'>
                  <Text weight='semibold'>{candidate.title}</Text>
                  {candidate.subtitle && <Text size='sm' theme='muted'>{candidate.subtitle}</Text>}
                  {template === 'books' && <Text size='xs' theme='muted'>{intl.formatMessage(candidate.federatable ? messages.federated : messages.metadata)}</Text>}
                  <a
                    className='text-sm text-primary-600 black:text-primary-300 hover:underline dark:text-primary-400'
                    href={candidate.source_url}
                    target='_blank'
                    rel='nofollow noopener noreferrer'
                  >
                    {candidate.provider_label} / {intl.formatMessage(messages.source)}
                  </a>
                </Stack>
                <Button
                  type='button'
                  theme='primary'
                  size='sm'
                  onClick={() => {
                    setSelected(candidate);
                    setQuery(candidate.title);
                    setResults([]);
                    setSearched(false);
                    onApply(candidate);
                  }}
                >
                  {intl.formatMessage(messages.apply, messageValues)}
                </Button>
              </HStack>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <Text size='sm' theme='muted'>
          {intl.formatMessage(template === 'books' && !selected.federatable ? messages.metadataHint : messages.imported, { provider: selected.provider_label })}{' '}
          <a
            className='text-primary-600 black:text-primary-300 hover:underline dark:text-primary-400'
            href={selected.source_url}
            target='_blank'
            rel='nofollow noopener noreferrer'
          >
            {intl.formatMessage(messages.source)}
          </a>
        </Text>
      )}
    </Stack>
  );
};

export default NativeCatalogLookup;

/* end of native-catalog-lookup.tsx */
