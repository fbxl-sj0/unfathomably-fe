import listIcon from '@tabler/icons/outline/list.svg';
import plusIcon from '@tabler/icons/outline/plus.svg';
import xIcon from '@tabler/icons/outline/x.svg';
import { defineMessages, useIntl } from 'react-intl';

import { removeFromListAdder, addToListAdder } from '@/actions/lists.ts';
import IconButton from '@/components/icon-button.tsx';
import Icon from '@/components/icon.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

const messages = defineMessages({
  remove: { id: 'lists.account.remove', defaultMessage: 'Remove from list' },
  add: { id: 'lists.account.add', defaultMessage: 'Add to list' },
});

const renderListIcon = (list: any) => {
  const emoji = list.getIn(['pleroma', 'emoji']);
  const emojiUrl = list.getIn(['pleroma', 'emoji_url']);

  if (emojiUrl) {
    return <img className='size-4' src={emojiUrl} alt={emoji || ''} />;
  }

  if (emoji) {
    return <span className='flex size-4 items-center justify-center text-base leading-none'>{emoji}</span>;
  }

  return <Icon src={listIcon} />;
};

interface IList {
  listId: string;
}

const List: React.FC<IList> = ({ listId }) => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const list = useAppSelector((state) => state.lists.get(listId));
  const added = useAppSelector((state) => state.listAdder.lists.items.includes(listId));

  const onRemove = () => dispatch(removeFromListAdder(listId));
  const onAdd = () => dispatch(addToListAdder(listId));

  if (!list) return null;

  let button;

  if (added) {
    button = <IconButton iconClassName='h-5 w-5' src={xIcon} title={intl.formatMessage(messages.remove)} onClick={onRemove} />;
  } else {
    button = <IconButton iconClassName='h-5 w-5' src={plusIcon} title={intl.formatMessage(messages.add)} onClick={onAdd} />;
  }

  return (
    <div className='flex items-center gap-1.5 px-2 py-4 text-black dark:text-white'>
      {renderListIcon(list)}
      <span className='grow'>
        {list.title}
      </span>
      {button}
    </div>
  );
};

export default List;
