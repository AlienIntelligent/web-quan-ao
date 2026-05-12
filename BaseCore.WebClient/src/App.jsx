import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Users from "./pages/Users";
import Categories from "./pages/Categories";
import OrdersAdmin from "./pages/OrdersAdmin";
import OriginsAdmin from "./pages/OriginsAdmin";
import PromotionsAdmin from "./pages/PromotionsAdmin";
import ShippingsAdmin from "./pages/ShippingsAdmin";
import ReviewsAdmin from "./pages/ReviewsAdmin";

// Public Pages
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import ShoppingCart from "./pages/ShoppingCart";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import OrderTracking from "./pages/OrderTracking";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";

// Wrapper để redirect người dùng đã đăng nhập
// - Admin → Dashboard
// - User thường → Home (Fashi pages)
const PublicRoute = ({ children }) => {
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

  if (isAuthenticated) {
    // Nếu Admin → vào Dashboard
    if (isAdmin()) {
      return <Navigate to="/dashboard" replace />;
    }
    // Nếu User bình thường → vào Fashi Home
    return <Navigate to="/home" replace />;
  }

  return children;
};

// Logout Route - Xử lý logout
const LogoutRoute = () => {
  const { logout } = useAuth();

  React.useEffect(() => {
    logout();
  }, []);

  return <Navigate to="/" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* ============= LOGIN (Public) ============= */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* ============= LOGOUT ============= */}
      <Route path="/logout" element={<LogoutRoute />} />

      {/* ============= ADMIN ROUTES (Protected - Admin Only) ============= */}
      {/* Dashboard Admin */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute adminOnly={true}>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      {/* Quản lý Sản phẩm */}
      <Route
        path="/products"
        element={
          <ProtectedRoute adminOnly={true}>
            <MainLayout>
              <Products />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      {/* Quản lý Danh mục */}
      <Route
        path="/categories"
        element={
          <ProtectedRoute adminOnly={true}>
            <MainLayout>
              <Categories />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      {/* Quản lý Người dùng (Admin only) */}
      <Route
        path="/users"
        element={
          <ProtectedRoute adminOnly={true}>
            <MainLayout>
              <Users />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute adminOnly={true}>
            <MainLayout>
              <OrdersAdmin />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/origins"
        element={
          <ProtectedRoute adminOnly={true}>
            <MainLayout>
              <OriginsAdmin />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/promotions"
        element={
          <ProtectedRoute adminOnly={true}>
            <MainLayout>
              <PromotionsAdmin />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shippings"
        element={
          <ProtectedRoute adminOnly={true}>
            <MainLayout>
              <ShippingsAdmin />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reviews"
        element={
          <ProtectedRoute adminOnly={true}>
            <MainLayout>
              <ReviewsAdmin />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* ============= CUSTOMER PAGES (Fashi Template - Accessible without login) ============= */}
      {/* Trang chủ */}
      <Route path="/home" element={<Home />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/product/:id" element={<Product />} />
      <Route path="/shopping-cart" element={<ShoppingCart />} />
      <Route path="/register" element={<Register />} />
      <Route path="/check-out" element={<Checkout />} />
      <Route path="/my-orders" element={<MyOrders />} />
      <Route path="/orders/:id/tracking" element={<OrderTracking />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/wishlist" element={<Wishlist />} />

      {/* 404 - Route không tìm thấy */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
