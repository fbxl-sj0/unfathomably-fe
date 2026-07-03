import { FormattedMessage } from 'react-intl';

import { type CreateGroupParams } from '@/api/hooks/index.ts';
import List, { ListItem } from '@/components/list.tsx';
import Checkbox from '@/components/ui/checkbox.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import Form from '@/components/ui/form.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';

interface IPrivacyStep {
  params: CreateGroupParams;
  onChange(params: CreateGroupParams): void;
}

const PrivacyStep: React.FC<IPrivacyStep> = ({ params, onChange }) => {
  const visibility = params.group_visibility || 'everyone';
  const discoverable = params.discoverable ?? true;

  const onChangePrivacy = (group_visibility: CreateGroupParams['group_visibility']) => {
    onChange({ ...params, group_visibility });
  };

  const onChangeDiscoverable = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...params, discoverable: event.currentTarget.checked });
  };

  return (
    <>
      <Stack className='mx-auto max-w-xs py-10' space={2}>
        <Text size='3xl' weight='bold' align='center'>
          <FormattedMessage id='manage_group.get_started' defaultMessage='Let’s get started!' />
        </Text>
        <Text theme='muted' align='center'>
          <FormattedMessage id='manage_group.tagline' defaultMessage='Groups connect you with others based on shared interests.' />
        </Text>
      </Stack>
      <Form>
        <FormGroup
          labelText={<FormattedMessage id='manage_group.privacy.label' defaultMessage='Privacy settings' />}
        >
          <List>
            <ListItem
              label={<Text weight='medium'><FormattedMessage id='manage_group.privacy.public.label' defaultMessage='Public' /></Text>}
              hint={<FormattedMessage id='manage_group.privacy.public.hint' defaultMessage='Anyone can join.' />}
              onSelect={() => onChangePrivacy('everyone')}
              isSelected={visibility === 'everyone'}
            />

            <ListItem
              label={<Text weight='medium'><FormattedMessage id='manage_group.privacy.private.label' defaultMessage='Private (Owner approval required)' /></Text>}
              hint={<FormattedMessage id='manage_group.privacy.private.hint' defaultMessage='Users can join after their request is approved.' />}
              onSelect={() => onChangePrivacy('members_only')}
              isSelected={visibility === 'members_only'}
            />
          </List>
        </FormGroup>
        <FormGroup
          labelText={<FormattedMessage id='manage_group.discovery.label' defaultMessage='Outside discovery' />}
        >
          <label className='flex cursor-pointer items-start gap-3 rounded-lg bg-gradient-to-r from-gradient-start/20 to-gradient-end/20 px-4 py-3 dark:from-gradient-start/10 dark:to-gradient-end/10'>
            <Checkbox
              checked={discoverable}
              onChange={onChangeDiscoverable}
            />
            <span>
              <Text weight='medium'>
                <FormattedMessage id='manage_group.discovery.advertise.label' defaultMessage='Advertise this group to other servers' />
              </Text>
              <Text size='sm' theme='muted'>
                <FormattedMessage id='manage_group.discovery.advertise.hint' defaultMessage='Show this group in Lemmy-compatible public community discovery so other servers can find it.' />
              </Text>
            </span>
          </label>
        </FormGroup>
        <Text size='sm' theme='muted' align='center'>
          <FormattedMessage id='manage_group.privacy.hint' defaultMessage='Privacy settings cannot be changed later. Discovery can be changed from group settings.' />
        </Text>
      </Form>
    </>
  );
};

export default PrivacyStep;
