// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppRoutes from './Routes';
import { ThemeProvider } from './components/context/ThemeProvider';
import AuthProvider from './components/context/AuthProvider';
import { WebSocketProvider } from './components/context/WebSocketProvider';
import { NotificationProvider } from './components/context/NotificationProvider';
import { OfflineProvider } from './components/context/OfflineContext';
import { OfflineDataCacheProvider } from './components/context/OfflineDataCacheProvider';
import { PWAProvider } from './components/context/PWAProvider';
import { Toaster } from 'react-hot-toast';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <PWAProvider>
      <ThemeProvider>
        <AuthProvider>
          <OfflineDataCacheProvider>
            <OfflineProvider>
              <WebSocketProvider>
                <NotificationProvider>
                  <AppRoutes />
                  <Toaster position="top-right" />
                </NotificationProvider>
              </WebSocketProvider>
            </OfflineProvider>
          </OfflineDataCacheProvider>
        </AuthProvider>
      </ThemeProvider>
    </PWAProvider>
  </React.StrictMode>
);