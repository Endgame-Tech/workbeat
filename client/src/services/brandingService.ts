interface BrandingSettings {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  darkModeEnabled?: boolean;
  customBranding?: boolean;
  companyName?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
}

class BrandingService {
  private static instance: BrandingService;
  private currentBranding: BrandingSettings = {};

  static getInstance(): BrandingService {
    if (!BrandingService.instance) {
      BrandingService.instance = new BrandingService();
    }
    return BrandingService.instance;
  }

  // Apply comprehensive branding settings to the DOM
  applyBranding(settings: BrandingSettings): void {
    this.currentBranding = { ...settings };
    
    if (!settings.customBranding) {
      this.resetToDefaults();
      return;
    }

    this.applyComprehensiveColors(settings);
    this.applyLogo(settings);
    this.updateMetaThemeColor(settings.primaryColor);
    this.updateAppTitle(settings);
    this.applyAdaptiveDarkMode(settings);
  }

  // Apply comprehensive color scheme to all UI elements
  private applyComprehensiveColors(settings: BrandingSettings): void {
    const root = document.documentElement;
    
    if (settings.primaryColor) {
      // Generate complete primary color palette
      const primaryPalette = this.generateColorPalette(settings.primaryColor);
      
      // Apply primary color palette
      root.style.setProperty('--primary-color', settings.primaryColor);
      Object.entries(primaryPalette).forEach(([shade, color]) => {
        root.style.setProperty(`--primary-${shade}`, color);
      });
      
      // Apply primary color variations
      root.style.setProperty('--color-primary', settings.primaryColor);
      root.style.setProperty('--color-primary-hover', primaryPalette['600']);
      root.style.setProperty('--color-primary-active', primaryPalette['700']);
      root.style.setProperty('--color-primary-light', primaryPalette['100']);
      root.style.setProperty('--color-primary-dark', primaryPalette['800']);
      
      // Navigation colors
      root.style.setProperty('--color-nav-border', primaryPalette['100']);
      root.style.setProperty('--color-nav-item-hover', primaryPalette['50']);
      root.style.setProperty('--color-nav-item-active', settings.primaryColor);
      
      // Sidebar colors
      root.style.setProperty('--color-sidebar-border', primaryPalette['100']);
      root.style.setProperty('--color-sidebar-item-hover', primaryPalette['50']);
      root.style.setProperty('--color-sidebar-item-active', settings.primaryColor);
      
      // Card and surface colors
      root.style.setProperty('--color-card-border', primaryPalette['100']);
      root.style.setProperty('--color-card-hover', primaryPalette['25']);
      
      // Interactive elements
      root.style.setProperty('--color-button-primary', settings.primaryColor);
      root.style.setProperty('--color-button-primary-hover', primaryPalette['600']);
      root.style.setProperty('--color-button-primary-active', primaryPalette['700']);
      
      // Form elements
      root.style.setProperty('--color-input-border-focus', settings.primaryColor);
      root.style.setProperty('--color-focus-ring', settings.primaryColor);
      
      // Links
      root.style.setProperty('--color-link', primaryPalette['600']);
      root.style.setProperty('--color-link-hover', primaryPalette['700']);
      root.style.setProperty('--color-link-visited', primaryPalette['800']);
      
      // Borders
      root.style.setProperty('--color-border', primaryPalette['200']);
      root.style.setProperty('--color-border-light', primaryPalette['100']);
      root.style.setProperty('--color-divider', primaryPalette['150']);
      
      // Info status adapts to brand
      root.style.setProperty('--color-info', settings.primaryColor);
      
      // Gradients
      root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${settings.primaryColor}, ${primaryPalette['700']})`);
      root.style.setProperty('--gradient-surface', `linear-gradient(135deg, ${primaryPalette['25']}, ${primaryPalette['50']})`);
    }

    if (settings.secondaryColor) {
      // Generate complete secondary color palette
      const secondaryPalette = this.generateColorPalette(settings.secondaryColor);
      
      // Apply secondary color palette
      root.style.setProperty('--secondary-color', settings.secondaryColor);
      Object.entries(secondaryPalette).forEach(([shade, color]) => {
        root.style.setProperty(`--secondary-${shade}`, color);
      });
      
      // Apply secondary color variations
      root.style.setProperty('--color-secondary', settings.secondaryColor);
      root.style.setProperty('--color-secondary-hover', secondaryPalette['600']);
      root.style.setProperty('--color-secondary-active', secondaryPalette['700']);
      root.style.setProperty('--color-button-secondary', settings.secondaryColor);
      root.style.setProperty('--color-button-secondary-hover', secondaryPalette['600']);
      
      // Secondary gradient
      root.style.setProperty('--gradient-secondary', `linear-gradient(135deg, ${settings.secondaryColor}, ${secondaryPalette['700']})`);
    }

    // Update legacy CSS variables for backward compatibility
    this.updateLegacyVariables(settings);
    
    // Apply colors to existing elements
    this.updateExistingElements(settings);
  }

  // Apply adaptive dark mode colors based on brand color
  private applyAdaptiveDarkMode(settings: BrandingSettings): void {
    if (!settings.primaryColor) return;
    
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');
    
    if (isDark) {
      const primaryPalette = this.generateColorPalette(settings.primaryColor);
      
      // Dark mode navigation colors adapted to brand
      root.style.setProperty('--color-nav-border', primaryPalette['800']);
      root.style.setProperty('--color-nav-item-hover', primaryPalette['900']);
      root.style.setProperty('--color-nav-item-active', primaryPalette['600']);
      
      // Dark mode sidebar colors adapted to brand
      root.style.setProperty('--color-sidebar-border', primaryPalette['800']);
      root.style.setProperty('--color-sidebar-item-hover', primaryPalette['900']);
      root.style.setProperty('--color-sidebar-item-active', primaryPalette['600']);
      
      // Dark mode card colors adapted to brand
      root.style.setProperty('--color-card-border', primaryPalette['800']);
      root.style.setProperty('--color-card-hover', primaryPalette['900']);
      
      // Dark mode borders adapted to brand
      root.style.setProperty('--color-border', primaryPalette['700']);
      root.style.setProperty('--color-border-light', primaryPalette['800']);
      root.style.setProperty('--color-divider', this.blendColors(primaryPalette['700'], primaryPalette['800'], 0.5));
      
      // Dark mode surface gradient adapted to brand
      root.style.setProperty('--gradient-surface', `linear-gradient(135deg, ${primaryPalette['900']}, ${primaryPalette['800']})`);
    }
  }

  // Update legacy CSS variables for backward compatibility
  private updateLegacyVariables(settings: BrandingSettings): void {
    const root = document.documentElement;
    
    if (settings.primaryColor) {
      root.style.setProperty('--btn-primary-bg', settings.primaryColor);
      root.style.setProperty('--btn-primary-hover', this.darkenColor(settings.primaryColor, 10));
      root.style.setProperty('--link-color', this.darkenColor(settings.primaryColor, 5));
      root.style.setProperty('--link-hover', this.darkenColor(settings.primaryColor, 15));
      root.style.setProperty('--focus-ring-color', this.addAlpha(settings.primaryColor, 0.3));
    }
  }

  // Update existing DOM elements with new colors
  private updateExistingElements(settings: BrandingSettings): void {
    if (!settings.primaryColor) return;

    // Update navigation elements
    this.updateElementsWithSelectors([
      'nav', '.navigation', '.navbar', 
      '.nav-item.active', '.nav-link.active'
    ], {
      backgroundColor: settings.primaryColor,
      borderColor: settings.primaryColor
    });

    // Update sidebar elements
    this.updateElementsWithSelectors([
      '.sidebar-item.active', '.menu-item.active'
    ], {
      backgroundColor: settings.primaryColor,
      borderColor: settings.primaryColor
    });

    // Update button elements
    this.updateElementsWithSelectors([
      '.btn-primary', '.button-primary',
      '[data-variant="primary"]'
    ], {
      backgroundColor: settings.primaryColor,
      borderColor: settings.primaryColor
    });

    // Update accent elements
    this.updateElementsWithSelectors([
      '.accent', '.highlight', '.badge-primary',
      '.tab-active', '.tab.active'
    ], {
      backgroundColor: settings.primaryColor,
      borderColor: settings.primaryColor
    });

    // Update link elements
    this.updateElementsWithSelectors([
      '.text-primary', 'a.primary', '.link-primary'
    ], {
      color: settings.primaryColor
    });
    
    // Update additional UI elements
    this.updateUIElements(settings);
  }

  // Helper method to update elements with specific selectors
  private updateElementsWithSelectors(selectors: string[], styles: { [key: string]: string | null }): void {
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element instanceof HTMLElement) {
          Object.entries(styles).forEach(([property, value]) => {
            // If value is null, set the style property to an empty string to effectively remove it
            // Otherwise, apply the value.
            element.style.setProperty(property, value !== null ? value : '');
          });
        }
      });
    });
  }

  // Update meta theme color for mobile browsers
  private updateMetaThemeColor(color?: string): void {
    if (!color) return;

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute('content', color);
  }

  // Update favicon
  private updateFavicon(logoUrl: string): void {
    let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = logoUrl;
  }

  // Update UI elements with new colors
  private updateUIElements(settings: BrandingSettings): void {
    const root = document.documentElement;
    
    // Update button colors
    if (settings.primaryColor) {
      root.style.setProperty('--btn-primary-bg', settings.primaryColor);
      root.style.setProperty('--btn-primary-hover', this.darkenColor(settings.primaryColor, 10));
    }

    // Update link colors
    if (settings.primaryColor) {
      root.style.setProperty('--link-color', settings.primaryColor);
      root.style.setProperty('--link-hover', this.darkenColor(settings.primaryColor, 15));
    }

    // Update focus colors
    if (settings.primaryColor) {
      root.style.setProperty('--focus-ring-color', this.addAlpha(settings.primaryColor, 0.3));
    }
  }

  // Reset to default theme
  private resetToDefaults(): void {
    const root = document.documentElement;
    
    // Reset to default colors
    const defaultPrimary = '#3B82F6';
    const defaultSecondary = '#1E3A8A';
    
    root.style.setProperty('--primary-color', defaultPrimary);
    root.style.setProperty('--secondary-color', defaultSecondary);
    
    // Reset logo elements
    const logoElements = document.querySelectorAll('[data-branding="logo"]');
    logoElements.forEach((element) => {
      if (element instanceof HTMLImageElement) {
        element.src = '/default-logo.png'; // You can set a default logo path
        element.alt = 'WorkBeat Logo';
      }
    });

    // Remove custom CSS properties
    this.removeCustomProperties();
  }

  // Remove all custom CSS properties
  private removeCustomProperties(): void {
    const root = document.documentElement;
    const customProps = [
      '--primary-50', '--primary-100', '--primary-200', '--primary-300', '--primary-400',
      '--primary-500', '--primary-600', '--primary-700', '--primary-800', '--primary-900',
      '--secondary-50', '--secondary-100', '--secondary-200', '--secondary-300', '--secondary-400',
      '--secondary-500', '--secondary-600', '--secondary-700', '--secondary-800', '--secondary-900',
      '--btn-primary-bg', '--btn-primary-hover', '--link-color', '--link-hover', '--focus-ring-color'
    ];

    customProps.forEach(prop => {
      root.style.removeProperty(prop);
    });
  }

  // Enhanced color utility functions
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  private lightenColor(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const factor = percent / 100;
    const newR = Math.round(rgb.r + (255 - rgb.r) * factor);
    const newG = Math.round(rgb.g + (255 - rgb.g) * factor);
    const newB = Math.round(rgb.b + (255 - rgb.b) * factor);

    return this.rgbToHex(newR, newG, newB);
  }

  private darkenColor(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const factor = 1 - (percent / 100);
    const newR = Math.round(rgb.r * factor);
    const newG = Math.round(rgb.g * factor);
    const newB = Math.round(rgb.b * factor);

    return this.rgbToHex(newR, newG, newB);
  }

  private addAlpha(hex: string, alpha: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  // Blend two colors together
  private blendColors(color1: string, color2: string, ratio: number): string {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    const newR = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
    const newG = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
    const newB = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
    
    return this.rgbToHex(newR, newG, newB);
  }

  // Generate comprehensive color palette from base color
  generateColorPalette(baseColor: string): Record<string, string> {
    return {
      '25': this.lightenColor(baseColor, 97),
      '50': this.lightenColor(baseColor, 95),
      '100': this.lightenColor(baseColor, 90),
      '150': this.lightenColor(baseColor, 85),
      '200': this.lightenColor(baseColor, 80),
      '300': this.lightenColor(baseColor, 70),
      '400': this.lightenColor(baseColor, 60),
      '500': baseColor,
      '600': this.darkenColor(baseColor, 10),
      '700': this.darkenColor(baseColor, 20),
      '750': this.darkenColor(baseColor, 25),
      '800': this.darkenColor(baseColor, 30),
      '900': this.darkenColor(baseColor, 40),
      '950': this.darkenColor(baseColor, 50)
    };
  }

  // Initialize branding from stored settings
  initializeBranding(settings?: BrandingSettings): void {
    if (settings) {
      this.applyBranding(settings);
    }
  }

  // Get current branding settings
  getCurrentBranding(): BrandingSettings {
    return { ...this.currentBranding };
  }

  // React to theme changes (light/dark mode)
  onThemeChange(isDark: boolean): void {
    if (this.currentBranding.primaryColor) {
      // Set dark mode class on the document root based on isDark parameter
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      this.applyAdaptiveDarkMode(this.currentBranding);
    }
  }

  // Update Apple touch icon for mobile
  private updateAppleTouchIcon(logoUrl: string): void {
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.href = logoUrl;
  }

  // Enhanced logo application with complete branding
  private applyLogo(settings: BrandingSettings): void {
    if (!settings.logoUrl) return;

    // Update all logo elements with data attributes
    const logoSelectors = [
      '[data-branding="logo"]',
      '.app-logo',
      '.header-logo',
      '.sidebar-logo',
      '.login-logo'
    ];

    logoSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        if (element instanceof HTMLImageElement) {
          element.src = settings.logoUrl!;
          element.alt = `${settings.companyName || 'Organization'} Logo`;
        }
      });
    });

    // Update favicon and apple-touch-icon
    this.updateFavicon(settings.logoUrl);
    this.updateAppleTouchIcon(settings.logoUrl);
  }

  // Update app title and branding text
  private updateAppTitle(settings: BrandingSettings): void {
    if (settings.companyName) {
      // Update page title
      document.title = `${settings.companyName} - Attendance Management`;
      
      // Update app name throughout the application
      const appNameElements = document.querySelectorAll('[data-app-name]');
      appNameElements.forEach(element => {
        element.textContent = settings.companyName!;
      });

      // Update meta tags
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', `${settings.companyName} Attendance Management System`);
      }
    }
  }
}

export const brandingService = BrandingService.getInstance();
export type { BrandingSettings };