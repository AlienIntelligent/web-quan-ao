import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi, cartStorage } from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check persistent session first, then session-only storage.
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      cartStorage.syncWithServer().catch((error) => {
        console.error("Không thể đồng bộ giỏ hàng", error);
      });
    }
    setLoading(false);
  }, []);

  const login = async (username, password, rememberMe = false) => {
    try {
      const response = await authApi.login(username, password);
      const userData = response.data;

      // Chỉ lưu vào localStorage nếu user chọn "Remember Me"
      if (rememberMe) {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        localStorage.setItem("token", userData.token);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.setItem("token", userData.token);
        sessionStorage.setItem("user", JSON.stringify(userData));
      }

      // Lưu user vào state (phiên session)
      setUser(userData);
      try {
        await cartStorage.syncWithServer();
      } catch (cartError) {
        console.error("Không thể đồng bộ giỏ hàng sau đăng nhập", cartError);
      }

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      return { success: false, message };
    }
  };

  const logout = () => {
    // Xóa localStorage (persistent session)
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    cartStorage.clearLocal();
    // Xóa state (session hiện tại)
    setUser(null);
  };

  const isAdmin = () => {
    const role = user?.role || user?.Role;
    return role?.toLowerCase() === "admin";
  };

  const value = {
    user,
    login,
    logout,
    isAdmin,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
