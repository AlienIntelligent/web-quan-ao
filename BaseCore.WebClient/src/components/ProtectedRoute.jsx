import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập → về Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only route mà user không phải Admin → về Home (Fashi pages)
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default ProtectedRoute;
