import axios from 'axios';
import { toast } from 'react-hot-toast';

interface RuntimeConfig {
  VITE_APP_API_URL?: string;
  // Add other environment variables as needed
}

const getApiUrl = () => {
  // Check for runtime config with proper typing
  const runtimeConfig = (window as Window & { _env_?: RuntimeConfig })._env_;
  if (runtimeConfig?.VITE_APP_API_URL) {
    return runtimeConfig.VITE_APP_API_URL;
  }
  
  // Fall back to hardcoded default
  return 'http://localhost:3001';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Request interceptor (no need to add token manually since we're using httpOnly cookies)
api.interceptors.request.use(
  (config) => {
    // With httpOnly cookies, the token is automatically included by the browser
    // Keep fallback for Authorization header for backward compatibility
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Log error but don't show toast - let components handle their own error messages
    console.error('Request Error:', error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    // You can add a global success toast here if desired,
    // but it's often better to handle success messages in the specific service call.
    return response;
  },
  (error) => {
    // Enhanced error handling with better categorization
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    // Log error for debugging but categorize appropriately
    if (status === 404) {
      console.log('Resource not found (expected for new users/organizations):', message);
    } else if (status >= 500) {
      console.error('Server Error:', message);
    } else if (status === 400) {
      console.warn('Client Error:', message);
    } else {
      console.error('API Response Error:', message);
    }
    
    // Handle unauthorized errors (401) - this is important for security
    if (status === 401) {
      // Clear local storage (token is httpOnly cookie, cleared by server)
      localStorage.removeItem('user');
      localStorage.removeItem('organization');
      
      // Redirect to home/login if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    // Add error metadata to help components handle errors appropriately
    error.isExpectedEmpty = status === 404;
    error.isServerError = status >= 500;
    error.isClientError = status >= 400 && status < 500;
    
    return Promise.reject(error);
  }
);

export default api;