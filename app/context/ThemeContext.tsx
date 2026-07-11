import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { mmkvStorage } from '../../lib/storage';

import { useColorScheme } from 'nativewind';

interface ThemeContextProps {
  theme: ColorSchemeName;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { setColorScheme } = useColorScheme();
  const [theme, setTheme] = useState<ColorSchemeName>('light');

  useEffect(() => {
    setColorScheme('light');
  }, []);

  const toggleTheme = () => {
    // Force light theme, ignore toggle
    setTheme('light');
    setColorScheme('light');
  };

  // Apply theme class to root <html> equivalent – using NativeWind, we add class to top view via className
  // We'll expose theme for consumers to set className="${theme}" on root view.

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};

export default ThemeProvider;
