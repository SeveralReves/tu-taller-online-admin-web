// src/app/providers/auth-provider.tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api"; // axios/fetch preconfigurado (credentials: 'include')

type User = { id: string; email: string; name?: string; roles?: string[]; role: string } | null;

type AuthCtx = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  // Al montar: intenta recuperar sesión (cookie HttpOnly + /auth/me)
  useEffect(() => {
    (async () => {
      try {
        const me = await api.get("/auth/me"); // debe devolver user si token válido
        const data = {
          id: me.data.roles[0]?.tenant_id,
          role: me.data.roles[0]?.role,
          ...me.data
        }
        setUser(data ?? null);
      } catch {
        
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await api.post("/auth/login", { email, password }); // el backend setea cookies HttpOnly
      const me = await api.get("/auth/me");
      const data = {
        id: me.data.roles[0]?.tenant_id,
        role: me.data.roles[0]?.role,
        ...me.data
      }
      setUser(data ?? null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await api.post("/auth/logout"); // backend limpia cookies
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const refresh = async () => {
    // opcional: golpea /auth/refresh si el backend rota tokens
    await api.post("/auth/refresh");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
