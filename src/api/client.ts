import axios, { InternalAxiosRequestConfig } from 'axios';
import { getToken, removeToken } from '../utils/auth';

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const client = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true, // Required for httpOnly cookies (refresh token)
});

// Request Interceptor: Attach access token
client.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh on 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Check if error is 401 and it's not a retry already
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh token endpoint
        const res = await axios.post(
          'http://localhost:8000/auth/refresh',
          {},
          { withCredentials: true }
        );

        if (res.status === 200 || res.status === 201) {
          const { access_token } = res.data.item;
          const { setToken } = await import('../utils/auth');
          setToken(access_token);
          
          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return client(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        removeToken();
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
