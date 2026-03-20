import axios from 'axios';
import { getToken, removeToken } from '../utils/auth';

const client = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true, // Required for httpOnly cookies (refresh token)
});

// Request Interceptor: Attach access token
client.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
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
    const originalRequest = error.config;

    // Check if error is 401 and it's not a retry already
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh token endpoint (which sets new access token or handles cookie)
        // Note: The backend refresh endpoint usually returns a new access token
        const res = await axios.post(
          'http://localhost:8000/auth/refresh',
          {},
          { withCredentials: true }
        );

        if (res.status === 200 || res.status === 201) {
          const { access_token } = res.data.item;
          import('../utils/auth').then(({ setToken }) => setToken(access_token));
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
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
