/*
  Project: Unfathomably FE
  File: features/list-editor/components/edit-list-form.tsx

  Purpose:
    Present the editable properties of an existing list.

  Responsibilities:
    Edit the title, optional emoji, and exclusive-list preference and save
    the shared list editor state.

  This file intentionally does NOT contain:
    List membership controls or API request construction.
*/

import { defineMessages, useIntl } from 'react-intl';

import { changeListEditorEmoji, changeListEditorExclusive, changeListEditorTitle, submitListEditor } from '@/actions/lists.ts';
import Button from '@/components/ui/button.tsx';
import Form from '@/components/ui/form.tsx';
import FormGroup from '@/components/ui/form-group.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Input from '@/components/ui/input.tsx';
import Text from '@/components/ui/text.tsx';
import Toggle from '@/components/ui/toggle.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

const messages = defineMessages({
  title: { id: 'lists.edit.submit', defaultMessage: 'Change title' },
  save: { id: 'lists.new.save_title', defaultMessage: 'Save Title' },
  emoji: { id: 'lists.emoji', defaultMessage: 'List emoji' },
  emojiHint: { id: 'lists.emoji_hint', defaultMessage: 'Enter one emoji or a local custom emoji name without colons. Leave blank for the default list icon.' },
  exclusive: { id: 'lists.exclusive', defaultMessage: 'Exclusive list' },
  exclusiveHint: { id: 'lists.exclusive_hint', defaultMessage: 'Hide members of this list from your Home feed.' },
});

const ListForm = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const value = useAppSelector((state) => state.listEditor.title);
  const emoji = useAppSelector((state) => state.listEditor.emoji);
  const exclusive = useAppSelector((state) => state.listEditor.exclusive);
  const disabled = useAppSelector((state) => !state.listEditor.isChanged);
  const hasTitle = value.trim().length > 0;

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    dispatch(changeListEditorTitle(e.target.value));
  };

  const handleExclusiveChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    dispatch(changeListEditorExclusive(e.target.checked));
  };

  const handleEmojiChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    dispatch(changeListEditorEmoji(e.target.value));
  };

  const handleSubmit: React.FormEventHandler<Element> = e => {
    e.preventDefault();
    dispatch(submitListEditor(false));
  };

  const handleClick = () => {
    dispatch(submitListEditor(false));
  };

  const save = intl.formatMessage(messages.save);

  return (
    <Form onSubmit={handleSubmit}>
      <HStack space={2}>
        <Input
          outerClassName='grow'
          type='text'
          value={value}
          onChange={handleChange}
        />

        <Button onClick={handleClick} disabled={disabled || !hasTitle}>
          {save}
        </Button>
      </HStack>

      <FormGroup
        labelText={intl.formatMessage(messages.emoji)}
        hintText={intl.formatMessage(messages.emojiHint)}
      >
        <Input
          name='edit-list-emoji'
          value={emoji}
          onChange={handleEmojiChange}
          placeholder={intl.formatMessage(messages.emoji)}
        />
      </FormGroup>

      <div className='flex items-start gap-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-900 black:bg-black'>
        <Toggle
          id='edit-list-exclusive'
          checked={exclusive}
          disabled={!hasTitle}
          onChange={handleExclusiveChange}
        />

        <div>
          <Text tag='label' htmlFor='edit-list-exclusive' weight='medium'>
            {intl.formatMessage(messages.exclusive)}
          </Text>
          <Text theme='muted' size='sm'>
            {intl.formatMessage(messages.exclusiveHint)}
          </Text>
        </div>
      </div>
    </Form>
  );
};

export default ListForm;

/* end of features/list-editor/components/edit-list-form.tsx */
