import languageIcon from '@tabler/icons/outline/language.svg';
import { FormattedMessage, useIntl } from 'react-intl';

import { translateStatus, undoStatusTranslation } from '@/actions/statuses.ts';
import HStack from '@/components/ui/hstack.tsx';
import Icon from '@/components/ui/icon.tsx';
import Spinner from '@/components/ui/spinner.tsx';
import Stack from '@/components/ui/stack.tsx';
import Text from '@/components/ui/text.tsx';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useAppSelector } from '@/hooks/useAppSelector.ts';
import { useFeatures } from '@/hooks/useFeatures.ts';
import { useInstance } from '@/hooks/useInstance.ts';
import { getStatusTranslationAvailability } from '@/utils/status-translation.ts';

import type { Status } from '@/types/entities.ts';

interface ITranslateButton {
  status: Status;
}

const TranslateButton: React.FC<ITranslateButton> = ({ status }) => {
  const dispatch = useAppDispatch();
  const intl = useIntl();
  const features = useFeatures();
  const { instance } = useInstance();

  const me = useAppSelector((state) => state.me);

  const {
    allow_remote: allowRemote,
    allow_unauthenticated: allowUnauthenticated,
    target_languages: targetLanguages,
    source_languages: sourceLanguages,
  } = instance.pleroma.metadata.translation;

  const sourceLanguage = status.language;
  const { canTranslate, targetLanguage } = getStatusTranslationAvailability({
    allowRemote,
    allowUnauthenticated,
    featuresEnabled: features.translations,
    locale: intl.locale,
    me,
    sourceLanguages,
    status,
    targetLanguages,
  });

  const translationLoading = status.translationLoading;

  const handleTranslate: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();

    if (translationLoading) {
      return;
    }

    if (status.translation) {
      dispatch(undoStatusTranslation(status.id));
    } else {
      dispatch(translateStatus(status.id, targetLanguage));
    }
  };

  if (!canTranslate) return null;

  if (translationLoading) {
    return (
      <Stack alignItems='start'>
        <HStack space={0.5} alignItems='center' justifyContent='start' className='text-primary-500'>
          <Spinner size={14} withText={false} />
          <Text className='!text-primary-500'>
            <FormattedMessage id='status.translating' defaultMessage='Translating...' />
          </Text>
        </HStack>
      </Stack>
    );
  }

  if (status.translation) {
    const languageNames = new Intl.DisplayNames([intl.locale], { type: 'language' });
    const detectedSourceLanguage = status.translation.get('detected_source_language') || sourceLanguage;
    const languageName = getLanguageName(languageNames, detectedSourceLanguage);
    const provider     = status.translation.get('provider');

    return (
      <Stack alignItems='start'>
        <HStack onClick={handleTranslate} space={0.5} alignItems='center' justifyContent='start' className='text-primary-500 hover:cursor-pointer'>
          <Icon src={languageIcon} size={14} />
          <Text className='!text-primary-500'>
            <FormattedMessage id='status.show_original' defaultMessage='Show original' />
          </Text>
        </HStack>
        <Text theme='muted'>
          <FormattedMessage id='status.translated_from_with' defaultMessage='Translated from {lang} using {provider}' values={{ lang: languageName, provider }} />
        </Text>
      </Stack>
    );
  }

  return (
    <Stack alignItems='start'>
      <HStack onClick={handleTranslate} space={0.5} alignItems='center' justifyContent='start' className='text-primary-500 hover:cursor-pointer'>
        <Icon src={languageIcon} size={14} />
        <Text className='!text-primary-500'>
          <FormattedMessage id='status.translate' defaultMessage='Translate' />
        </Text>
      </HStack>
    </Stack>

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

export default TranslateButton;
