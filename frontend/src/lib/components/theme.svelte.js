class ThemeManager {
  current = $state(
    (typeof window !== 'undefined' && localStorage.getItem('theme')) || 'light'
  );

  toggle() {
    this.current = this.current === 'light' ? 'dark' : 'light';
    this.apply();
  }

  apply() {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('theme', this.current);
    
    if (this.current === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

export const theme = new ThemeManager();
