import clsx from 'clsx';

import unfathomablyLogoDarkSrc from '@/assets/images/unfathomably-logo-dark.svg';
import unfathomablyLogoSrc from '@/assets/images/unfathomably-logo.svg';
import { useSettings } from '@/hooks/useSettings.ts';
import { useSoapboxConfig } from '@/hooks/useSoapboxConfig.ts';
import { useTheme } from '@/hooks/useTheme.ts';

interface ISiteLogo extends React.ComponentProps<'img'> {
  /** Extra class names for the <img> element. */
  className?: string;
  /** Override theme setting for <SitePreview /> */
  theme?: 'dark' | 'light';
}

/** Display the most appropriate site logo based on the theme and configuration. */
const SiteLogo: React.FC<ISiteLogo> = ({ className, theme, ...rest }) => {
  const { logo, logoDarkMode } = useSoapboxConfig();
  const { demo } = useSettings();

  let darkMode = ['dark', 'black'].includes(useTheme());
  if (theme === 'dark') darkMode = true;

  const defaultLogo = darkMode ? unfathomablyLogoDarkSrc : unfathomablyLogoSrc;

  // Use the right logo if provided, then use fallbacks.
  const getSrc = () => {
    // Demo mode should ignore instance branding and show the built-in project logo.
    if (demo) return defaultLogo;

    return (darkMode && logoDarkMode)
      ? logoDarkMode
      : logo || logoDarkMode || defaultLogo;
  };

  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <img
      className={clsx('object-contain', className)}
      src={getSrc()}
      {...rest}
    />
  );
};

export default SiteLogo;
