import authApi from "./api/authApi";

// Adapter giữ nguyên tên authService để tránh phải đổi import ở các chỗ khác
export const authService = {
  login: authApi.login.bind(authApi),
  logout: authApi.logout.bind(authApi),
  verifyToken: authApi.verifyToken.bind(authApi),
  refreshToken: authApi.refreshToken.bind(authApi),
  cancelRefresh: authApi.cancelRefresh.bind(authApi),
  scheduleRefresh: authApi.scheduleRefresh.bind(authApi),
  init: authApi.init.bind(authApi),
  getCurrentToken: authApi.getCurrentToken.bind(authApi),
  isAuthenticated: authApi.isAuthenticated.bind(authApi),
};
