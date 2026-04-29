import { useState, useEffect, useCallback } from 'react';

export const DICTAMD_API_KEY = 'dictamd_openai_key';

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState('');

  useEffect(() => {
    setApiKeyState(localStorage.getItem(DICTAMD_API_KEY) ?? '');

    const handler = (e: StorageEvent) => {
      if (e.key === DICTAMD_API_KEY) setApiKeyState(e.newValue ?? '');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const setApiKey = useCallback((key: string) => {
    if (key) {
      localStorage.setItem(DICTAMD_API_KEY, key);
    } else {
      localStorage.removeItem(DICTAMD_API_KEY);
    }
    setApiKeyState(key);
  }, []);

  return { apiKey, setApiKey };
}

export function getApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(DICTAMD_API_KEY) ?? '';
}
