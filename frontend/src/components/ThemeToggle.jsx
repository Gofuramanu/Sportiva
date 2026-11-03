// src/components/ThemeToggle.jsx
import React, { useState, useEffect } from 'react';

const THEME_STORAGE_KEY = 'sportiva_theme';
const THEME_EVENT_NAME = 'sportiva-theme-change';

export function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function applyTheme(nextTheme) {
  const root = document.documentElement;
  if (nextTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  window.dispatchEvent(new CustomEvent(THEME_EVENT_NAME, { detail: nextTheme }));
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const syncListener = (e) => {
      if (e.detail && e.detail !== theme) {
        setTheme(e.detail);
      }
    };
    window.addEventListener(THEME_EVENT_NAME, syncListener);
    return () => window.removeEventListener(THEME_EVENT_NAME, syncListener);
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Ubah ke Tema Terang' : 'Ubah ke Tema Gelap'}
      title={isDark ? 'Beralih ke Light Theme (Sesuai Wireframe)' : 'Beralih ke Dark Theme'}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100/90 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200/80 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
    >
      {isDark ? (
        <>
          <svg
            className="h-3.5 w-3.5 text-amber-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="5" />
            <path
              strokeLinecap="round"
              d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            />
          </svg>
          <span>Light</span>
        </>
      ) : (
        <>
          <svg
            className="h-3.5 w-3.5 text-indigo-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
            />
          </svg>
          <span>Dark</span>
        </>
      )}
    </button>
  );
}

