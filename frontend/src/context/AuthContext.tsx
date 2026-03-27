import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "@/services/api";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  phone_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("spendlex_token");
    if (stored) {
      setToken(stored);
      authApi
        .me()
        .then((data) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem("spendlex_token");
          localStorage.removeItem("spendlex_user");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem("spendlex_token", data.token);
    localStorage.setItem("spendlex_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (name: string, email: string, password: string, phone?: string) => {
    const data = await authApi.signup({ name, email, password, phone });
    localStorage.setItem("spendlex_token", data.token);
    localStorage.setItem("spendlex_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("spendlex_token");
    localStorage.removeItem("spendlex_user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem("spendlex_user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
