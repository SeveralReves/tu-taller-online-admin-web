/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";
import { emitApiError } from "@/lib/error-bus";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** No redirigir en 401 (útil para /auth/me o flujos controlados) */
    skipAuthRedirect?: boolean;
    /** No mostrar toast global automáticamente para este request */
    silent?: boolean;
    /** Flag interno para evitar reintentos infinitos tras refresh */
    _retry?: boolean;
  }
}

export type ApiError = {
  status?: number;
  code?: string | number | null;
  message: string;
  /** Para validaciones tipo { field: msg } o arrays */
  details?: any;
  raw?: any;
};

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true, // importante para cookies HttpOnly
});

api.interceptors.request.use((config) => {
  // Si tu backend acepta Bearer además de cookie, mantenlo:
  const token = Cookies.get("tutaller_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function normalizeError(error: AxiosError): ApiError {
  const status = error.response?.status;
  const data: any = error.response?.data;

  const message =
    data?.message ||
    data?.error ||
    error.message ||
    "Error de solicitud. Intenta de nuevo.";

  const details = data?.details || data?.errors || data?.validation || null;
  const code = data?.code ?? status ?? null;

  return { status, code, message, details, raw: data ?? error };
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const axiosError = error as AxiosError;
    const err = normalizeError(axiosError);
    const cfg = (axiosError.config || {}) as import("axios").AxiosRequestConfig;

    const url = (cfg.url || "").toString();

    // --- 1) Si es 401 ---
    if (err.status === 401) {
      // Evita loop: para /auth/me, o si explícitamente se pidió no redirigir
      const isAuthMe = url.includes("/auth/me");
      const onLoginPage =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/login");

      // Si /auth/me o skipAuthRedirect: NO redirijas, solo rechaza.
      if (isAuthMe || cfg.skipAuthRedirect) {
        // Limpia el token de cookies (opcional) si tu backend lo invalida al expirar
        Cookies.remove("tutaller_token");
        // No toasts para 401 silenciosos
        if (!cfg.silent) {
          // puedes decidir no emitir toast para /auth/me; yo lo silencio:
          // emitApiError(err);
        }
        return Promise.reject(err);
      }

      // Intentar REFRESH solo una vez
      if (!cfg._retry) {
        cfg._retry = true;
        try {
          await api.post(
            "/auth/refresh",
            null,
            {
              // Evita toasts/redirects en el refresh
              skipAuthRedirect: true,
              silent: true,
              withCredentials: true,
            } as any
          );
          // Tras refrescar, reintenta la request original
          return api.request(cfg);
        } catch (refreshErr) {
          // Refresh falló → limpiar y redirigir a login (si no estoy ya en login)
          Cookies.remove("tutaller_token");
          if (typeof window !== "undefined" && !onLoginPage) {
            const next = window.location.pathname + window.location.search;
            window.location.href = `/login?next=${encodeURIComponent(next)}`;
          }
          // Opcional: no spamear toast si ya vamos a login
          if (!cfg.silent) {
            // emitApiError(normalizeError(refreshErr as AxiosError));
          }
          return Promise.reject(err);
        }
      }

      // Si ya se intentó refresh y seguimos en 401, redirige si no estás en login
      Cookies.remove("tutaller_token");
      if (typeof window !== "undefined" && !onLoginPage && !cfg.skipAuthRedirect) {
        const next = window.location.pathname + window.location.search;
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
      }
      // Evita el toast duplicado si vas a redirigir
      if (!cfg.silent) {
        // emitApiError(err);
      }
      return Promise.reject(err);
    }

    // --- 2) (Opcional) Manejar 419/440 o códigos de "token expirado" específicos ---
    // if (err.status === 419 || err.code === 'TOKEN_EXPIRED') { ... }

    // --- 3) Para otros errores, emite toast salvo que sea "silent" ---
    if (!cfg.silent) emitApiError(err);

    return Promise.reject(err);
  }
);
