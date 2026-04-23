/**
 * HabitTracker – ThemeContext.tsx
 * Author: Ronan Fernando (2025/2026)
 *
 * What's original (own work):
 * Theme context structure and toggle logic.
 *
 * Adapted from:
 * IS4447 Lab workspace - React Context pattern.
 * expo-sqlite for persisting theme preference locally.
 * React Context API — https://react.dev/reference/react/createContext
 * Expo SQLite for persistence — https://docs.expo.dev/versions/latest/sdk/sqlite/
 * MaterialCommunityIcons (weather-sunny, weather-night) — https://icons.expo.fyi
 *
 * AI assistance (Claude, Anthropic, 2026):
 * Assisted with creating the theme context provider with
 * local persistence using AsyncStorage pattern via SQLite.
 *
 * 
 *
 * I understand and can explain all code in this file.
 */

import { sqlite } from '@/db/client';
import { createContext, useContext, useEffect, useState } from 'react';

type ThemeContextType = {
  dark: boolean;
  toggleTheme: () => void;
  colors: typeof lightColors;
};

const lightColors = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  primary: '#5f90a7',
  inputBg: '#FFFFFF',
  inputBorder: '#CBD5E1',
  filterBg: '#FFFFFF',
  filterBorder: '#94A3B8',
  filterSelectedBg: '#0F172A',
  filterSelectedText: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
};

const darkColors = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#334155',
  primary: '#b580fa',
  inputBg: '#1E293B',
  inputBorder: '#475569',
  filterBg: '#1E293B',
  filterBorder: '#475569',
  filterSelectedBg: '#F1F5F9',
  filterSelectedText: '#0F172A',
  tabBar: '#1E293B',
  tabBarBorder: '#334155',
};

export const ThemeContext = createContext<ThemeContextType>({
  dark: false,
  toggleTheme: () => {},
  colors: lightColors,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // load saved theme preference
    try {
      const result = sqlite.getFirstSync<{ value: string }>(
        `SELECT value FROM settings WHERE key = 'theme'`
      );
      if (result?.value === 'dark') setDark(true);
    } catch {
      // Settings table might not exist yet, create it
      sqlite.execSync(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !dark;
    setDark(newDark);
    try {
      sqlite.execSync(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`);
      sqlite.execSync(
        `INSERT OR REPLACE INTO settings (key, value) VALUES ('theme', '${newDark ? 'dark' : 'light'}')`
      );
    } catch (e) {
      console.log('Error saving theme:', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ dark, toggleTheme, colors: dark ? darkColors : lightColors }}>
      {children}
    </ThemeContext.Provider>
  );
}