/*
  Unfathomably FE
  ----------------

  File: active-nostr-groups.tsx

  Purpose:
    Present active Nostr communities with the normal Soapbox group cards.

  Responsibilities:
    - explain why these groups are being recommended
    - preserve the existing carousel and group action workflow
    - remain hidden until the backend has useful activity evidence

  This file intentionally does NOT infer activity from member totals.
*/

import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useActiveNostrGroups } from '@/api/hooks/index.ts';
import Carousel from '@/components/ui/carousel.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import PlaceholderGroupDiscover from '@/features/placeholder/components/placeholder-group-discover.tsx';

import GroupGridItem from './group-grid-item.tsx';

const ActiveNostrGroups = () => {
  const { groups, isFetching, isFetched } = useActiveNostrGroups();
  const [groupCover, setGroupCover] = useState<HTMLDivElement | null>(null);

  if (isFetched && groups.length === 0) return null;

  return (
    <Stack space={4} data-testid='active-nostr-groups'>
      <Stack space={1}>
        <Text size='xl' weight='bold'>
          <FormattedMessage
            id='groups.discover.nostr_active.title'
            defaultMessage='Active Nostr communities'
          />
        </Text>

        <Text theme='muted'>
          <FormattedMessage
            id='groups.discover.nostr_active.subtitle'
            defaultMessage='Recently active groups, ranked by real conversations and distinct participants.'
          />
        </Text>
      </Stack>

      <Carousel
        itemWidth={250}
        itemCount={groups.length}
        controlsHeight={groupCover?.clientHeight}
        isDisabled={isFetching}
      >
        {({ width }: { width: number }) => (
          <>
            {isFetching ? (
              new Array(4).fill(0).map((_, index) => (
                <div
                  className='relative flex shrink-0 flex-col space-y-2 px-1'
                  style={{ width: width || 'auto' }}
                  key={index}
                >
                  <PlaceholderGroupDiscover />
                </div>
              ))
            ) : (
              groups.map(group => (
                <GroupGridItem
                  key={group.id}
                  group={group}
                  width={width}
                  ref={setGroupCover}
                />
              ))
            )}
          </>
        )}
      </Carousel>
    </Stack>
  );
};

export default ActiveNostrGroups;

/* end of active-nostr-groups.tsx */
