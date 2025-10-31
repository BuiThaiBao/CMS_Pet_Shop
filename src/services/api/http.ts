import axios from "axios";
import { getToken } from "./tokenStorage";

// Base axios instance for app APIs
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1",
});

// Attach Authorization header if token exists
http.interceptors.request.use((config) => {
  const url = config.url || "";
  const skipAuthPaths = [
    "/auth/login",
    "/auth/refresh-token",
    "/auth/introspect",
    "/auth/logout",
  ];

  // Không gắn Authorization cho các endpoint auth
  if (skipAuthPaths.some((p) => url.includes(p))) {
    return config;
  }

  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Optionally, centralize response handling here
export default http;
