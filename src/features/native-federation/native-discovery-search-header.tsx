/*
  Project: Unfathomably Frontend
  --------------------------------

  File: src/features/native-federation/native-discovery-search-header.tsx

  Purpose:

    Present straightforward Worlds search introductions and controls as one
    consistent Soapbox section.

  Responsibilities:

    * apply shared heading and description typography
    * preserve configured light, dark, and black themes
    * provide consistent responsive padding and section boundaries
    * delegate form behavior to NativeDiscoverySearchForm

  This file intentionally does NOT contain:

    * provider-specific copy or query policy
    * discovery requests or result rendering
    * specialized category, location, or media filters
*/

import type { ReactNode } from 'react';

import Text from '@/components/ui/text.tsx';

import NativeDiscoverySearchForm from './native-discovery-search-form.tsx';

import type { INativeDiscoverySearchForm } from './native-discovery-search-form.tsx';

interface INativeDiscoverySearchHeader extends INativeDiscoverySearchForm {
  description: ReactNode;
  title: ReactNode;
}

const NativeDiscoverySearchHeader = ({
  description,
  title,
  ...searchProps
}: INativeDiscoverySearchHeader) => (
  <div className='border-b border-gray-200 px-4 py-4 black:border-gray-800 dark:border-gray-800 sm:px-5'>
    <Text
      className='text-gray-950 black:text-white dark:text-white'
      size='lg'
      tag='h2'
      theme='inherit'
      weight='bold'
    >
      {title}
    </Text>

    <Text
      className='mt-1 max-w-3xl leading-6 text-gray-600 black:text-gray-300 dark:text-gray-300'
      size='sm'
      theme='inherit'
    >
      {description}
    </Text>

    <NativeDiscoverySearchForm {...searchProps} />
  </div>
);

export default NativeDiscoverySearchHeader;

/* end of src/features/native-federation/native-discovery-search-header.tsx */
