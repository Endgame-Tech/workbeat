import React, { useState, useEffect } from 'react';
import { brandingService, BrandingSettings } from '../services/brandingService';
import Button from './ui/Button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from './ui/Table';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';

const ThemePreview: React.FC = () => {
  const [primaryColor, setPrimaryColor] = useState<string>('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState<string>('#1E3A8A');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Apply the theme when colors change
  useEffect(() => {
    const settings: BrandingSettings = {
      primaryColor,
      secondaryColor,
      darkModeEnabled: isDarkMode,
      customBranding: true,
      companyName: 'WorkBeat Demo'
    };
    
    brandingService.applyBranding(settings);
    
    // Toggle dark mode class on the html element
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [primaryColor, secondaryColor, isDarkMode]);
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Theme Preview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2">Primary Color</label>
          <div className="flex items-center gap-4">
            <input 
              type="color" 
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-12 rounded border"
            />
            <input 
              type="text" 
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Secondary Color</label>
          <div className="flex items-center gap-4">
            <input 
              type="color" 
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-12 h-12 rounded border"
            />
            <input 
              type="text" 
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="border rounded-lg px-3 py-2 flex-1"
            />
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <label className="flex items-center">
          <input 
            type="checkbox" 
            checked={isDarkMode}
            onChange={(e) => setIsDarkMode(e.target.checked)}
            className="mr-2"
          />
          <span>Dark Mode</span>
        </label>
      </div>
      
      <hr className="my-8 border-ui-divider" />
      
      <h2 className="text-xl font-semibold mb-4">UI Components Preview</h2>
      
      <section className="mb-8">
        <h3 className="text-lg font-medium mb-4">Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="success">Success Button</Button>
          <Button variant="warning">Warning Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="gradient">Gradient Button</Button>
        </div>
      </section>
      
      <section className="mb-8">
        <h3 className="text-lg font-medium mb-4">Table</h3>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Name</TableHeader>
              <TableHeader>Position</TableHeader>
              <TableHeader>Department</TableHeader>
              <TableHeader>Status</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>Software Engineer</TableCell>
              <TableCell>Engineering</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Jane Smith</TableCell>
              <TableCell>Product Manager</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Robert Johnson</TableCell>
              <TableCell>UX Designer</TableCell>
              <TableCell>Design</TableCell>
              <TableCell>On Leave</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
      
      <section className="mb-8">
        <h3 className="text-lg font-medium mb-4">Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="default">
            <CardHeader bordered>
              <CardTitle level={3}>Default Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 dark:text-neutral-300">This is a standard card with border and shadow that adapts to the brand color.</p>
            </CardContent>
            <CardFooter bordered justify="between">
              <Button variant="outline" size="sm">Cancel</Button>
              <Button variant="primary" size="sm">Confirm</Button>
            </CardFooter>
          </Card>
          
          <Card variant="elevated">
            <CardHeader bordered>
              <CardTitle level={3}>Elevated Card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 dark:text-neutral-300">This card has elevated shadow that adapts to dark mode.</p>
            </CardContent>
            <CardFooter bordered justify="end">
              <Button variant="gradient" size="sm">Action</Button>
            </CardFooter>
          </Card>
        </div>
      </section>
      
      <section className="mb-8">
        <h3 className="text-lg font-medium mb-4">Navigation</h3>
        <nav className="bg-ui-navBg border border-ui-navBorder rounded-xl p-4 flex gap-4">
          <a href="#" className="text-ui-navText hover:bg-ui-navItemHover px-4 py-2 rounded-lg">Home</a>
          <a href="#" className="bg-ui-navItemActive text-ui-navTextActive px-4 py-2 rounded-lg">Dashboard</a>
          <a href="#" className="text-ui-navText hover:bg-ui-navItemHover px-4 py-2 rounded-lg">Reports</a>
          <a href="#" className="text-ui-navText hover:bg-ui-navItemHover px-4 py-2 rounded-lg">Settings</a>
        </nav>
      </section>
      
      <section className="mb-8">
        <h3 className="text-lg font-medium mb-4">Form Elements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Input Field</label>
            <input 
              type="text" 
              placeholder="Enter your name"
              className="w-full border border-ui-inputBorder focus:border-ui-inputBorderFocus focus:ring-2 focus:ring-ui-focusRing rounded-lg px-3 py-2"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Select Dropdown</label>
            <select className="w-full border border-ui-inputBorder focus:border-ui-inputBorderFocus focus:ring-2 focus:ring-ui-focusRing rounded-lg px-3 py-2">
              <option>Select an option</option>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ThemePreview;
