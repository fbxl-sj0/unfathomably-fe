import { cleanup, render } from '@testing-library/react';
import hotToast, { Toaster } from 'react-hot-toast';
import { IntlProvider } from 'react-intl';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { HTTPError } from '@/api/HTTPError.ts';
import { MastodonResponse } from '@/api/MastodonResponse.ts';
import { act, screen } from '@/jest/test-helpers.tsx';

import toast from './toast.tsx';

let consoleError: ReturnType<typeof vi.spyOn>;

function renderApp() {
  return {
    toast,
    ...render(
      <IntlProvider locale='en'>
        <Toaster />,
      </IntlProvider>,
    ),
  };
}

beforeAll(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});

beforeEach(() => {
  hotToast.remove();
  cleanup();
});

afterEach(() => {
  act(() => {
    hotToast.remove();
  });

  cleanup();
  consoleError.mockClear();
});

afterAll(() => {
  consoleError.mockRestore();
});

describe('toasts', () =>{
  it('renders successfully', async() => {
    const { toast } = renderApp();

    act(() => {
      toast.success('hello');
    });

    expect(screen.getByTestId('toast')).toBeInTheDocument();
    expect(screen.getByTestId('toast-message')).toHaveTextContent('hello');
  });

  describe('actionable button', () => {
    it('renders the button', async() => {
      const { toast } = renderApp();

      act(() => {
        toast.success('hello', { action: () => null, actionLabel: 'click me' });
      });

      expect(screen.getByTestId('toast-action')).toHaveTextContent('click me');
    });

    it('does not render the button', async() => {
      const { toast } = renderApp();

      act(() => {
        toast.success('hello');
      });

      expect(screen.queryAllByTestId('toast-action')).toHaveLength(0);
    });
  });

  describe('showAlertForError()', () => {
    const buildError = (message: string, status: number): HTTPError => {
      const request = new Request('http://localhost:3000');

      const response = new MastodonResponse(JSON.stringify({ error: message }), {
        status,
        headers: {
          'Content-type': 'application/json',
        },
      });

      return new HTTPError(response, request);
    };

    describe('with a 502 status code', () => {
      it('renders the correct message', async() => {
        const message = 'The server is down';
        const error = buildError(message, 502);
        const { toast } = renderApp();

        await act(async () => {
          await toast.showAlertForError(error);
        });

        expect(screen.getByTestId('toast')).toBeInTheDocument();
        expect(screen.getByTestId('toast-message')).toHaveTextContent('The server is down');
      });
    });

    describe('with a 404 status code', () => {
      it('renders the correct message', async() => {
        const error = buildError('', 404);
        const { toast } = renderApp();

        await act(async () => {
          await toast.showAlertForError(error);
        });

        expect(screen.queryAllByTestId('toast')).toHaveLength(0);
      });
    });

    describe('with a 410 status code', () => {
      it('renders the correct message', async() => {
        const error = buildError('', 410);
        const { toast } = renderApp();

        await act(async () => {
          await toast.showAlertForError(error);
        });

        expect(screen.queryAllByTestId('toast')).toHaveLength(0);
      });
    });

    describe('with an accepted status code', () => {
      describe('with a message from the server', () => {
        it('renders the correct message', async() => {
          const message = 'custom message';
          const error = buildError(message, 200);
          const { toast } = renderApp();

          await act(async () => {
            await toast.showAlertForError(error);
          });

          expect(screen.getByTestId('toast')).toBeInTheDocument();
          expect(screen.getByTestId('toast-message')).toHaveTextContent(message);
        });
      });

      describe('without a message from the server', () => {
        it('renders the correct message', async() => {
          const message = 'The request has been accepted for processing';
          const error = buildError(message, 202);
          const { toast } = renderApp();

          await act(async () => {
            await toast.showAlertForError(error);
          });

          expect(screen.getByTestId('toast')).toBeInTheDocument();
          expect(screen.getByTestId('toast-message')).toHaveTextContent(message);
        });
      });
    });

    describe('without a response', () => {
      it('renders the default message', async() => {
        const error = { response: undefined } as unknown as HTTPError;
        const { toast } = renderApp();

        await act(async () => {
          await toast.showAlertForError(error);
        });

        expect(screen.getByTestId('toast')).toBeInTheDocument();
        expect(screen.getByTestId('toast-message')).toHaveTextContent('Something went wrong.');
      });
    });
  });
});
