import http from "./http";
import { jwtDecode } from "jwt-decode";
import { getToken, setToken, clearToken } from "./tokenStorage";

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
  exp?: number; // unix seconds
  iat?: number;
}

let _refreshTimer: ReturnType<typeof setTimeout> | null = null;

export const authApi = {
  // Login + kiểm tra ROLE_SHOP + lưu token và lên lịch refresh
  async login(credentials: LoginCredentials): Promise<string> {
    try {
      const response = await http.post<LoginResponse>(
        "/auth/login",
        credentials
      );
      const { token } = response.data.result;

      const decoded = jwtDecode<JwtPayload>(token);
      if (!decoded.scope || !decoded.scope.includes("ROLE_SHOP")) {
        throw new Error("Bạn không có quyền truy cập vào hệ thống này");
      }

      setToken(token);
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

  // Gọi API logout và xoá token cục bộ
  async logout(): Promise<void> {
    const token = this.getCurrentToken();
    if (token) {
      try {
        await http.post("/auth/logout", { token });
      } catch (err) {
        console.warn("Logout API failed:", (err as any)?.message || err);
      } finally {
        clearToken();
      }
    } else {
      clearToken();
      this.cancelRefresh();
    }
  },

  // Xác thực token bằng introspect
  async verifyToken(): Promise<boolean> {
    const token = this.getCurrentToken();
    if (!token) return false;
    try {
      const res = await http.post("/auth/introspect", { token });
      return !!res?.data?.result?.valid;
    } catch (err) {
      console.warn("Introspect failed:", (err as any)?.message || err);
      return false;
    }
  },

  // Refresh token và lưu token mới
  async refreshToken(): Promise<string | null> {
    const token = this.getCurrentToken();
    if (!token) return null;
    try {
      const res = await http.post("/auth/refresh-token", { token });
      const newToken = res?.data?.result?.token;
      if (newToken) {
        setToken(newToken);
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
    this.cancelRefresh();
    const token = this.getCurrentToken();
    if (!token) return;
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const nowSec = Math.floor(Date.now() / 1000);
      const exp = decoded?.exp;

      // Luôn refresh trước khi hết hạn ~60 giây
      const leadTimeSec = 60;
      let delaySec = 60; // fallback nếu không đọc được exp/remaining nhỏ
      if (exp && exp > nowSec) {
        const remaining = exp - nowSec;
        if (remaining > leadTimeSec) {
          delaySec = remaining - leadTimeSec;
        } else if (remaining > 5) {
          // Nếu còn rất ít thời gian, refresh sớm hơn một chút để an toàn
          delaySec = Math.max(1, remaining - 5);
        } else {
          // Hết hạn rất gần -> refresh gần như ngay lập tức
          delaySec = 1;
        }
      }

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
      // Fallback: thử refresh sau 60s
      _refreshTimer = setTimeout(async () => {
        try {
          await this.refreshToken();
        } catch (e) {
          console.warn("Auto refresh error:", e);
        }
      }, 60 * 1000);
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
    return getToken();
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

export default authApi;
