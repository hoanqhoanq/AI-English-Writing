import axios from 'axios';

// Access token lives in memory only (never localStorage/sessionStorage). It is
// re-obtained on page load via the HttpOnly refresh-token cookie (see AuthContext).
let accessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // sends/receives the HttpOnly refresh-token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        const newToken: string | null = res.data?.data?.accessToken || null;
        accessToken = newToken;
        return newToken;
      })
      .catch(() => {
        accessToken = null;
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url: string = originalRequest?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
      // Refresh failed too: the session is truly over. Let AuthContext clear
      // its state and redirect to /login instead of retrying forever.
      window.dispatchEvent(new Event('auth:session-expired'));
    }

    return Promise.reject(error);
  }
);

export default api;
