import { lazy, Suspense, useState, useEffect } from 'react';
import { IntlProvider } from 'react-intl';

import { fetchMe } from '@/actions/me.ts';
import { fetchSoapboxConfig } from '@/actions/soapbox.ts';
import LoadingScreen from '@/components/loading-screen.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useInstance } from '@/hooks/useInstance.ts';
import { useLocale } from '@/hooks/useLocale.ts';
import { useOwnAccount } from '@/hooks/useOwnAccount.ts';
import MESSAGES from '@/messages.ts';

const NostrRuntime = lazy(() => import('./nostr-runtime.tsx'));

interface ISoapboxLoad {
  children: React.ReactNode;
}

/** Initial data loader. */
const SoapboxLoad: React.FC<ISoapboxLoad> = ({ children }) => {
  const dispatch = useAppDispatch();

  const me = useAppSelector(state => state.me);
  const { account } = useOwnAccount();
  const instance = useInstance();
  const swUpdating = useAppSelector(state => state.meta.swUpdating);
  const { locale } = useLocale();

  const [messages, setMessages] = useState<Record<string, string>>({});
  const [localeLoading, setLocaleLoading] = useState(true);
  const [accountLoading, setAccountLoading] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);

  /** Whether to display a loading indicator. */
  const showLoading = [
    me === null,
    me && !account,
    accountLoading,
    configLoading,
    localeLoading,
    instance.isLoading,
    swUpdating,
  ].some(Boolean);

  // Load the user's locale
  useEffect(() => {
    let active = true;

    const loadMessages = async () => {
      setLocaleLoading(true);

      try {
        const loadedMessages = await MESSAGES[locale]();

        if (active) {
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error(`Unable to load messages for locale "${locale}".`, error);

        try {
          const fallbackMessages = locale === 'en' ? {} : await MESSAGES.en();

          if (active) {
            setMessages(fallbackMessages);
          }
        } catch (fallbackError) {
          console.error('Unable to load fallback English messages.', fallbackError);

          if (active) {
            setMessages({});
          }
        }
      } finally {
        if (active) {
          setLocaleLoading(false);
        }
      }
    };

    void loadMessages();

    return () => {
      active = false;
    };
  }, [locale]);

  // Account verification does not depend on instance feature discovery.
  // Starting it immediately removes an avoidable request waterfall for signed-in users.
  useEffect(() => {
    let active = true;

    const loadAccount = async () => {
      try {
        await dispatch(fetchMe());
      } catch (error) {
        console.error(error);
      } finally {
        if (active) {
          setAccountLoading(false);
        }
      }
    };

    void loadAccount();

    return () => {
      active = false;
    };
  }, [dispatch]);

  // Frontend configuration selection depends on backend feature metadata, so
  // it starts as soon as instance discovery finishes rather than before it.
  useEffect(() => {
    if (instance.isLoading) {
      return;
    }

    let active = true;

    const loadConfig = async () => {
      try {
        await dispatch(fetchSoapboxConfig());
      } catch (error) {
        console.error(error);
      } finally {
        if (active) {
          setConfigLoading(false);
        }
      }
    };

    void loadConfig();

    return () => {
      active = false;
    };
  }, [dispatch, instance.isLoading]);

  // intl is part of loading.
  // It's important nothing in here depends on intl.
  if (showLoading) {
    return <LoadingScreen />;
  }

  return (
    <IntlProvider locale={locale} messages={messages}>
      <Suspense fallback={null}>
        <NostrRuntime />
      </Suspense>
      {children}
    </IntlProvider>
  );
};

export default SoapboxLoad;
