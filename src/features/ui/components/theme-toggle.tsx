import { changeSetting } from '@/actions/settings.ts';
import { useAppDispatch } from '@/hooks/useAppDispatch.ts';
import { useSettings } from '@/hooks/useSettings.ts';

import ThemeSelector from './theme-selector.tsx';

type IThemeToggle = Pick<React.SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'name' | 'className'>;

/** Stateful theme selector. */
const ThemeToggle: React.FC<IThemeToggle> = ({ id, name, className }) => {
  const dispatch = useAppDispatch();
  const { themeMode } = useSettings();

  const handleChange = (themeMode: string) => {
    dispatch(changeSetting(['themeMode'], themeMode));
  };

  return (
    <ThemeSelector
      id={id}
      name={name}
      className={className}
      value={themeMode}
      onChange={handleChange}
    />
  );
};

export default ThemeToggle;
