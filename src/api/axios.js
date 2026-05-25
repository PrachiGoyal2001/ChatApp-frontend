import axios from "axios";

const baseURL = import.meta.env.VITE_PROD_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if ([404].includes(error.response?.status)) {
      window.location.href="/login";
    }

    return Promise.reject(error);
  }
)

export default api;
