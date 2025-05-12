import axios from 'axios';

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
  return 'http://localhost:5000';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response Status:', response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle unauthorized errors (401)
    if (error.response && error.response.status === 401) {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to home/login if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;