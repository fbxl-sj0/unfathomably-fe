/*
  Project: Unfathomably FE
  File: features/lists/components/new-list-form.tsx

  Purpose:
    Present the form used to create a list.

  Responsibilities:
    Collect the title, optional emoji, and exclusive-list preference, then
    submit those values through the shared list editor.

  This file intentionally does NOT contain:
    List API requests or list timeline rendering.
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
  label: { id: 'lists.new.title_placeholder', defaultMessage: 'New list title' },
  title: { id: 'lists.new.create', defaultMessage: 'Add list' },
  create: { id: 'lists.new.create_title', defaultMessage: 'Add list' },
  emoji: { id: 'lists.emoji', defaultMessage: 'List emoji' },
  emojiHint: { id: 'lists.emoji_hint', defaultMessage: 'Enter one emoji or a local custom emoji name without colons. Leave blank for the default list icon.' },
  exclusive: { id: 'lists.exclusive', defaultMessage: 'Exclusive list' },
  exclusiveHint: { id: 'lists.exclusive_hint', defaultMessage: 'Hide members of this list from your Home feed.' },
});

const NewListForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const intl = useIntl();

  const value = useAppSelector((state) => state.listEditor.get('title'));
  const emoji = useAppSelector((state) => state.listEditor.get('emoji'));
  const exclusive = useAppSelector((state) => state.listEditor.get('exclusive'));
  const disabled = useAppSelector((state) => !!state.listEditor.get('isSubmitting'));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(changeListEditorTitle(e.target.value));
  };

  const handleExclusiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(changeListEditorExclusive(e.target.checked));
  };

  const handleEmojiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(changeListEditorEmoji(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent<Element>) => {
    e.preventDefault();
    dispatch(submitListEditor(true));
  };

  const label = intl.formatMessage(messages.label);
  const create = intl.formatMessage(messages.create);
  const hasTitle = value.trim().length > 0;

  return (
    <Form onSubmit={handleSubmit}>
      <HStack space={2}>
        <label className='grow'>
          <span style={{ display: 'none' }}>{label}</span>

          <Input
            type='text'
            value={value}
            disabled={disabled}
            onChange={handleChange}
            placeholder={label}
          />
        </label>

        <Button
          disabled={disabled || !hasTitle}
          onClick={handleSubmit}
          theme='primary'
        >
          {create}
        </Button>
      </HStack>

      <FormGroup
        labelText={intl.formatMessage(messages.emoji)}
        hintText={intl.formatMessage(messages.emojiHint)}
      >
        <Input
          name='new-list-emoji'
          value={emoji}
          disabled={disabled}
          onChange={handleEmojiChange}
          placeholder={intl.formatMessage(messages.emoji)}
        />
      </FormGroup>

      <div className='flex items-start gap-3 rounded-lg bg-gray-100 p-3 dark:bg-gray-900 black:bg-black'>
        <Toggle
          id='new-list-exclusive'
          checked={exclusive}
          disabled={disabled}
          onChange={handleExclusiveChange}
        />

        <div>
          <Text tag='label' htmlFor='new-list-exclusive' weight='medium'>
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

export default NewListForm;

/* end of features/lists/components/new-list-form.tsx */
