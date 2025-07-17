import axios from 'axios';

// Retry mechanism with exponential backoff
const retryRequest = async (fn: () => Promise<any>, retries = 3, delay = 1000): Promise<any> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.code === 'ERR_NETWORK' || error.code === 'ERR_INSUFFICIENT_RESOURCES' || error.response?.status >= 500)) {
      console.warn(`Request failed, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

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
  
  // Check Vite environment variable (this should be set in Vercel)
  if (import.meta.env.VITE_APP_API_URL) {
    return import.meta.env.VITE_APP_API_URL;
  }
  
  // Production fallback - you need to set VITE_APP_API_URL in Vercel
  if (import.meta.env.PROD) {
    console.error('VITE_APP_API_URL not set in production. Please set it in your deployment platform.');
    // Fallback to a common production API URL pattern
    const fallbackUrl = 'https://workbeat-api.onrender.com';
    return fallbackUrl;
  }
  
  
  // Development fallback
  const devUrl = 'http://localhost:3001';
  return devUrl;
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
  timeout: 30000, // 30 second timeout
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

// Request debouncing cache to prevent excessive requests
const requestCache = new Map<string, { promise: Promise<any>; timestamp: number }>();
const CACHE_DURATION = 5000; // 5 seconds

// Create API wrapper with retry logic and debouncing
const createApiWithRetry = (apiInstance: typeof api) => {
  const wrappedApi = {
    get: (url: string, config?: any) => {
      const cacheKey = `GET:${url}:${JSON.stringify(config)}`;
      const cached = requestCache.get(cacheKey);
      
      // Return cached promise if within cache duration
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.promise;
      }
      
      const promise = retryRequest(() => apiInstance.get(url, config));
      requestCache.set(cacheKey, { promise, timestamp: Date.now() });
      
      // Clean up cache after request completes
      promise.finally(() => {
        setTimeout(() => requestCache.delete(cacheKey), CACHE_DURATION);
      });
      
      return promise;
    },
    
    post: (url: string, data?: any, config?: any) => {
      return retryRequest(() => apiInstance.post(url, data, config));
    },
    
    put: (url: string, data?: any, config?: any) => {
      return retryRequest(() => apiInstance.put(url, data, config));
    },
    
    delete: (url: string, config?: any) => {
      return retryRequest(() => apiInstance.delete(url, config));
    },
    
    patch: (url: string, data?: any, config?: any) => {
      return retryRequest(() => apiInstance.patch(url, data, config));
    }
  };
  
  return wrappedApi;
};

export default createApiWithRetry(api);