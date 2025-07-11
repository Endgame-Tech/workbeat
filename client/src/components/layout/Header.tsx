import React, { useState } from 'react';
import { User, Calendar, Moon, Sun, Menu, X } from 'lucide-react';
import Button from '../ui/Button';
import { useTheme } from '../context/ThemeProvider';
import OfflineIndicator from '../OfflineIndicator';

interface HeaderProps {
  user: { name: string; role: string } | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toggleTheme, isDarkMode } = useTheme();
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const UserProfile = () => (
    <div className="flex items-center">
      <div className="mr-3 text-right">
        <div className="text-sm font-medium text-gray-800 dark:text-white">
          {user?.name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {user?.role}
        </div>
      </div>
      <button 
        className="relative overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700 p-1 text-gray-600 dark:text-gray-200"
      >
        <User size={24} />
      </button>
    </div>
  );

  const AuthButtons = () => (
    <>
      {user ? (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLogout}
          className="ml-3"
        >
          Logout
        </Button>
      ) : (
        <Button 
          variant="primary" 
          size="sm"
        >
          Login
        </Button>
      )}
    </>
  );

  const ThemeToggle = () => (
    <button 
      onClick={toggleTheme}
      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      aria-label="Toggle theme"
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
  
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and title */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <img 
                data-branding="logo"
                className="h-8 w-8 object-contain hidden"
                alt="Organization Logo"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
                onLoad={(e) => {
                  e.currentTarget.style.display = 'block';
                  e.currentTarget.nextElementSibling?.classList.add('hidden');
                }}
              />
              <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">
              WorkBeat
              </span>
            </div>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <OfflineIndicator />
            <ThemeToggle />
            {user && <UserProfile />}
            <AuthButtons />
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
        
      {/* Mobile menu */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'} absolute top-16 left-0 w-full bg-white dark:bg-gray-900 shadow-lg`}>
        <div className="px-4 pt-2 pb-4 space-y-4">
          <OfflineIndicator />
          {user && <UserProfile />}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800 dark:text-white">Switch Theme</span>
            <ThemeToggle />
          </div>
          <AuthButtons />
        </div>
      </div>
    </header>
  );
};

export default Header;