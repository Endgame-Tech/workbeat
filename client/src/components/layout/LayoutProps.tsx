import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useTheme } from '../context/ThemeProvider';
import { useAuth } from '../context/AuthProvider';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { toggleTheme, isDarkMode } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        user={user ? { name: user.name, role: user.role } : null} 
        onLogout={handleLogout}
        onToggleTheme={toggleTheme}
        isDarkMode={isDarkMode}
      />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;