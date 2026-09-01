import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('smartconveyor_theme');
      return saved === 'hematite' ? 'hematite' : 'obsidian';
    } catch {
      return 'hematite'; // Default to the new stunning Hematite Ore theme
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('smartconveyor_theme', theme);
    } catch (e) {
      console.warn('Could not save theme to localStorage:', e);
    }

    const root = document.documentElement;
    if (theme === 'hematite') {
      root.classList.add('theme-hematite');
      root.classList.remove('theme-obsidian', 'theme-cyber', 'dark', 'light');
      root.setAttribute('data-theme', 'hematite');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.add('theme-obsidian', 'dark');
      root.classList.remove('theme-hematite', 'theme-cyber', 'light');
      root.setAttribute('data-theme', 'obsidian');
      root.style.colorScheme = 'dark';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'hematite' ? 'obsidian' : 'hematite'));
  };

  const isHematite = theme === 'hematite';

  return (
    <ThemeContext.Provider value={{ theme, isHematite, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
