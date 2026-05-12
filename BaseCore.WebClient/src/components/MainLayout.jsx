import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../assets/css/admin-custom.css";

const MainLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <div className="wrapper admin-wrapper">
      <nav className="main-header navbar navbar-expand navbar-white navbar-light">
        <ul className="navbar-nav">
          <li className="nav-item">
            <a
              className="nav-link"
              data-widget="pushmenu"
              href="#"
              role="button"
            >
              <i className="fas fa-bars"></i>
            </a>
          </li>
          <li className="nav-item d-none d-sm-inline-block">
            <Link to="/home" className="nav-link">
              Trang chủ
            </Link>
          </li>
        </ul>

        <ul className="navbar-nav ml-auto">
          <li className="nav-item dropdown">
            <a className="nav-link" data-toggle="dropdown" href="#">
              <i className="far fa-user"></i> {user?.name || user?.username}
            </a>
            <div className="dropdown-menu dropdown-menu-right">
              <span className="dropdown-item dropdown-header">
                {user?.email}
              </span>
              <div className="dropdown-divider"></div>
              <Link to="/home" className="dropdown-item">
                <i className="fas fa-store mr-2"></i> Xem cửa hàng
              </Link>
              <button className="dropdown-item" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt mr-2"></i> Đăng xuất
              </button>
            </div>
          </li>
        </ul>
      </nav>

      <aside className="main-sidebar sidebar-dark-primary elevation-4">
        <Link to="/" className="brand-link">
          <span className="brand-text font-weight-light ml-3">
            <b>FASHI.</b> Shop
          </span>
        </Link>

        <div className="sidebar">
          <div className="user-panel mt-3 pb-3 mb-3 d-flex">
            <div className="image">
              <i className="fas fa-user-circle fa-2x text-light"></i>
            </div>
            <div className="info">
              <Link to="#" className="d-block">
                {user?.name || user?.username}
              </Link>
            </div>
          </div>

          <nav className="mt-2">
            <ul
              className="nav nav-pills nav-sidebar flex-column"
              data-widget="treeview"
              role="menu"
            >
              <li className="nav-item">
                <Link
                  to="/dashboard"
                  className={`nav-link ${isActive("/dashboard")}`}
                >
                  <i className="nav-icon fas fa-tachometer-alt"></i>
                  <p>Tổng quan</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/products"
                  className={`nav-link ${isActive("/products")}`}
                >
                  <i className="nav-icon fas fa-box"></i>
                  <p>Sản phẩm</p>
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  to="/categories"
                  className={`nav-link ${isActive("/categories")}`}
                >
                  <i className="nav-icon fas fa-tags"></i>
                  <p>Danh mục</p>
                </Link>
              </li>
              {isAdmin() && (
                <li className="nav-item">
                  <Link
                    to="/reviews"
                    className={`nav-link ${isActive("/reviews")}`}
                  >
                    <i className="nav-icon fas fa-star"></i>
                    <p>Đánh giá</p>
                  </Link>
                </li>
              )}
              {isAdmin() && (
                <li className="nav-item">
                  <Link
                    to="/origins"
                    className={`nav-link ${isActive("/origins")}`}
                  >
                    <i className="nav-icon fas fa-industry"></i>
                    <p>Xuất xứ</p>
                  </Link>
                </li>
              )}
              {isAdmin() && (
                <li className="nav-item">
                  <Link
                    to="/promotions"
                    className={`nav-link ${isActive("/promotions")}`}
                  >
                    <i className="nav-icon fas fa-percentage"></i>
                    <p>Khuyến mãi</p>
                  </Link>
                </li>
              )}
              {isAdmin() && (
                <li className="nav-item">
                  <Link
                    to="/shippings"
                    className={`nav-link ${isActive("/shippings")}`}
                  >
                    <i className="nav-icon fas fa-truck"></i>
                    <p>Vận chuyển</p>
                  </Link>
                </li>
              )}
              {isAdmin() && (
                <li className="nav-item">
                  <Link
                    to="/orders"
                    className={`nav-link ${isActive("/orders")}`}
                  >
                    <i className="nav-icon fas fa-file-invoice"></i>
                    <p>Đơn hàng</p>
                  </Link>
                </li>
              )}
              {isAdmin() && (
                <li className="nav-item">
                  <Link
                    to="/users"
                    className={`nav-link ${isActive("/users")}`}
                  >
                    <i className="nav-icon fas fa-users"></i>
                    <p>Người dùng</p>
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </aside>

      {children}

      <footer className="main-footer">
        <strong>
          Copyright &copy; 2024 <a href="#">BaseCore Sales</a>.
        </strong>
        <div className="float-right d-none d-sm-inline-block">
          <b>Phiên bản</b> 1.0.0
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
