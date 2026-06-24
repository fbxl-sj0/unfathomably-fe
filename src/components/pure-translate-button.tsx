import languageIcon from '@tabler/icons/outline/language.svg';
import { FormattedMessage, useIntl } from 'react-intl';

import { translateStatus, undoStatusTranslation } from '@/actions/statuses.ts';
import Button from '@/components/ui/button.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useFeatures } from '@/hooks/useFeatures.ts';
import { useInstance } from '@/hooks/useInstance.ts';
import { Status as StatusEntity } from '@/schemas/index.ts';

interface IPureTranslateButton {
  status: StatusEntity;
}

const PureTranslateButton: React.FC<IPureTranslateButton> = ({ status }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const features = useFeatures();
  const { instance } = useInstance();

  const me = useAppSelector((state) => state.me);

  const {
    allow_remote: allowRemote,
    allow_unauthenticated: allowUnauthenticated,
    source_languages: sourceLanguages,
    target_languages: targetLanguages,
  } = instance.pleroma.metadata.translation;

  const sourceLanguage = status.language;
  const targetLanguage = getTargetLanguage(intl.locale, targetLanguages);
  const hasTranslatableSource = sourceLanguage ? targetLanguage !== sourceLanguage : !status.account.local;
  const renderTranslate = (me || allowUnauthenticated) && (allowRemote || status.account.local) && ['public', 'unlisted'].includes(status.visibility) && status.content.length > 0 && hasTranslatableSource;

  const supportsLanguages = (!sourceLanguage || !sourceLanguages || sourceLanguages.includes(sourceLanguage)) && !!targetLanguage;

  const handleTranslate: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();

    if (status.translation) {
      dispatch(undoStatusTranslation(status.id));
    } else {
      dispatch(translateStatus(status.id, targetLanguage));
    }
  };

  if (!features.translations || !renderTranslate || !supportsLanguages) return null;

  if (status.translation) {
    const languageNames = new Intl.DisplayNames([intl.locale], { type: 'language' });
    const detectedSourceLanguage = status.translation.detected_source_language || sourceLanguage;
    const languageName = getLanguageName(languageNames, detectedSourceLanguage);
    const provider     = status.translation.provider;

    return (
      <Stack space={3} alignItems='start'>
        <Button
          theme='muted'
          text={<FormattedMessage id='status.show_original' defaultMessage='Show original' />}
          icon={languageIcon}
          onClick={handleTranslate}
        />
        <Text theme='muted'>
          <FormattedMessage id='status.translated_from_with' defaultMessage='Translated from {lang} using {provider}' values={{ lang: languageName, provider }} />
        </Text>
      </Stack>
    );
  }

  return (
    <div>
      <Button
        theme='muted'
        text={<FormattedMessage id='status.translate' defaultMessage='Translate' />}
        icon={languageIcon}
        onClick={handleTranslate}
      />
    </div>

  );
};

const getLanguageName = (languageNames: Intl.DisplayNames, language?: string | null): string => {
  if (!language || language === 'auto') return 'unknown language';

  try {
    return languageNames.of(language) || language;
  } catch (_e) {
    return language;
  }
};

const getTargetLanguage = (locale: string, targetLanguages?: string[] | null): string | undefined => {
  if (!targetLanguages) return locale;
  if (targetLanguages.includes(locale)) return locale;

  const baseLocale = locale.split('-')[0];
  if (targetLanguages.includes(baseLocale)) return baseLocale;

  return undefined;
};

export default PureTranslateButton;
