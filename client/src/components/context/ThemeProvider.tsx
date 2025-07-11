import React, { createContext, useState, useContext, useEffect } from 'react';
import { themeService } from '../../services/themeService';
import { brandingService, BrandingSettings } from '../../services/brandingService';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDarkMode: boolean;
  branding: BrandingSettings;
  updateBranding: (settings: BrandingSettings) => void;
  resetBranding: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(
    themeService.getTheme()
  );
  const [branding, setBranding] = useState<BrandingSettings>(
    brandingService.getCurrentBranding()
  );

  const toggleTheme = () => {
    const newTheme = themeService.toggleTheme();
    setTheme(newTheme);
  };

  const updateBranding = (settings: BrandingSettings) => {
    brandingService.applyBranding(settings);
    setBranding(settings);
  };

  const resetBranding = () => {
    const defaultSettings: BrandingSettings = {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E3A8A',
      customBranding: false
    };
    brandingService.applyBranding(defaultSettings);
    setBranding(defaultSettings);
  };

  const isDarkMode = theme === 'dark';

  // Initialize branding on mount
  useEffect(() => {
    brandingService.initializeBranding(branding);
  }, []);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      isDarkMode, 
      branding, 
      updateBranding, 
      resetBranding 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};