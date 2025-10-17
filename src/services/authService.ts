import axios from "axios";
import { jwtDecode } from "jwt-decode";

interface LoginCredentials {
  identifier: string;
  password: string;
}

interface LoginResponse {
  code: number;
  success: boolean;
  message: string;
  result: {
    token: string;
    authenticated: boolean;
  };
}

interface JwtPayload {
  scope: string[];
  // thêm các trường khác của JWT nếu cần
  exp?: number; // unix seconds
  iat?: number;
}

const API_URL = "http://localhost:8080/api/v1";

let _refreshTimer: ReturnType<typeof setTimeout> | null = null;

export const authService = {
  async login(credentials: LoginCredentials): Promise<string> {
    try {
      const response = await axios.post<LoginResponse>(
        `${API_URL}/auth/login`,
        credentials
      );

      const { token } = response.data.result;

      // Giải mã JWT để kiểm tra scope
      const decoded = jwtDecode<JwtPayload>(token);

      // Kiểm tra xem token có ROLE_SHOP không
      if (!decoded.scope || !decoded.scope.includes("ROLE_SHOP")) {
        throw new Error("Bạn không có quyền truy cập vào hệ thống này");
      }

      // Lưu token vào localStorage
      localStorage.setItem("token", token);
      // Lên lịch refresh token
      // use next tick to avoid issues if called during init
      this.scheduleRefresh();
      return token;
    } catch (error: any) {
      if (error.message === "Bạn không có quyền truy cập vào hệ thống này") {
        throw error;
      }
      throw new Error(
        "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin."
      );
    }
  },

  async logout(): Promise<void> {
    const token = this.getCurrentToken();
    if (token) {
      try {
        await axios.post(`${API_URL}/auth/logout`, { token });
      } catch (err) {
        console.warn("Logout API failed:", (err as any)?.message || err);
      } finally {
        localStorage.removeItem("token");
      }
    } else {
      localStorage.removeItem("token");
      this.cancelRefresh();
    }
  },

  /**
   * Verify token by calling server introspect endpoint.
   * Returns true if server considers token valid.
   */
  async verifyToken(): Promise<boolean> {
    const token = this.getCurrentToken();
    if (!token) return false;

    try {
      const res = await axios.post(`${API_URL}/auth/introspect`, { token });
      return !!res?.data?.result?.valid;
    } catch (err) {
      console.warn("Introspect failed:", (err as any)?.message || err);
      return false;
    }
  },

  /**
   * Refresh current token by calling backend and storing new token
   */
  async refreshToken(): Promise<string | null> {
    const token = this.getCurrentToken();
    if (!token) return null;
    try {
      const res = await axios.post(`${API_URL}/auth/refresh-token`, { token });
      const newToken = res?.data?.result?.token;
      if (newToken) {
        localStorage.setItem("token", newToken);
        // reschedule
        this.scheduleRefresh();
        return newToken;
      }
      return null;
    } catch (err) {
      console.warn("Refresh token failed:", (err as any)?.message || err);
      return null;
    }
  },

  cancelRefresh() {
    if (_refreshTimer) {
      clearTimeout(_refreshTimer as any);
      _refreshTimer = null;
    }
  },

  scheduleRefresh() {
    // cancel existing
    this.cancelRefresh();
    const token = this.getCurrentToken();
    if (!token) return;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const nowSec = Math.floor(Date.now() / 1000);
      const exp = decoded?.exp;
      const minDelay = 14 * 60; // 5 seconds in seconds

      let delaySec = minDelay;
      if (exp && exp > nowSec) {
        // schedule at 1 minute before expiry or minDelay whichever is smaller
        const beforeExpiry = exp - nowSec - 60;
        if (beforeExpiry > 0) {
          delaySec = Math.min(beforeExpiry, minDelay);
        }
      }
      if (delaySec <= 0) delaySec = minDelay;

      _refreshTimer = setTimeout(async () => {
        try {
          await this.refreshToken();
        } catch (e) {
          console.warn("Auto refresh error:", e);
        }
      }, delaySec * 1000);
    } catch (err) {
      console.warn(
        "scheduleRefresh decode failed:",
        (err as any)?.message || err
      );
      // fallback schedule
      _refreshTimer = setTimeout(async () => {
        try {
          await this.refreshToken();
        } catch (e) {
          console.warn("Auto refresh error:", e);
        }
      }, 14 * 60 * 1000);
    }
  },

  init() {
    this.cancelRefresh();
    const token = this.getCurrentToken();
    if (token) {
      this.scheduleRefresh();
    }
  },

  getCurrentToken(): string | null {
    return localStorage.getItem("token");
  },

  isAuthenticated(): boolean {
    const token = this.getCurrentToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded.scope?.includes("ROLE_SHOP") || false;
    } catch {
      return false;
    }
  },
};
