// Minimal token storage helpers to avoid circular deps
export function getToken(): string | null {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem("token", token);
  } catch {}
}

export function clearToken() {
  try {
    localStorage.removeItem("token");
  } catch {}
}
