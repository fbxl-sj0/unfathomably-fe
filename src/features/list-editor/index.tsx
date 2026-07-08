import { useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { setupListEditor, resetListEditor } from '@/actions/lists.ts';
import { CardHeader, CardTitle } from '@/components/ui/card.tsx';
import Modal from '@/components/ui/modal.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

import Account from './components/account.tsx';
import EditListForm from './components/edit-list-form.tsx';
import Search from './components/search.tsx';

const messages = defineMessages({
  changeTitle: { id: 'lists.edit.submit', defaultMessage: 'Change title' },
  addToList: { id: 'lists.account.add', defaultMessage: 'Add to list' },
  removeFromList: { id: 'lists.account.remove', defaultMessage: 'Remove from list' },
  editList: { id: 'lists.edit', defaultMessage: 'Edit list' },
  description: { id: 'lists.edit.description', defaultMessage: 'Rename the list, choose whether it is exclusive, and manage members from people you follow.' },
  noMembers: { id: 'lists.edit.no_members', defaultMessage: 'No one is in this list yet. Search for people you follow below and add them.' },
  searchHelp: { id: 'lists.search_help', defaultMessage: 'Lists can only contain accounts you already follow.' },
});

interface IListEditor {
  listId: string;
  onClose: (type: string) => void;
}

const ListEditor: React.FC<IListEditor> = ({ listId, onClose }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const accountIds = useAppSelector((state) => state.listEditor.accounts.items);
  const accountsLoaded = useAppSelector((state) => state.listEditor.accounts.loaded);
  const searchAccountIds = useAppSelector((state) => state.listEditor.suggestions.items);

  useEffect(() => {
    dispatch(setupListEditor(listId));

    return () => {
      dispatch(resetListEditor());
    };
  }, []);

  const onClickClose = () => onClose('LIST_EDITOR');

  return (
    <Modal
      title={<FormattedMessage id='lists.edit' defaultMessage='Edit list' />}
      onClose={onClickClose}
    >
      <CardHeader>
        <CardTitle title={intl.formatMessage(messages.changeTitle)} />
      </CardHeader>
      <Text className='px-4' theme='muted' size='sm'>
        {intl.formatMessage(messages.description)}
      </Text>
      <EditListForm />
      <br />

      <div>
        <CardHeader>
          <CardTitle title={intl.formatMessage(messages.removeFromList)} />
        </CardHeader>

        {accountIds.size > 0 ? (
          <div className='max-h-48 overflow-y-auto'>
            {accountIds.map(accountId => <Account key={accountId} accountId={accountId} />)}
          </div>
        ) : accountsLoaded ? (
          <Text className='px-4' theme='muted' size='sm'>
            {intl.formatMessage(messages.noMembers)}
          </Text>
        ) : null}
      </div>

      <br />
      <CardHeader>
        <CardTitle title={intl.formatMessage(messages.addToList)} />
      </CardHeader>
      <Text className='px-4' theme='muted' size='sm'>
        {intl.formatMessage(messages.searchHelp)}
      </Text>
      <Search />
      <div className='max-h-48 overflow-y-auto'>
        {searchAccountIds.map(accountId => <Account key={accountId} accountId={accountId} />)}
      </div>
    </Modal>
  );
};

export default ListEditor;
