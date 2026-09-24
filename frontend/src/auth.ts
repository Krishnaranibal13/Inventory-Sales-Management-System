export type AuthUser = {
  user_id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at?: string;
};

export const API_BASE_URL = "";
const TOKEN_KEY = "inventory-pro-auth-token";
const REMEMBER_KEY = "inventory-pro-remember";

function storage(): Storage {
  return localStorage.getItem(REMEMBER_KEY) === "false" ? sessionStorage : localStorage;
}

export function getToken(): string | null {
  return storage().getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, remember = true) {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.setItem(REMEMBER_KEY, String(remember));
  storage().setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

export function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function authFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  Object.entries(authHeaders()).forEach(([key, value]) => headers.set(key, String(value)));
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await authFetch("/api/auth/me");
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || "Session expired.");
  return data.user;
}
