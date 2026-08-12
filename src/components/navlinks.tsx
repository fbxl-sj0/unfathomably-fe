import BrowserLink from '@/components/browser-link.tsx';
import Text from '@/components/ui/text.tsx';
import { useSettings } from '@/hooks/useSettings.ts';
import { useSoapboxConfig } from '@/hooks/useSoapboxConfig.ts';

interface INavlinks {
  type: 'homeFooter';
}

const Navlinks: React.FC<INavlinks> = ({ type }) => {
  const { locale } = useSettings();
  const { copyright, navlinks } = useSoapboxConfig();

  return (
    <footer className='relative mx-auto mt-auto max-w-7xl py-8'>
      <div className='flex flex-wrap justify-center'>
        {navlinks.get(type)?.map((link, idx) => {
          const url = link.url;

          return (
            <div key={idx} className='px-5 py-2'>
              <BrowserLink href={url} className='text-primary-600 hover:underline dark:text-primary-400'>
                <Text tag='span' theme='inherit' size='sm'>
                  {(link.getIn(['titleLocales', locale]) || link.get('title')) as string}
                </Text>
              </BrowserLink>
            </div>
          );
        })}
      </div>

      <div className='mt-6'>
        <Text theme='muted' align='center' size='sm'>{copyright}</Text>
      </div>
    </footer>
  );
};

export { Navlinks };
