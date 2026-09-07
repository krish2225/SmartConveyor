import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'industrial',
  setTheme: () => {},
  toggleTheme: () => {}
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('smartconveyor_theme') || 'industrial';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'dark');

    if (theme === 'dark') {
      root.classList.add('theme-dark', 'dark');
    } else if (theme === 'light') {
      root.classList.add('theme-light');
    }
    // Default 'industrial' has no class modifier since :root is the Industrial Cobalt Slate palette

    localStorage.setItem('smartconveyor_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'industrial' ? 'dark' : prev === 'dark' ? 'light' : 'industrial'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
