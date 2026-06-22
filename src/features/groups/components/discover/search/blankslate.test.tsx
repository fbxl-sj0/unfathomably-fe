import { describe, expect, it } from 'vitest';

import { render, screen } from '@/jest/test-helpers.tsx';

import Blankslate from './blankslate.tsx';


describe('<Blankslate />', () => {
  describe('with string props', () => {
    it('should render correctly', () => {
      render(<Blankslate title='Title' subtitle='Subtitle' />);

      expect(screen.getByTestId('no-results')).toHaveTextContent('Title');
      expect(screen.getByTestId('no-results')).toHaveTextContent('Subtitle');
    });
  });

  describe('with node props', () => {
    it('should render correctly', () => {
      render(
        <Blankslate
          title={<span>Title</span>}
          subtitle={<span>Subtitle</span>}
        />);

      expect(screen.getByTestId('no-results')).toHaveTextContent('Title');
      expect(screen.getByTestId('no-results')).toHaveTextContent('Subtitle');
    });
  });
});