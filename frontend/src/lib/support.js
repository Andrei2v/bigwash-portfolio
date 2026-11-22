// Only a public Telegram username is accepted, never an arbitrary redirect or bot token.
export function telegramSupportURL(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim());
    const username = url.pathname.replace(/^\//, '').replace(/\/$/, '');
    if (url.protocol !== 'https:' || !['t.me', 'telegram.me'].includes(url.hostname) ||
      url.username || url.password || url.port || url.search || url.hash ||
      !/^[a-zA-Z][a-zA-Z0-9_]{3,31}$/.test(username) ||
      ['share', 'proxy', 'socks', 'login', 'joinchat', 'addstickers', 'addemoji', 'iv'].includes(username.toLowerCase())) return '';
    return 'https://t.me/' + username;
  } catch { return ''; }
}
