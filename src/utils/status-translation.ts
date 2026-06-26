const DEFAULT_TRANSLATION_VISIBILITIES = ['public', 'unlisted'];
const MANUAL_TRANSLATION_VISIBILITIES = ['public', 'unlisted', 'group'];

interface StatusTranslationSubject {
  account: {
    local: boolean;
  };
  content: string;
  language?: string | null;
  translation?: unknown;
  visibility: string;
}

interface StatusTranslationAvailabilityOptions {
  allowRemote?: boolean | null;
  allowUnauthenticated?: boolean | null;
  featuresEnabled: boolean;
  locale: string;
  manual?: boolean;
  me?: unknown;
  sourceLanguages?: string[] | null;
  status: StatusTranslationSubject;
  targetLanguages?: string[] | null;
}

const getTargetLanguage = (locale: string, targetLanguages?: string[] | null): string | undefined => {
  if (!targetLanguages) return locale;
  if (targetLanguages.includes(locale)) return locale;

  const baseLocale = locale.split('-')[0];
  if (targetLanguages.includes(baseLocale)) return baseLocale;

  return undefined;
};

const getStatusTranslationAvailability = ({
  allowRemote,
  allowUnauthenticated,
  featuresEnabled,
  locale,
  manual = false,
  me,
  sourceLanguages,
  status,
  targetLanguages,
}: StatusTranslationAvailabilityOptions) => {
  const targetLanguage = getTargetLanguage(locale, targetLanguages);
  const translated = Boolean(status.translation);
  const sourceLanguage = status.language;

  const authenticated = Boolean(me) || Boolean(allowUnauthenticated);
  const remoteAllowed = Boolean(allowRemote) || status.account.local;
  const allowedVisibilities = manual ? MANUAL_TRANSLATION_VISIBILITIES : DEFAULT_TRANSLATION_VISIBILITIES;
  const visibilityAllowed = allowedVisibilities.includes(status.visibility);
  const hasContent = status.content.length > 0;

  const sourceSupported = !sourceLanguage || !sourceLanguages || sourceLanguages.includes(sourceLanguage);
  const hasTranslatableSource = sourceLanguage ? targetLanguage !== sourceLanguage : !status.account.local;
  const languageAllowed = manual || (sourceSupported && hasTranslatableSource);
  const targetAvailable = translated || Boolean(targetLanguage);

  return {
    canTranslate: featuresEnabled && authenticated && remoteAllowed && visibilityAllowed && hasContent && targetAvailable && (translated || languageAllowed),
    targetLanguage,
  };
};

export {
  getStatusTranslationAvailability,
  getTargetLanguage,
};
