import { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { fetchMfa } from '@/actions/mfa.ts';
import CopyableInput from '@/components/copyable-input.tsx';
import List, { ListItem } from '@/components/list.tsx';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card.tsx';
import { Column } from '@/components/ui/column.tsx';
import Counter from '@/components/ui/counter.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import Input from '@/components/ui/input.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useFeatures } from '@/hooks/useFeatures.ts';
import { useInstance } from '@/hooks/useInstance.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';
import { useSettingsNotifications } from '@/hooks/useSettingsNotifications.ts';
import securityReducer from '@/reducers/security.ts';
import { injectReducer } from '@/store.ts';

import Preferences from '../preferences/index.tsx';

import MessagesSettings from './components/messages-settings.tsx';

injectReducer('security', securityReducer);

const messages = defineMessages({
  accountAliases: { id: 'navigation_bar.account_aliases', defaultMessage: 'Account aliases' },
  accountMigration: { id: 'settings.account_migration', defaultMessage: 'Move Account' },
  backups: { id: 'column.backups', defaultMessage: 'Backups' },
  blocks: { id: 'settings.blocks', defaultMessage: 'Blocks' },
  changeEmail: { id: 'settings.change_email', defaultMessage: 'Change Email' },
  changePassword: { id: 'settings.change_password', defaultMessage: 'Change Password' },
  configureMfa: { id: 'settings.configure_mfa', defaultMessage: 'Configure MFA' },
  deleteAccount: { id: 'settings.delete_account', defaultMessage: 'Delete Account' },
  editProfile: { id: 'settings.edit_profile', defaultMessage: 'Edit Profile' },
  editIdentity: { id: 'settings.edit_identity', defaultMessage: 'Identity' },
  editRelays: { id: 'nostr_relays.title', defaultMessage: 'Relays' },
  editAtproto: { id: 'settings.atproto', defaultMessage: 'Bluesky account' },
  exportData: { id: 'column.export_data', defaultMessage: 'Export data' },
  importData: { id: 'navigation_bar.import_data', defaultMessage: 'Import data' },
  mfaDisabled: { id: 'mfa.disabled', defaultMessage: 'Disabled' },
  mfaEnabled: { id: 'mfa.enabled', defaultMessage: 'Enabled' },
  mutes: { id: 'settings.mutes', defaultMessage: 'Mutes' },
  other: { id: 'settings.other', defaultMessage: 'Other Options' },
  preferences: { id: 'settings.preferences', defaultMessage: 'Preferences' },
  privacy: { id: 'settings.privacy', defaultMessage: 'Privacy' },
  profile: { id: 'settings.profile', defaultMessage: 'Profile' },
  security: { id: 'settings.security', defaultMessage: 'Security' },
  sessions: { id: 'settings.sessions', defaultMessage: 'Active sessions' },
  search: { id: 'settings.search', defaultMessage: 'Search settings' },
  noResults: { id: 'settings.search_no_results', defaultMessage: 'No settings match that search.' },
  settings: { id: 'settings.settings', defaultMessage: 'Settings' },
});

