import backspaceIcon from '@tabler/icons/outline/backspace.svg';
import clsx from 'clsx';
import { useId } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { fetchListSuggestions, clearListSuggestions, changeListSuggestions } from '@/actions/lists.ts';
import Button from '@/components/ui/button.tsx';
import Form from '@/components/ui/form.tsx';
import HStack from '@/components/ui/hstack.tsx';
import Input from '@/components/ui/input.tsx';
import SvgIcon from '@/components/ui/svg-icon.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';

const messages = defineMessages({
  search: { id: 'lists.search', defaultMessage: 'Search among people you follow' },
  searchTitle: { id: 'tabs_bar.search', defaultMessage: 'Search' },
  clear: { id: 'search.clear', defaultMessage: 'Clear search' },
});

const Search = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const inputId = `list-search-${useId()}`;

  const value = useAppSelector((state) => state.listEditor.suggestions.value);
  const hasValue = value.trim().length > 0;

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    dispatch(changeListSuggestions(e.target.value));
  };

  const handleSubmit = () => {
    if (!hasValue) return;

    dispatch(fetchListSuggestions(value));
  };

  const handleClear = () => {
    dispatch(clearListSuggestions());
  };

  return (
    <Form onSubmit={handleSubmit}>
      <HStack space={2}>
        <div className='relative grow'>
          <label htmlFor={inputId} className='sr-only'>{intl.formatMessage(messages.search)}</label>

          <Input
            id={inputId}
            type='text'
            value={value}
            onChange={handleChange}
            placeholder={intl.formatMessage(messages.search)}
          />
          <button
            type='button'
            aria-label={intl.formatMessage(messages.clear)}
            disabled={!hasValue}
            className={clsx('search__icon pointer-events-none absolute right-4 top-1/2 z-20 -translate-y-1/2 text-gray-400 opacity-0 rtl:left-4 rtl:right-auto', { 'pointer-events-auto opacity-100': hasValue })}
            onClick={handleClear}
          >
            <SvgIcon src={backspaceIcon} aria-hidden='true' className='size-4.5 text-[16px]' />
          </button>
        </div>

        <Button disabled={!hasValue} onClick={handleSubmit}>{intl.formatMessage(messages.searchTitle)}</Button>
      </HStack>
    </Form>
  );
};

export default Search;
