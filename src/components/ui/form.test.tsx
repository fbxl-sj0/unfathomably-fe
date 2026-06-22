import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '@/jest/test-helpers.tsx';

import Form from './form.tsx';

describe('<Form />', () => {
  it('renders children', () => {
    const onSubmitMock = vi.fn();
    render(
      <Form onSubmit={onSubmitMock}>children</Form>,
    );

    expect(screen.getByTestId('form')).toHaveTextContent('children');
  });

  it('handles onSubmit prop', () => {
    const onSubmitMock = vi.fn();
    render(
      <Form onSubmit={onSubmitMock}>children</Form>,
    );

    fireEvent.submit(
      screen.getByTestId('form'), {
        preventDefault: () => {},
      },
    );
    expect(onSubmitMock).toHaveBeenCalled();
  });
});
