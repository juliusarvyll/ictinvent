import axios from 'axios';

const isDevelopment = import.meta.env.DEV;
const hideNetworkRequests = import.meta.env.VITE_HIDE_NETWORK_REQUESTS === 'true';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    // Add headers to minimize request visibility
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Request deduplication to reduce duplicate requests
const pendingRequests = new Map();

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Only log requests if not hidden and in development
  if (isDevelopment && !hideNetworkRequests) {
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, config);
  }

  // Deduplicate identical requests (optional)
  const requestKey = `${config.method}-${config.url}-${JSON.stringify(config.data)}`;
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }

  const promise = config;
  pendingRequests.set(requestKey, promise);

  // Auto-cleanup after 5 seconds
  setTimeout(() => pendingRequests.delete(requestKey), 5000);

  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Only log responses if not hidden and in development
    if (isDevelopment && !hideNetworkRequests) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    }
    return response;
  },
  (error) => {
    // Only log errors if not hidden and in development
    if (isDevelopment && !hideNetworkRequests) {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.status, error.response?.data);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
