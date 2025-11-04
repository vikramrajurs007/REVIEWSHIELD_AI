import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const API_BASE_URL = "http://127.0.0.1:5000"; // Flask backend URL

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);


  const login = async (mode, credentials) => {
    try {
      const endpoint =
        mode === "signup"
          ? `${API_BASE_URL}/api/auth/signup`
          : `${API_BASE_URL}/api/auth/login`;

      const res = await axios.post(endpoint, credentials, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      if (res.data.username || res.data.user) {
        const loggedInUser = res.data.username
          ? { username: res.data.username }
          : res.data.user;

        setUser(loggedInUser);
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        alert(`✅ Welcome ${loggedInUser.username || "back"}!`);
      }
    } catch (err) {
      console.error("❌ Auth error:", err);
      alert(err.response?.data?.error || "Authentication failed!");
    }
  };

  // ------------------------------
  // 🚪 Logout
  // ------------------------------
  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
      setUser(null);
      localStorage.removeItem("user");
    } catch (err) {
      console.error("❌ Logout failed:", err);
    }
  };


  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (window.location.pathname.startsWith("/admin")) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/user`, {
          withCredentials: true,
        });

        if (res.status === 200 && res.data.username) {
          setUser({ username: res.data.username });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.warn("⚠️ No active session found:", err.response?.status || err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // 🕐 Prevent flicker before session check completes
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Checking session...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};





