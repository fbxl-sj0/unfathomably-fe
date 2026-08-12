/*
  Project: Unfathomably FE native federation
  -------------------------------------------

  File: src/components/native-model-resource.tsx

  Purpose:

      Present Manyfold-style model resources as understandable, deliberate
      file actions without automatically downloading or parsing remote assets.

  Responsibilities:

      * distinguish direct model files from source pages
      * show available filename, format, and license context
      * keep all remote access behind an explicit user action

  This file intentionally does NOT contain:

      * WebGL rendering
      * automatic remote file requests
      * trust decisions based on remote hostnames
*/

import cubeIcon from '@tabler/icons/outline/cube.svg';
import { FormattedMessage } from 'react-intl';

import Icon from '@/components/ui/icon.tsx';
import Text from '@/components/ui/text.tsx';

import { describeModelResource } from './native-resource-workflows.ts';

interface INativeModelResource {
  canonicalUrl: unknown;
  fileFormat?: unknown;
  fileName?: unknown;
  license?: unknown;
  resourceUrl?: unknown;
}

const NativeModelResource: React.FC<INativeModelResource> = ({ canonicalUrl, fileFormat, fileName, license, resourceUrl }) => {
  const resource = describeModelResource(resourceUrl || canonicalUrl, fileName, fileFormat);

  if (!resource) return null;

  const licenseLabel = typeof license === 'string' && license.trim() ? license.trim() : null;

  return (
    <section className='border-b border-gray-200 p-3 black:border-gray-800 dark:border-gray-700' data-testid='native-model-resource'>
      <div className='flex items-start gap-3 rounded-lg border border-solid border-gray-200 bg-white p-3 black:border-gray-800 black:bg-black dark:border-gray-700 dark:bg-primary-900'>
        <Icon className='mt-0.5 text-primary-600 dark:text-primary-300' src={cubeIcon} />
        <div className='min-w-0 flex-1'>
          <Text weight='semibold'>
            {resource.fileName || <FormattedMessage id='status.native.model_resource' defaultMessage='3D model resource' />}
          </Text>
          <Text className='mt-1' size='sm' theme='muted'>
            {[resource.format, licenseLabel].filter(Boolean).join(' / ') || (
              <FormattedMessage id='status.native.model_source_description' defaultMessage='Model details are available at the source.' />
            )}
          </Text>
          <Text className='mt-1' size='sm' theme='muted'>
            <FormattedMessage id='status.native.model_safety' defaultMessage='The remote file is opened only when you choose.' />
          </Text>
          <a
            className='mt-2 inline-flex rounded-md border border-solid border-primary-300 bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-800 hover:bg-primary-100 dark:border-primary-700 dark:bg-primary-950/40 dark:text-primary-200 dark:hover:bg-primary-900'
            href={resource.url}
            target='_blank'
            rel='noopener'
          >
            {resource.isDirectFile ? (
              <FormattedMessage id='status.native.download_model' defaultMessage='Download model file' />
            ) : (
              <FormattedMessage id='status.native.open_model_source' defaultMessage='Open model source' />
            )}
          </a>
        </div>
      </div>
    </section>
  );
};

export default NativeModelResource;

/* end of native-model-resource.tsx */
