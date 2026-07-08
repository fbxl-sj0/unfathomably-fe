import { defineMessages, useIntl } from 'react-intl';

import { changeListEditorEmoji, changeListEditorTitle, submitListEditor } from '@/actions/lists.ts';
import Button from '@/components/ui/button.tsx';
import Form from '@/components/ui/form.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Input from '@/components/ui/input.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

const messages = defineMessages({
  emoji: { id: 'lists.edit.emoji_placeholder', defaultMessage: 'Emoji' },
  title: { id: 'lists.edit.submit', defaultMessage: 'Change title' },
  save: { id: 'lists.new.save_title', defaultMessage: 'Save Title' },
});

const ListForm = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const value = useAppSelector((state) => state.listEditor.title);
  const emoji = useAppSelector((state) => state.listEditor.emoji);
  const disabled = useAppSelector((state) => !state.listEditor.isChanged);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    dispatch(changeListEditorTitle(e.target.value));
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
  const emojiLabel = intl.formatMessage(messages.emoji);

  return (
    <Form onSubmit={handleSubmit}>
      <HStack space={2}>
        <Input
          outerClassName='grow'
          type='text'
          value={value}
          onChange={handleChange}
        />

        <Input
          outerClassName='w-24 shrink-0'
          type='text'
          value={emoji}
          onChange={handleEmojiChange}
          placeholder={emojiLabel}
          maxLength={64}
        />

        <Button onClick={handleClick} disabled={disabled}>
          {save}
        </Button>
      </HStack>
    </Form>
  );
};

export default ListForm;
