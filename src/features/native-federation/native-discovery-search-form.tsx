/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/features/native-federation/native-discovery-search-form.tsx

  Purpose:

    Present straightforward Worlds searches through the same form controls
    used by the rest of Soapbox.

  Responsibilities:

    * keep search inputs and submit actions visually consistent
    * provide one responsive layout for narrow and wide screens
    * preserve an explicit accessible label for every search field
    * pass request behavior back to the owning discovery panel

  This file intentionally does NOT contain:

    * provider or federation-specific request logic
    * query normalization or minimum-length policy
    * discovery result rendering
*/

import type { FormEventHandler, ReactNode } from 'react';

import Button from '@/components/ui/button.tsx';
import Input from '@/components/ui/input.tsx';

export interface INativeDiscoverySearchForm {
  disabled?: boolean;
  id: string;
  label: ReactNode;
  maxLength?: number;
  onChange: (value: string) => void;
  onSecondary?: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  placeholder: string;
  secondaryLabel?: ReactNode;
  submitLabel: ReactNode;
  value: string;
}

const NativeDiscoverySearchForm = ({
  disabled = false,
  id,
  label,
  maxLength = 200,
  onChange,
  onSecondary,
  onSubmit,
  placeholder,
  secondaryLabel,
  submitLabel,
  value,
}: INativeDiscoverySearchForm) => (
  <form className='mt-4 flex flex-col gap-2 sm:flex-row' onSubmit={onSubmit}>
    <label className='sr-only' htmlFor={id}>{label}</label>

    <Input
      id={id}
      type='search'
      value={value}
      maxLength={maxLength}
      outerClassName='min-w-0 flex-1'
      className='px-3 py-2.5'
      placeholder={placeholder}
      onChange={event => onChange(event.target.value)}
    />

    <Button
      className='w-full shrink-0 sm:w-auto'
      disabled={disabled}
      theme='primary'
      type='submit'
    >
      {submitLabel}
    </Button>

    {secondaryLabel && onSecondary && (
      <Button
        className='w-full shrink-0 sm:w-auto'
        theme='secondary'
        type='button'
        onClick={onSecondary}
      >
        {secondaryLabel}
      </Button>
    )}
  </form>
);

export default NativeDiscoverySearchForm;

/* end of src/features/native-federation/native-discovery-search-form.tsx */
