import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from '@dr.pogodin/react-helmet';
import { render, renderHook, RenderHookOptions, RenderOptions } from '@testing-library/react';
import { merge } from 'immutable';
import { FC, ReactElement } from 'react';
import { Toaster } from 'react-hot-toast';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { Action, applyMiddleware, createStore } from 'redux';
import { thunk, type ThunkMiddleware } from 'redux-thunk';
import { afterAll, beforeAll } from 'vitest';

import { ChatProvider } from '@/contexts/chat-context.tsx';
import { StatProvider } from '@/contexts/stat-context.tsx';
import { queryClient } from '@/queries/client.ts';
import { instanceV1Schema, instanceV2Schema, upgradeInstance } from '@/schemas/instance.ts';

import { default as rootReducer } from '../reducers/index.ts';

import type { AppDispatch, RootState } from '@/store.ts';
import type { AnyAction, Reducer, Store } from 'redux';

// Mock Redux
// https://redux.js.org/recipes/writing-tests/
const rootState: RootState = rootReducer(undefined, {} as Action);
const testReducer = rootReducer as unknown as Reducer<RootState, AnyAction>;
const appThunk = thunk as unknown as ThunkMiddleware<RootState, AnyAction, {}>;
type TestStore = Store<RootState, AnyAction> & {
  dispatch: AppDispatch;
};

/** Apply actions to the state, one at a time. */
const applyActions = (state: any, actions: any, reducer: any) => {
  return actions.reduce((state: any, action: any) => reducer(state, action), state);
};

const createTestStore = (initialState: RootState) => createStore(testReducer, initialState, applyMiddleware(appThunk)) as unknown as TestStore;

const mockStore = (initialState: typeof rootState = rootState) => {
  const actions: AnyAction[] = [];
  const reducer: Reducer<RootState, AnyAction> = (state = initialState, action) => {
    if (action.type && !action.type.startsWith('@@redux/')) {
      actions.push(action);
    }

    return state;
  };

  const store = createStore(reducer, initialState, applyMiddleware(appThunk)) as unknown as TestStore & {
    clearActions(): void;
    getActions(): AnyAction[];
  };

  store.clearActions = () => {
    actions.length = 0;
  };

  store.getActions = () => actions;

  return store;
};

const seedInstanceQuery = (state: any) => {
  const instance = state?.instance;
  if (!instance) return;

  const instanceV2 = typeof instance.registrations === 'boolean'
    ? upgradeInstance(instanceV1Schema.parse(instance))
    : instanceV2Schema.parse(instance);

  queryClient.setQueryData(['instance', location.origin, 'v2'], instanceV2);
};

const TestApp: FC<any> = ({ children, storeProps, routerProps = {} }) => {
  let store: TestStore;
  let appState = rootState;

  if (storeProps && typeof storeProps.getState !== 'undefined') { // storeProps is a store
    store = storeProps;
    appState = store.getState();
  } else if (storeProps) { // storeProps is state
    appState = merge(rootState, storeProps) as RootState;
    store = createTestStore(appState);
  } else {
    store = createTestStore(appState);
  }

  seedInstanceQuery(appState);

  const props = {
    locale: 'en',
    store,
  };

  return (
    <div id='soapbox'>
      <Provider store={props.store}>
        <HelmetProvider>
          <MemoryRouter {...routerProps}>
            <StatProvider>
              <QueryClientProvider client={queryClient}>
                <ChatProvider>
                  <IntlProvider locale={props.locale}>
                    {children}

                    <Toaster />
                  </IntlProvider>
                </ChatProvider>
              </QueryClientProvider>
            </StatProvider>
          </MemoryRouter>
        </HelmetProvider>
      </Provider>
    </div>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
  store?: any,
  routerProps?: any,
) => render(ui, {
  wrapper: () => <TestApp children={ui} storeProps={store} routerProps={routerProps} />,
  ...options,
});

/** Like renderHook, but with access to the Redux store. */
const customRenderHook = <T extends { children?: React.ReactNode }>(
  callback: (props?: any) => any,
  options?: Omit<RenderHookOptions<T>, 'wrapper'>,
  store?: any,
) => {
  return renderHook(callback, {
    wrapper: ({ children }) => <TestApp children={children} storeProps={store} />,
    ...options,
  });
};

const mockWindowProperty = (property: any, value: any) => {
  const { [property]: originalProperty } = window;
  delete window[property];

  beforeAll(() => {
    Object.defineProperty(window, property, {
      configurable: true,
      writable: true,
      value,
    });
  });

  afterAll(() => {
    window[property] = originalProperty;
  });
};

export * from '@testing-library/react';
export {
  customRender as render,
  customRenderHook as renderHook,
  mockStore,
  applyActions,
  rootState,
  rootReducer,
  mockWindowProperty,
  createTestStore,
  queryClient,
};
