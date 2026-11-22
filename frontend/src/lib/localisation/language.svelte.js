import { browser } from '$app/environment';
import { t as ua } from './ua.js';
import { t as ru } from './ru.js';

function storedLanguage() {
  if (browser) {
    try {
      return localStorage.getItem('bigwash.lang') === 'RU' ? 'RU' : 'UA';
    } catch {
      // Storage can be unavailable.
    }
  }
  return 'UA';
}
const get = (dictionary, key) => key.split('.').reduce((value, part) => value?.[part], dictionary);
const sourceKeys = new Map();

// Index explicit system labels without traversing or rewriting user data.
function index(dictionary, prefix = '') {
  for (const [key, value] of Object.entries(dictionary)) {
    const path = prefix + key;
    if (typeof value === 'string' && !sourceKeys.has(value)) sourceKeys.set(value, path);
    else if (value && !Array.isArray(value) && typeof value === 'object') index(value, path + '.');
  }
}
index(ua);
index(ru);

class LanguageManager {
  // A shared rune-backed instance updates open forms without remounting them.
  current = $state(storedLanguage());

  get locale() {
    return this.current === 'RU' ? 'ru-RU' : 'uk-UA';
  }

  set(value) {
    this.current = value === 'RU' ? 'RU' : 'UA';
    if (browser) {
      try {
        localStorage.setItem('bigwash.lang', this.current);
      } catch {
        // Keep the in-memory choice.
      }
      this.apply();
    }
  }

  apply() {
    if (browser) document.documentElement.lang = this.current === 'RU' ? 'ru' : 'uk';
  }

  t(key, parameters = {}) {
    const value = get(this.current === 'RU' ? ru : ua, key) ?? get(ua, key) ?? key;
    if (typeof value !== 'string') return value;
    return value.replace(/\{(\w+)\}/g, (match, name) => parameters[name] == null ? match : String(parameters[name]));
  }

  // Only explicit system labels, never arbitrary user data.
  translate(value) {
    const key = sourceKeys.get(value);
    return key ? this.t(key) : value;
  }

  // Match system enums in either language without changing the stored value or query.
  matchesSystem(value, query) {
    const key = sourceKeys.get(value);
    const variants = key ? [value, get(ua, key), get(ru, key)] : [value];
    const search = String(query).toLowerCase();
    return variants.some(text => typeof text === 'string' && text.toLowerCase().includes(search));
  }

  number(value, options = {}) {
    return Number(value).toLocaleString(this.locale, options);
  }

  plural(key, count) {
    const form = new Intl.PluralRules(this.locale).select(count);
    return this.t(key + '.' + form, { count });
  }

  date(value, options = {}) {
    const date = value instanceof Date ? value : new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + 'T12:00:00' : value);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString(this.locale, options) : String(value ?? '');
  }
}

export const language = new LanguageManager();
