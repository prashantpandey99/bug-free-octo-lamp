import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const DEMO_CREDENTIALS = {
  Admin: { email: "admin@doca.gov.in", password: "Admin@123", name: "Dr. Alok Srivastava", dept: "Directorate of Legal Metrology" },
  Inspector: { email: "inspector@doca.gov.in", password: "Inspector@123", name: "Insp. Rajesh Verma", dept: "Enforcement Wing Zone-1" },
  Manufacturer: { email: "mfg@shaktibhog.com", password: "Mfg@123", name: "Shakti Bhog Foods Ltd.", dept: "Registered Manufacturer" },
  Seller: { email: "seller@retailhub.in", password: "Seller@123", name: "Reliance Retail Hub", dept: "Retail Merchant" },
  Consumer: { email: "consumer@gmail.com", password: "Consumer@123", name: "Ramesh Kumar", dept: "Citizen Consumer" },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.auth.getMe();
          setUser(profile);
        } catch (err) {
          console.warn("Stored token invalid or expired. Logging out.");
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    localStorage.setItem("token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (data) => {
    const res = await api.auth.register(data);
    localStorage.setItem("token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const switchRole = async (role) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
