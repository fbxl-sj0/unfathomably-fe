/*
 * Unfathomably exact native object opener
 * ----------------------------------------
 *
 * File: native-object-url-form.tsx
 *
 * Purpose:
 *   Turn a shared native-object URL into an obvious local Worlds workflow.
 *
 * Responsibilities:
 *   - collect one explicit HTTP(S) object URL
 *   - reject malformed and credential-bearing URLs before navigation
 *   - preserve the selected native presentation family
 *
 * This file intentionally does not fetch remote objects, discover instances,
 * follow publishers, or decide whether the submitted object is trustworthy.
 */

import { useId, useState, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import Button from '@/components/ui/button.tsx';
import Input from '@/components/ui/input.tsx';

import { nativeResolvePath } from './native-resolve-path.ts';
import type { PresentationFamily } from './presentation-family.ts';

interface NativeObjectUrlFormProps {
  action: ReactNode;
  family: PresentationFamily;
  hint: ReactNode;
  placeholder: string;
  title: ReactNode;
}

const isHttpUrl = (value: string): boolean => {
  if (!value || value.length > 2048) return false;

  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && Boolean(url.hostname)
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
};

const NativeObjectUrlForm: React.FC<NativeObjectUrlFormProps> = ({
  action,
  family,
  hint,
  placeholder,
  title,
}) => {
  const inputId = useId();
  const navigate = useNavigate();
  const [attempted, setAttempted] = useState(false);
  const [value, setValue] = useState('');
  const normalizedValue = value.trim();
  const valid = isHttpUrl(normalizedValue);

  return (
    <form
      className='mx-auto mt-5 max-w-2xl rounded-xl border border-primary-300 bg-primary-50/70 p-4 text-left black:border-primary-800 black:bg-primary-950/40 dark:border-primary-700 dark:bg-primary-900/40'
      onSubmit={(event) => {
        event.preventDefault();
        setAttempted(true);

        if (valid) navigate(nativeResolvePath(family, normalizedValue));
      }}
    >
      <label htmlFor={inputId} className='block text-sm font-black text-gray-950 black:text-white dark:text-white'>
        {title}
      </label>
      <p className='mt-1 text-xs leading-5 text-gray-600 black:text-gray-300 dark:text-gray-300'>{hint}</p>
      <div className='mt-3 flex flex-col gap-2 sm:flex-row'>
        <Input
          id={inputId}
          type='url'
          inputMode='url'
          autoCapitalize='none'
          autoCorrect='off'
          spellCheck={false}
          maxLength={2048}
          value={value}
          aria-invalid={attempted && !valid}
          placeholder={placeholder}
          outerClassName='min-w-0 flex-1'
          className='px-3 py-2.5'
          onChange={(event) => {
            setAttempted(false);
            setValue(event.target.value);
          }}
        />
        <Button
          className='w-full shrink-0 sm:w-auto'
          type='submit'
          disabled={!normalizedValue}
          theme='primary'
        >
          {action}
        </Button>
      </div>
      {attempted && !valid && (
        <p className='mt-2 text-xs font-bold text-red-700 dark:text-red-300'>
          <FormattedMessage id='native_discovery.exact_url_invalid' defaultMessage='Enter a complete public http:// or https:// link.' />
        </p>
      )}
    </form>
  );
};

export default NativeObjectUrlForm;

/* end of native-object-url-form.tsx */
