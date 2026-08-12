/**
 * Mention normalizer:
 * Converts API mentions into our internal format.
 * @see {@link https://docs.joinmastodon.org/entities/mention/}
 */
import { Record as ImmutableRecord } from 'immutable';

import { normalizeAccount } from '@/normalizers/account.ts';

// https://docs.joinmastodon.org/entities/mention/
export const MentionRecord = ImmutableRecord({
  id: '',
  acct: '',
  actor_type: 'Person',
  username: '',
  url: '',
});

export const normalizeMention = (mention: object) => {
  const source = mention as Record<string, any> & {
    get?: (key: string) => unknown;
  };
  const account = normalizeAccount(source);
  const explicitActorType = typeof source.get === 'function'
    ? source.get('actor_type')
    : source.actor_type;
  const actorType = explicitActorType
    || account.getIn(['pleroma', 'actor_type'])
    || account.getIn(['source', 'pleroma', 'actor_type'])
    || 'Person';

  // Simply normalize it as an account then cast it as a mention ¯\_(ツ)_/¯
  return MentionRecord(account).set('actor_type', String(actorType));
};
