'use client';

import { useEffect, useState } from 'react';

type Theme = 'default' | 'forest' | 'high-contrast';
const storageKey = 'react-submit-flow-theme';

export function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>('default');

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === 'forest' || saved === 'high-contrast') {
      setTheme(saved);
      document.documentElement.dataset.theme = saved;
    }
  }, []);

  const changeTheme = (value: Theme) => {
    setTheme(value);
    if (value === 'default') {
      delete document.documentElement.dataset.theme;
      window.localStorage.removeItem(storageKey);
      return;
    }
    document.documentElement.dataset.theme = value;
    window.localStorage.setItem(storageKey, value);
  };

  return (
    <label className="theme-picker">
      <span>Theme</span>
      <select aria-label="Choose site theme" value={theme} onChange={(event) => changeTheme(event.target.value as Theme)}>
        <option value="default">Default</option>
        <option value="forest">Forest</option>
        <option value="high-contrast">High contrast</option>
      </select>
    </label>
  );
}
