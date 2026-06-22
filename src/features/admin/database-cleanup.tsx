import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import { fetchConfig, updateConfig } from '@/actions/admin.ts';
import List, { ListItem } from '@/components/list.tsx';
import Button from '@/components/ui/button.tsx';
import { CardTitle } from '@/components/ui/card.tsx';
import { Column } from '@/components/ui/column.tsx';
import FormActions from '@/components/ui/form-actions.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import Form from '@/components/ui/form.tsx';
import Input from '@/components/ui/input.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import Toggle from '@/components/ui/toggle.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import ConfigDB from '@/utils/config-db.ts';
import toast from '@/toast.tsx';

const messages = defineMessages({
  heading: { id: 'column.admin.database_cleanup', defaultMessage: 'Database cleanup' },
  saved: { id: 'admin.database_cleanup.saved', defaultMessage: 'Database cleanup settings saved!' },
});

const cleanupWorkerKey = 'Pleroma.Workers.Cron.RemotePostCleanupWorker';

const defaults = {
  enabled: true,
  maxAgeDays: 365,
  batchSize: 200,
  keepThreadsWithLocalActivity: true,
  keepDirectOrMentioned: true,
};

type CleanupSettings = typeof defaults;

const valueFromConfig = (value: any, key: string, fallback: boolean | number) => {
  const item = value?.find((entry: any) => entry.getIn(['tuple', 0]) === `:${key}`);
  return item?.getIn(['tuple', 1], fallback) ?? fallback;
};

const settingsFromConfig = (value: any): CleanupSettings => ({
  enabled: valueFromConfig(value, 'enabled', defaults.enabled) === true,
  maxAgeDays: Number(valueFromConfig(value, 'max_age_days', defaults.maxAgeDays)),
  batchSize: Number(valueFromConfig(value, 'batch_size', defaults.batchSize)),
  keepThreadsWithLocalActivity:
    valueFromConfig(
      value,
      'keep_threads_with_local_activity',
      defaults.keepThreadsWithLocalActivity,
    ) === true,
  keepDirectOrMentioned:
    valueFromConfig(value, 'keep_direct_or_mentioned', defaults.keepDirectOrMentioned) === true,
});

const configFromSettings = (settings: CleanupSettings) => [{
  group: ':pleroma',
  key: cleanupWorkerKey,
  value: [
    { tuple: [':enabled', settings.enabled] },
    { tuple: [':max_age_days', settings.maxAgeDays] },
    { tuple: [':batch_size', settings.batchSize] },
    { tuple: [':keep_threads_with_local_activity', settings.keepThreadsWithLocalActivity] },
    { tuple: [':keep_direct_or_mentioned', settings.keepDirectOrMentioned] },
  ],
}];

const clampInteger = (value: string, fallback: number, min: number) => {
  const integer = parseInt(value, 10);

  if (Number.isNaN(integer)) {
    return fallback;
  }

  return Math.max(min, integer);
};

const DatabaseCleanup: React.FC = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const configs = useAppSelector(state => state.admin.configs);
  const cleanupConfig = ConfigDB.find(configs, ':pleroma', cleanupWorkerKey);
  const configSettings = useMemo(() => settingsFromConfig(cleanupConfig?.get('value')), [cleanupConfig]);
  const [settings, setSettings] = useState<CleanupSettings>(configSettings);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchConfig());
  }, []);

  useEffect(() => {
    setSettings(configSettings);
  }, [configSettings]);

  const setBoolean = (key: keyof CleanupSettings): React.ChangeEventHandler<HTMLInputElement> => {
    return event => {
      setSettings({ ...settings, [key]: event.target.checked });
    };
  };

  const setInteger = (key: keyof CleanupSettings, min: number): React.ChangeEventHandler<HTMLInputElement> => {
    return event => {
      setSettings({
        ...settings,
        [key]: clampInteger(event.target.value, defaults[key] as number, min),
      });
    };
  };

  const handleSubmit: React.FormEventHandler = event => {
    setLoading(true);

    dispatch(updateConfig(configFromSettings(settings))).then(() => {
      toast.success(intl.formatMessage(messages.saved));
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    event.preventDefault();
  };

  return (
    <Column label={intl.formatMessage(messages.heading)}>
      <Form onSubmit={handleSubmit}>
        <fieldset className='space-y-6' disabled={isLoading}>
          <Stack space={2}>
            <CardTitle title={<FormattedMessage id='admin.database_cleanup.heading' defaultMessage='Remote post cache' />} />

            <Text theme='muted'>
              <FormattedMessage
                id='admin.database_cleanup.summary'
                defaultMessage='Prune old public remote posts when nobody local has interacted with them. Pruned posts can be fetched again from their source later.'
              />
            </Text>
          </Stack>

          <List>
            <ListItem
              label={<FormattedMessage id='admin.database_cleanup.enabled_label' defaultMessage='Automatic cleanup' />}
              hint={<FormattedMessage id='admin.database_cleanup.enabled_hint' defaultMessage='Run the cleanup worker from the daily Oban cron schedule.' />}
            >
              <Toggle
                checked={settings.enabled}
                onChange={setBoolean('enabled')}
              />
            </ListItem>

            <ListItem
              label={<FormattedMessage id='admin.database_cleanup.keep_threads_label' defaultMessage='Keep touched threads' />}
              hint={<FormattedMessage id='admin.database_cleanup.keep_threads_hint' defaultMessage='Keep a whole thread if a local user replied, liked, repeated, reacted, or bookmarked within it.' />}
            >
              <Toggle
                checked={settings.keepThreadsWithLocalActivity}
                onChange={setBoolean('keepThreadsWithLocalActivity')}
              />
            </ListItem>

            <ListItem
              label={<FormattedMessage id='admin.database_cleanup.keep_direct_label' defaultMessage='Keep mentions and notifications' />}
              hint={<FormattedMessage id='admin.database_cleanup.keep_direct_hint' defaultMessage='Keep old remote posts that directly address local users or generated local notifications.' />}
            >
              <Toggle
                checked={settings.keepDirectOrMentioned}
                onChange={setBoolean('keepDirectOrMentioned')}
              />
            </ListItem>
          </List>

          <Stack space={4}>
            <FormGroup
              labelText={<FormattedMessage id='admin.database_cleanup.max_age_days_label' defaultMessage='Post age before pruning' />}
              hintText={<FormattedMessage id='admin.database_cleanup.max_age_days_hint' defaultMessage='Remote public posts older than this many days may be pruned.' />}
            >
              <Input
                type='number'
                min={1}
                value={settings.maxAgeDays}
                onChange={setInteger('maxAgeDays', 1)}
              />
            </FormGroup>

            <FormGroup
              labelText={<FormattedMessage id='admin.database_cleanup.batch_size_label' defaultMessage='Maximum posts per run' />}
              hintText={<FormattedMessage id='admin.database_cleanup.batch_size_hint' defaultMessage='Use smaller batches for busy instances if cleanup work competes with normal site traffic.' />}
            >
              <Input
                type='number'
                min={1}
                value={settings.batchSize}
                onChange={setInteger('batchSize', 1)}
              />
            </FormGroup>
          </Stack>

          <FormActions>
            <Button to='/soapbox/admin' theme='tertiary'>
              <FormattedMessage id='admin.database_cleanup.cancel' defaultMessage='Back' />
            </Button>

            <Button theme='primary' type='submit' disabled={isLoading}>
              <FormattedMessage id='admin.database_cleanup.save' defaultMessage='Save' />
            </Button>
          </FormActions>
        </fieldset>
      </Form>
    </Column>
  );
};

export default DatabaseCleanup;
