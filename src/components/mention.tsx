import { Link } from 'react-router-dom';

import Tooltip from '@/components/ui/tooltip.tsx';
import { shortenNostr } from '@/utils/nostr.ts';


import type { Mention as MentionEntity } from '@/schemas/index.ts';

interface IMention {
  mention: Pick<MentionEntity, 'acct' | 'actor_type' | 'username'>;
  disabled?: boolean;
}

export const mentionPath = ({ acct, actor_type }: Pick<MentionEntity, 'acct' | 'actor_type'>) =>
  actor_type === 'Group' ? `/group/${acct}` : `/@${acct}`;

/** Mention for display in post content and the composer. */
const Mention: React.FC<IMention> = ({ mention, disabled }) => {
  const { acct, username } = mention;

  const handleClick: React.MouseEventHandler = (e) => {
    if (disabled) {
      e.preventDefault();
    }
    e.stopPropagation();
  };

  return (
    <Tooltip text={`@${acct}`}>
      <Link
        to={mentionPath(mention)}
        className='text-primary-600 hover:underline dark:text-accent-blue'
        onClick={handleClick}
        dir='ltr'
        // eslint-disable-next-line formatjs/no-literal-string-in-jsx
      >
        @{shortenNostr(username)}
      </Link>
    </Tooltip>
  );
};

export default Mention;