/** User settings page. */
const Settings = () => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const [searchQuery, setSearchQuery] = useState('');

  const mfa = useAppSelector((state) => state.security.get('mfa'));
  const features = useFeatures();
  const { account } = useOwnAccount();
  const { instance } = useInstance();
  const settingsNotifications = useSettingsNotifications();

  const isMfaEnabled = mfa.getIn(['settings', 'totp']);

  useEffect(() => {
    if (features.security) dispatch(fetchMfa());
  }, [dispatch]);

  if (!account) return null;

  const displayName = account.display_name || account.username;
  const identityAddress = account.nostr.nip05 || `${account.username}@${instance.domain}`;
  const query = searchQuery.trim().toLocaleLowerCase();
  const matches = (...values: string[]) => !query || values.some(value => value.toLocaleLowerCase().includes(query));

  const profileHeading = matches(intl.formatMessage(messages.profile));
  const showEditProfile = profileHeading || matches(intl.formatMessage(messages.editProfile));
  const showIdentity = features.nip05 && (profileHeading || matches(intl.formatMessage(messages.editIdentity), 'nip-05'));
  const showRelays = features.nostr && (profileHeading || matches(intl.formatMessage(messages.editRelays), 'nostr'));
  const showAtproto = features.atproto && (profileHeading || matches(intl.formatMessage(messages.editAtproto), 'atproto', 'bluesky'));
  const showProfile = showEditProfile || showIdentity || showRelays || showAtproto;

  const privacyHeading = matches(intl.formatMessage(messages.privacy));
  const showMutes = privacyHeading || matches(intl.formatMessage(messages.mutes));
  const showBlocks = features.blocks && (privacyHeading || matches(intl.formatMessage(messages.blocks)));
  const showPrivacy = showMutes || showBlocks;

  const securityHeading = matches(intl.formatMessage(messages.security));
  const showEmail = features.security && (securityHeading || matches(intl.formatMessage(messages.changeEmail)));
  const showPassword = features.security && (securityHeading || matches(intl.formatMessage(messages.changePassword)));
  const showMfa = features.security && (securityHeading || matches(intl.formatMessage(messages.configureMfa), 'two factor', '2fa'));
  const showSessions = features.sessions && (securityHeading || matches(intl.formatMessage(messages.sessions), 'tokens', 'devices'));
  const showSecurity = showEmail || showPassword || showMfa || showSessions;

  const showChats = features.chats && matches('chats', 'messages', 'direct messages');
  const showPreferences = matches(intl.formatMessage(messages.preferences), 'appearance', 'theme', 'language', 'notifications');
  const otherHeading = matches(intl.formatMessage(messages.other));
  const showImport = features.importData && (otherHeading || matches(intl.formatMessage(messages.importData)));
  const showExport = features.exportData && (otherHeading || matches(intl.formatMessage(messages.exportData)));
  const showBackups = features.backups && (otherHeading || matches(intl.formatMessage(messages.backups)));
  const showMigration = features.federating && features.accountMoving && (otherHeading || matches(intl.formatMessage(messages.accountMigration)));
  const showAliases = features.federating && !features.accountMoving && features.accountAliases && (otherHeading || matches(intl.formatMessage(messages.accountAliases)));
  const showDelete = features.security && (otherHeading || matches(intl.formatMessage(messages.deleteAccount)));
  const showOther = showImport || showExport || showBackups || showMigration || showAliases || showDelete;
  const showNostr = Boolean(instance.nostr) && matches('nostr relay', 'connect nostr client');
  const hasResults = showProfile || showPrivacy || showSecurity || showChats || showPreferences || showOther || showNostr;

  return (
    <Column label={intl.formatMessage(messages.settings)} transparent withHeader={false} slim>
      <Card className='space-y-4'>
        <CardBody>
          <div className='space-y-2'>
            <label htmlFor='settings-search'>
              <Text weight='medium'>{intl.formatMessage(messages.search)}</Text>
            </label>
            <Input
              id='settings-search'
              theme='search'
              value={searchQuery}
              placeholder={intl.formatMessage(messages.search)}
              autoComplete='off'
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </CardBody>

        {showProfile && (
          <>
            <CardHeader>
              <CardTitle title={intl.formatMessage(messages.profile)} />
            </CardHeader>

            <CardBody>
              <List>
                {showEditProfile && (
                  <ListItem label={intl.formatMessage(messages.editProfile)} to='/settings/profile'>
                    <span className='max-w-full truncate'>{displayName}</span>
                  </ListItem>
                )}
                {showIdentity && (
                  <ListItem label={intl.formatMessage(messages.editIdentity)} to='/settings/identity'>
                    <span className='max-w-full truncate'>
                      {identityAddress}
                      {settingsNotifications.has('needsNip05') && <Counter count={1} />}
                    </span>
                  </ListItem>
                )}
                {showRelays && <ListItem label={intl.formatMessage(messages.editRelays)} to='/settings/relays' />}
                {showAtproto && <ListItem label={intl.formatMessage(messages.editAtproto)} to='/settings/atproto' />}
              </List>
            </CardBody>
          </>
        )}

        {showPrivacy && (
          <>
            <CardHeader>
              <CardTitle title={intl.formatMessage(messages.privacy)} />
            </CardHeader>

            <CardBody>
              <List>
                {showMutes && <ListItem label={intl.formatMessage(messages.mutes)} to='/mutes' />}
                {showBlocks && <ListItem label={intl.formatMessage(messages.blocks)} to='/blocks' />}
              </List>
            </CardBody>
          </>
        )}

        {showSecurity && (
          <>
            <CardHeader>
              <CardTitle title={intl.formatMessage(messages.security)} />
            </CardHeader>

            <CardBody>
              <List>
                {features.security && (
                  <>
                    {showEmail && <ListItem label={intl.formatMessage(messages.changeEmail)} to='/settings/email' />}
                    {showPassword && <ListItem label={intl.formatMessage(messages.changePassword)} to='/settings/password' />}
                    {showMfa && (
                      <ListItem label={intl.formatMessage(messages.configureMfa)} to='/settings/mfa'>
                        <span>
                          {isMfaEnabled ?
                            intl.formatMessage(messages.mfaEnabled) :
                            intl.formatMessage(messages.mfaDisabled)}
                        </span>
                      </ListItem>
                    )}
                  </>
                )}
                {showSessions && (
                  <ListItem label={intl.formatMessage(messages.sessions)} to='/settings/tokens' />
                )}
              </List>
            </CardBody>
          </>
        )}

        {showChats ? (
          <>
            <CardHeader>
              <CardTitle title={<FormattedMessage id='column.chats' defaultMessage='Chats' />} />
            </CardHeader>

            <CardBody>
              <MessagesSettings />
            </CardBody>
          </>
        ) : null}

        {showPreferences && (
          <>
            <CardHeader>
              <CardTitle title={intl.formatMessage(messages.preferences)} />
            </CardHeader>

            <CardBody>
              <Preferences />
            </CardBody>
          </>
        )}

        {showOther && (
          <>
            <CardHeader>
              <CardTitle title={intl.formatMessage(messages.other)} />
            </CardHeader>

            <CardBody>
              <List>
                {showImport && (
                  <ListItem label={intl.formatMessage(messages.importData)} to='/settings/import' />
                )}

                {showExport && (
                  <ListItem label={intl.formatMessage(messages.exportData)} to='/settings/export' />
                )}

                {showBackups && (
                  <ListItem label={intl.formatMessage(messages.backups)} to='/settings/backups' />
                )}

                {showMigration ? (
                  <ListItem label={intl.formatMessage(messages.accountMigration)} to='/settings/migration' />
                ) : showAliases && (
                  <ListItem label={intl.formatMessage(messages.accountAliases)} to='/settings/aliases' />
                )}

                {showDelete && (
                  <ListItem label={<Text theme='danger'>{intl.formatMessage(messages.deleteAccount)}</Text>} to='/settings/account' />
                )}
              </List>
            </CardBody>
          </>
        )}

        {showNostr && (
          <>
            <CardHeader>
              <CardTitle title={<FormattedMessage id='nostr_panel.title' defaultMessage='Nostr Relay' />} />
            </CardHeader>

            <CardBody className='pb-3'>
              <FormGroup hintText={<FormattedMessage id='nostr_panel.message' defaultMessage='Connect with any Nostr client.' />}>
                <CopyableInput value={instance.nostr?.relay || ''} />
              </FormGroup>
            </CardBody>
          </>
        )}

        {!hasResults && (
          <CardBody>
            <Text theme='muted'>{intl.formatMessage(messages.noResults)}</Text>
          </CardBody>
        )}
      </Card>
    </Column>
  );
};

export default Settings;
