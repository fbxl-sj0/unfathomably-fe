import Spinner from '@/components/ui/spinner.tsx';

/** Fullscreen loading indicator. */
const LoadingScreen: React.FC = () => {
  return (
    <div
      className='fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-white black:bg-black dark:bg-primary-900'
      aria-busy='true'
    >
      <div className='p-4'>
        <Spinner size={40} withText={false} />
      </div>
    </div>
  );
};

export default LoadingScreen;
