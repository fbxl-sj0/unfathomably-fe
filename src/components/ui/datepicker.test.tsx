import { describe, expect, it, vi } from 'vitest';

import { fireEvent, queryAllByRole, render, screen, waitFor } from '@/jest/test-helpers.tsx';

import Datepicker from './datepicker.tsx';

describe('<Datepicker />', () => {
  it('defaults to the current date', () => {
    const handler = vi.fn();
    render(<Datepicker onChange={handler} />);
    const today = new Date();

    expect(screen.getByTestId('datepicker-month')).toHaveValue(String(today.getMonth()));
    expect(screen.getByTestId('datepicker-day')).toHaveValue(String(today.getDate()));
    expect(screen.getByTestId('datepicker-year')).toHaveValue(String(today.getFullYear()));
  });

  it('changes number of days based on selected month and year', async() => {
    const handler = vi.fn();
    render(<Datepicker onChange={handler} />);

    fireEvent.change(screen.getByTestId('datepicker-month'), { target: { value: '1' } });

    fireEvent.change(screen.getByTestId('datepicker-year'), { target: { value: '2020' } });

    let daySelect: HTMLElement;
    daySelect = document.querySelector('[data-testid="datepicker-day"]') as HTMLElement;
    await waitFor(() => {
      expect(queryAllByRole(daySelect, 'option')).toHaveLength(29);
    });

    fireEvent.change(screen.getByTestId('datepicker-year'), { target: { value: '2021' } });

    daySelect = document.querySelector('[data-testid="datepicker-day"]') as HTMLElement;
    await waitFor(() => {
      expect(queryAllByRole(daySelect, 'option')).toHaveLength(28);
    });
  });

  it('ranges from the current year to 120 years ago', () => {
    const handler = vi.fn();
    render(<Datepicker onChange={handler} />);
    const today = new Date();

    const yearSelect = document.querySelector('[data-testid="datepicker-year"]') as HTMLElement;
    expect(queryAllByRole(yearSelect, 'option')).toHaveLength(121);
    expect(queryAllByRole(yearSelect, 'option')[0]).toHaveValue(String(today.getFullYear()));
    expect(queryAllByRole(yearSelect, 'option')[120]).toHaveValue(String(today.getFullYear() - 120));
  });

  it('calls the onChange function when the inputs change', async() => {
    const handler = vi.fn();
    render(<Datepicker onChange={handler} />);
    const today = new Date();

    /**
     * A date with a different day, month, and year than today
     * so this test will always pass!
     */
    const notToday = new Date(
      today.getFullYear() - 1, // last year
      (today.getMonth() + 2) % 11, // two months from now (mod 11 because it's 0-indexed)
      (today.getDate() + 2) % 28, // 2 days from now (for timezone stuff)
    );

    const year = String(notToday.getFullYear());
    const day = String(notToday.getDate());

    expect(handler.mock.calls.length).toEqual(1);

    fireEvent.change(screen.getByTestId('datepicker-month'), { target: { value: String(notToday.getMonth()) } });

    await waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(2);
    });

    fireEvent.change(screen.getByTestId('datepicker-year'), { target: { value: year } });

    await waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(3);
    });

    fireEvent.change(screen.getByTestId('datepicker-day'), { target: { value: day } });

    await waitFor(() => {
      expect(handler).toHaveBeenCalledTimes(4);
    });
  });
});
