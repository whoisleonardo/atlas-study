import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { S, type Lang, type Strings } from '../constants/strings';

const LANG_KEY = 'atlas_lang';
let _lang: Lang = 'pt';
const listeners = new Set<(l: Lang) => void>();

export async function loadLanguage(): Promise<Lang> {
  const stored = await AsyncStorage.getItem(LANG_KEY);
  if (stored === 'en' || stored === 'pt') _lang = stored;
  return _lang;
}

export async function setLanguage(lang: Lang): Promise<void> {
  _lang = lang;
  await AsyncStorage.setItem(LANG_KEY, lang);
  listeners.forEach((l) => l(lang));
}

export function getCurrentLang(): Lang {
  return _lang;
}

export function useLanguage(): { lang: Lang; t: Strings; setLang: (l: Lang) => Promise<void> } {
  const [lang, setLang] = useState<Lang>(_lang);

  useEffect(() => {
    listeners.add(setLang);
    return () => { listeners.delete(setLang); };
  }, []);

  return { lang, t: S[lang] as Strings, setLang: setLanguage };
}
