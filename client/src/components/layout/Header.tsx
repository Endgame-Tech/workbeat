import React, { useState } from 'react';
import { User, Calendar, Moon, Sun, Menu, X } from 'lucide-react';
import Button from '../ui/Button';

interface HeaderProps {
  user: { name: string; role: string } | null;
  onLogout: () => void;
  onToggleTheme: () => void;
  isDarkMode: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  onLogout, 
  onToggleTheme,
  isDarkMode
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and title */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">
              WorkBeat
              </span>
            </div>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <button 
              onClick={onToggleTheme}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {user ? (
              <div className="flex items-center">
                <div className="mr-3 text-right">
                  <div className="text-sm font-medium text-gray-800 dark:text-white">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user.role}
                  </div>
                </div>
                <button 
                  className="relative overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700 p-1 text-gray-600 dark:text-gray-200"
                >
                  <User size={24} />
                </button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onLogout}
                  className="ml-3"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <Button 
                variant="primary" 
                size="sm"
              >
                Login
              </Button>
            )}
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
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 dark:border-gray-700 pt-2">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center">
                <button 
                  className="relative overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700 p-1 text-gray-600 dark:text-gray-200"
                >
                  <User size={24} />
                </button>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-800 dark:text-white">
                    {user?.name || 'Guest'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role || 'Not logged in'}
                  </div>
                </div>
              </div>
              <button 
                onClick={onToggleTheme}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
            
            <div className="mt-3">
              {user ? (
                <Button 
                  variant="ghost" 
                  onClick={onLogout}
                  className="w-full justify-center"
                >
                  Logout
                </Button>
              ) : (
                <Button 
                  variant="primary" 
                  className="w-full justify-center"
                >
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;