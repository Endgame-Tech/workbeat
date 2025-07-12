// Theme options
type Theme = 'light' | 'dark';

// Theme service for handling theme preferences
export const themeService = {
  // Initialize theme based on localStorage or system preference
  initTheme(): boolean {
    // Check if theme is saved in localStorage
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      // Apply saved theme
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      return savedTheme === 'dark';
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
      localStorage.setItem('theme', prefersDark ? 'dark' : 'light');
      return prefersDark;
    }
  },
  
  // Toggle between light and dark themes
  toggleTheme(): Theme {
    const isDark = document.documentElement.classList.toggle('dark');
    const newTheme: Theme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    return newTheme;
  },
  
  // Get current theme
  getTheme(): Theme {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
};