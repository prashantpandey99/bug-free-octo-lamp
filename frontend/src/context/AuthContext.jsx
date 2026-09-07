import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("token") || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Maintain authenticated session on load or token change
  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (token) {
        try {
          const profile = await api.auth.getMe();
          if (isMounted) {
            setUser(profile);
          }
        } catch (err) {
          console.warn("Session verification failed:", err.message);
          const isAuthError =
            err.status === 401 ||
            err.status === 403 ||
            err.message?.includes("401") ||
            err.message?.includes("token");

          if (isAuthError && isMounted) {
            try {
              localStorage.removeItem("token");
            } catch (storageErr) {
              console.error("Failed to clear invalid token from localStorage:", storageErr);
            }
            setToken(null);
            setUser(null);
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    }

    verifySession();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    if (res?.access_token) {
      try {
        localStorage.setItem("token", res.access_token);
      } catch (storageErr) {
        console.error("Failed to save token to localStorage:", storageErr);
      }
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } else {
      throw new Error("Invalid response format from authentication server.");
    }
  };

  const register = async (formData) => {
    const res = await api.auth.register(formData);
    if (res?.access_token) {
      try {
        localStorage.setItem("token", res.access_token);
      } catch (storageErr) {
        console.error("Failed to save token to localStorage:", storageErr);
      }
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } else {
      throw new Error("Invalid response format from registration server.");
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("token");
    } catch (storageErr) {
      console.error("Failed to clear token from localStorage:", storageErr);
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
