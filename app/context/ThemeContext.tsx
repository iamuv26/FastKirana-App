import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { mmkvStorage } from '../../lib/storage';

interface ThemeContextProps {
  theme: ColorSchemeName;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ColorSchemeName>('light');

  useEffect(() => {
    Appearance.setColorScheme('light');
  }, []);

  const toggleTheme = () => {
    setTheme('light');
    Appearance.setColorScheme('light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { theme: 'light', toggleTheme: () => {} };
  }
  return ctx;
};

export default ThemeProvider;
