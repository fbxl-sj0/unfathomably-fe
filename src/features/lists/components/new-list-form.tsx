import { defineMessages, useIntl } from 'react-intl';

import { changeListEditorEmoji, changeListEditorTitle, submitListEditor } from '@/actions/lists.ts';
import Button from '@/components/ui/button.tsx';
import Form from '@/components/ui/form.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Input from '@/components/ui/input.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

const messages = defineMessages({
  label: { id: 'lists.new.title_placeholder', defaultMessage: 'New list title' },
  emoji: { id: 'lists.new.emoji_placeholder', defaultMessage: 'Emoji' },
  title: { id: 'lists.new.create', defaultMessage: 'Add list' },
  create: { id: 'lists.new.create_title', defaultMessage: 'Add list' },
});

const NewListForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const intl = useIntl();

  const value = useAppSelector((state) => state.listEditor.get('title'));
  const emoji = useAppSelector((state) => state.listEditor.get('emoji'));
  const disabled = useAppSelector((state) => !!state.listEditor.get('isSubmitting'));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(changeListEditorTitle(e.target.value));
  };

  const handleEmojiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(changeListEditorEmoji(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent<Element>) => {
    e.preventDefault();
    dispatch(submitListEditor(true));
  };

  const label = intl.formatMessage(messages.label);
  const emojiLabel = intl.formatMessage(messages.emoji);
  const create = intl.formatMessage(messages.create);

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

        <label className='w-24 shrink-0'>
          <span style={{ display: 'none' }}>{emojiLabel}</span>

          <Input
            type='text'
            value={emoji}
            disabled={disabled}
            onChange={handleEmojiChange}
            placeholder={emojiLabel}
            maxLength={64}
          />
        </label>

        <Button
          disabled={disabled}
          onClick={handleSubmit}
          theme='primary'
        >
          {create}
        </Button>
      </HStack>
    </Form>
  );
};

export default NewListForm;
