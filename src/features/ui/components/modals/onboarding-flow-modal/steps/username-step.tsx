import xIcon from '@tabler/icons/outline/x.svg';
import { FormattedMessage } from 'react-intl';

import Button from '@/components/ui/button.tsx';
import IconButton from '@/components/ui/icon-button.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useInstance } from '@/hooks/useInstance.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';

const closeIcon = xIcon;

interface IUsernameStep {
  onClose?(): void;
  onNext: () => void;
}

/** Explain the automatically assigned cross-protocol username during onboarding. */
const UsernameStep: React.FC<IUsernameStep> = ({ onClose, onNext }) => {
  const { instance } = useInstance();
  const { account } = useOwnAccount();
  const identifier = account?.nostr.nip05 || `${account?.username || ''}@${instance.domain}`;

  return (
    <Stack space={2} justifyContent='center' alignItems='center' className='relative w-full rounded-3xl bg-white px-4 py-8 text-gray-900 shadow-lg black:bg-black dark:bg-primary-900 dark:text-gray-100 dark:shadow-none sm:p-10'>
      <div className='relative w-full'>
        <IconButton src={closeIcon} onClick={onClose} className='absolute -right-2 -top-6 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-200 rtl:rotate-180' />
        <Stack space={2} justifyContent='center' alignItems='center' className='-mx-4 mb-4 border-b border-solid pb-4 dark:border-gray-800 sm:-mx-10 sm:pb-10'>
          <Text size='2xl' align='center' weight='bold'>
            <FormattedMessage id='onboarding.username.title' defaultMessage='Your username is ready' />
          </Text>
          <Text theme='muted' align='center'>
            <FormattedMessage id='onboarding.username.subtitle' defaultMessage='Your ActivityPub username is also your Nostr address. No separate request or review is needed.' />
          </Text>
        </Stack>
      </div>

      <Stack space={5} justifyContent='center' alignItems='center' className='w-full'>
        <Text size='lg' weight='semibold' className='select-all font-mono'>
          {identifier}
        </Text>

        <Stack justifyContent='center' space={2} className='w-full sm:w-3/4'>
          <Button block theme='primary' type='button' onClick={onNext}>
            <FormattedMessage id='onboarding.next' defaultMessage='Next' />
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default UsernameStep;