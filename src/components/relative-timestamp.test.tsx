import { expect, it } from 'vitest';

import { render } from '@/jest/test-helpers.tsx';

import RelativeTimestamp from './relative-timestamp.tsx';

it('exposes its timestamp as machine-readable time metadata', () => {
  const timestamp = '2025-03-26T16:14:08.000Z';
  const { container } = render(<RelativeTimestamp timestamp={timestamp} />);

  expect(container.querySelector('time')).toHaveAttribute('datetime', timestamp);
});
