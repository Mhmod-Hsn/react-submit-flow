"use client";

import { useEffect, useState } from "react";

type Theme = "default" | "forest" | "high-contrast";
type ColorMode = "system" | "light" | "dark";
const storageKey = "react-submit-flow-theme";
const colorModeStorageKey = "react-submit-flow-color-mode";

export function ThemeSelector() {
  const [theme, setTheme] = useState<Theme>("default");
  const [colorMode, setColorMode] = useState<ColorMode>("system");
  const [systemDark, setSystemDark] = useState(false);
  const isDark = colorMode === "dark" || (colorMode === "system" && systemDark);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "forest" || saved === "high-contrast") {
      setTheme(saved);
      document.documentElement.dataset.theme = saved;
    }
    const savedMode = window.localStorage.getItem(colorModeStorageKey);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(prefersDark.matches);
    const syncSystemMode = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    prefersDark.addEventListener("change", syncSystemMode);
    if (savedMode === "light" || savedMode === "dark") {
      setColorMode(savedMode);
      document.documentElement.dataset.colorMode = savedMode;
    } else {
      setColorMode("system");
      document.documentElement.dataset.colorMode = "system";
    }
    return () => prefersDark.removeEventListener("change", syncSystemMode);
  }, []);

  const changeTheme = (value: Theme) => {
    setTheme(value);
    if (value === "default") {
      delete document.documentElement.dataset.theme;
      window.localStorage.removeItem(storageKey);
      return;
    }
    document.documentElement.dataset.theme = value;
    window.localStorage.setItem(storageKey, value);
  };

  const toggleColorMode = () => {
    const nextMode: ColorMode = isDark ? "light" : "dark";
    setColorMode(nextMode);
    document.documentElement.dataset.colorMode = nextMode;
    window.localStorage.setItem(colorModeStorageKey, nextMode);
  };

  return (
    <div className="theme-picker">
      <label htmlFor="site-theme">Theme</label>
      <select
        id="site-theme"
        aria-label="Choose site theme"
        value={theme}
        onChange={(event) => changeTheme(event.target.value as Theme)}
      >
        <option value="default">Default</option>
        <option value="forest">Forest</option>
        <option value="high-contrast">High contrast</option>
      </select>
      <button
        className="theme-toggle"
        type="button"
        onClick={toggleColorMode}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        {isDark ? "☀" : "☾"}
      </button>
    </div>
  );
}
