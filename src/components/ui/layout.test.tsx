import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Layout from './layout.tsx';

describe('Layout', () => {
  it('allocates more desktop grid space to the post column', () => {
    const { container } = render(
      <Layout>
        <Layout.Sidebar>
          <span>Navigation</span>
        </Layout.Sidebar>
        <Layout.Main data-testid='main-column'>
          <span>Posts</span>
        </Layout.Main>
        <Layout.Aside>
          <span>Panels</span>
        </Layout.Aside>
      </Layout>,
    );

    expect(container.querySelector('.xl\\:col-span-2')).toBeInTheDocument();
    expect(screen.getByTestId('main-column')).toHaveClass('xl:col-span-7');
  });
});

/* end of src/components/ui/layout.test.tsx */
