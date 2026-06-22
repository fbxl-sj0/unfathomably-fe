/*
  Project: Unfathomably FE
  File: features/catchup/index.tsx

  Purpose:
    Provide a time-windowed catch-up view inspired by Phanpy.

  Responsibilities:
    Fetch a bounded home timeline window, group posts by reading intent,
    dedupe boosts, and expose top links without changing normal scrolling.

  This file intentionally does NOT contain:
    Server-side ranking logic or permanent timeline state.
*/

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import PureStatusList from '@/components/pure-status-list.tsx';
import Button from '@/components/ui/button.tsx';
import { Column } from '@/components/ui/column.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useApi } from '@/hooks/useApi.ts';
import { statusSchema, type Status as StatusEntity } from '@/schemas/index.ts';

type CatchupBucket = 'all' | 'originals' | 'replies' | 'quotes' | 'boosts' | 'links' | 'filtered';

interface TopLink {
  href: string;
  count: number;
}

const WINDOW_HOURS = 24;
const LIMIT = 80;

const htmlToText = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const extractLinks = (status: StatusEntity): string[] => {
  const content = htmlToText(status.content);
  const links = content.match(/https?:\/\/[^\s)]+/g) || [];
  const cardUrl = status.card?.url ? [status.card.url] : [];

  return [...links, ...cardUrl];
};

const statusBucket = (status: StatusEntity): Exclude<CatchupBucket, 'all' | 'links'> => {
  if ((status as any).hidden || (status as any).filtered?.length > 0) return 'filtered';
  if (status.reblog) return 'boosts';
  if (status.quote) return 'quotes';
  if (status.in_reply_to_id) return 'replies';
  return 'originals';
};

const withinWindow = (status: StatusEntity) => {
  const createdAt = new Date(status.created_at).getTime();
  const minTime = Date.now() - WINDOW_HOURS * 60 * 60 * 1000;

  return Number.isFinite(createdAt) && createdAt >= minTime;
};

const dedupeBoosts = (statuses: StatusEntity[]) => {
  const seen = new Set<string>();

  return statuses.filter((status) => {
    const key = status.reblog?.id || status.id;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const Catchup: React.FC = () => {
  const api = useApi();

  const [statuses, setStatuses] = useState<StatusEntity[]>([]);
  const [bucket, setBucket] = useState<CatchupBucket>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/v1/timelines/home', {
        searchParams: { limit: LIMIT },
      });

      const data = await response.json();
      const parsed = statusSchema.array().parse(data);

      setStatuses(dedupeBoosts(parsed.filter(withinWindow)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const buckets = useMemo(() => {
    const grouped: Record<Exclude<CatchupBucket, 'links'>, StatusEntity[]> = {
      all: statuses,
      originals: [],
      replies: [],
      quotes: [],
      boosts: [],
      filtered: [],
    };

    statuses.forEach((status) => {
      grouped[statusBucket(status)].push(status);
    });

    return grouped;
  }, [statuses]);

  const topLinks = useMemo(() => {
    const counts = new Map<string, number>();

    statuses.forEach((status) => {
      extractLinks(status).forEach((href) => {
        counts.set(href, (counts.get(href) || 0) + 1);
      });
    });

    return [...counts.entries()]
      .map(([href, count]) => ({ href, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [statuses]);

  const visibleStatuses = bucket === 'links' ? statuses.filter(status => extractLinks(status).length > 0) : buckets[bucket];

  const renderButton = (value: CatchupBucket, label: React.ReactNode, count: number) => (
    <Button
      key={value}
      size='sm'
      theme={bucket === value ? 'primary' : 'secondary'}
      onClick={() => setBucket(value)}
    >
      {label} {count}
    </Button>
  );

  return (
    <Column label='Catch-up' withHeader={false}>
      <Stack space={4}>
        <Stack space={1}>
          <Text size='2xl' weight='bold' tag='h1'>
            <FormattedMessage id='catchup.heading' defaultMessage='Catch-up' />
          </Text>

          <Text theme='muted'>
            <FormattedMessage
              id='catchup.subtitle'
              defaultMessage='A focused 24 hour reading window for originals, replies, quotes, boosts, and links from your home timeline.'
            />
          </Text>
        </Stack>

        <HStack alignItems='center' space={2} className='flex-wrap'>
          {renderButton('all', <FormattedMessage id='catchup.filters.all' defaultMessage='All' />, buckets.all.length)}
          {renderButton('originals', <FormattedMessage id='catchup.filters.originals' defaultMessage='Originals' />, buckets.originals.length)}
          {renderButton('replies', <FormattedMessage id='catchup.filters.replies' defaultMessage='Replies' />, buckets.replies.length)}
          {renderButton('quotes', <FormattedMessage id='catchup.filters.quotes' defaultMessage='Quotes' />, buckets.quotes.length)}
          {renderButton('boosts', <FormattedMessage id='catchup.filters.boosts' defaultMessage='Boosts' />, buckets.boosts.length)}
          {renderButton('links', <FormattedMessage id='catchup.filters.links' defaultMessage='Links' />, topLinks.length)}
          {renderButton('filtered', <FormattedMessage id='catchup.filters.filtered' defaultMessage='Filtered' />, buckets.filtered.length)}
          <Button size='sm' theme='tertiary' onClick={load}>
            <FormattedMessage id='catchup.actions.refresh' defaultMessage='Refresh' />
          </Button>
        </HStack>

        {topLinks.length > 0 && (
          <Stack space={2} className='rounded-lg border border-solid border-gray-200 p-3 dark:border-gray-800'>
            <Text weight='semibold'>
              <FormattedMessage id='catchup.top_links' defaultMessage='Top links' />
            </Text>

            {topLinks.map((link: TopLink) => (
              <HStack key={link.href} justifyContent='between' space={3}>
                <a className='truncate text-primary-600 hover:underline dark:text-primary-400' href={link.href} target='_blank' rel='noopener'>
                  {link.href}
                </a>

                <Text theme='muted' size='sm'>
                  {link.count}
                </Text>
              </HStack>
            ))}
          </Stack>
        )}

        {error && (
          <Text theme='danger'>
            <FormattedMessage id='catchup.error' defaultMessage='Could not load catch-up: {error}' values={{ error }} />
          </Text>
        )}

        <PureStatusList
          scrollKey='catchup'
          statuses={visibleStatuses}
          isLoading={isLoading}
          hasMore={false}
          emptyMessage={<FormattedMessage id='catchup.empty' defaultMessage='There is nothing to catch up on in this window.' />}
        />
      </Stack>
    </Column>
  );
};

export default Catchup;

/* end of features/catchup/index.tsx */
