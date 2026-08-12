import '@/polyfill/Promise.withResolvers.ts';
import '@/polyfill/crypto.randomUUID.ts';

const boot = async (): Promise<void> => {
  if (typeof Intl === 'undefined' || typeof Intl.PluralRules !== 'function') {
    try {
      await import('@formatjs/intl-pluralrules/polyfill.js');
    } catch (error) {
      console.error('Unable to load Intl.PluralRules compatibility support.', error);
    }
  }

  await import('@/boot.tsx');
};

void boot();
