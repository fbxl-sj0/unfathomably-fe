import clsx from 'clsx';
import { Suspense } from 'react';
import StickyBox from 'react-sticky-box';

interface ISidebar {
  children: React.ReactNode;
}
interface IAside {
  children?: React.ReactNode;
}

interface ILayout {
  children: React.ReactNode;
}

interface LayoutComponent extends React.FC<ILayout> {
  Sidebar: React.FC<ISidebar>;
  Main: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  Aside: React.FC<IAside>;
}

/** Layout container, to hold Sidebar, Main, and Aside. */
const Layout: LayoutComponent = ({ children }) => (
  <div className='relative flex grow flex-col'>
    <div className='mx-auto w-full max-w-3xl grow sm:px-6 md:grid md:max-w-7xl md:grid-cols-12 md:gap-6 md:px-6 xl:max-w-[92rem]'>
      {children}
    </div>
  </div>
);

/** Left sidebar container in the UI. */
const Sidebar: React.FC<ISidebar> = ({ children }) => (
  <div className='desktop-sidebar lg:col-span-3 xl:col-span-2'>
    <StickyBox>
      {children}
    </StickyBox>
  </div>
);

/** Center column container in the UI. */
const Main: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...rest }) => (
  <main className={clsx('layout-main border-gray-200 bg-white pb-36 black:border-gray-800 black:bg-black dark:border-gray-800 dark:bg-primary-900 sm:pb-6 md:col-span-12', className)} {...rest}>
    {children}
  </main>
);

/** Right sidebar container in the UI. */
const Aside: React.FC<IAside> = ({ children }) => (
  <aside className='desktop-aside xl:col-span-3'>
    <StickyBox className='space-y-6 py-6 pb-12'>
      <Suspense>
        {children}
      </Suspense>
    </StickyBox>
  </aside>
);

Layout.Sidebar = Sidebar;
Layout.Main = Main;
Layout.Aside = Aside;

export default Layout;
