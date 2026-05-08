import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { cartStorage, categoryApi } from "../services/api";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const Header = () => {
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchCategoryId, setSearchCategoryId] = useState("");
  const { isAuthenticated, logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchKeyword(params.get("keyword") || "");
    setSearchCategoryId(params.get("categoryId") || "");
  }, [location.search]);

  useEffect(() => {
    const syncCart = () => {
      const summary = cartStorage.getSummary();
      setCartCount(summary.count);
      setCartTotal(summary.total);
    };

    syncCart();
    window.addEventListener(cartStorage.eventName, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(cartStorage.eventName, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate("/");
  };

  const handleProductSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const keyword = searchKeyword.trim();

    if (keyword) params.set("keyword", keyword);
    if (searchCategoryId) params.set("categoryId", searchCategoryId);

    navigate({
      pathname: "/shop",
      search: params.toString(),
    });
  };

  const navClass = (path) => (location.pathname === path ? "active" : "");

  return (
    <header
      className="header-section"
      style={{
        background: "linear-gradient(to bottom, #e7ab3c 0%, #ffce74ff 100%)",
        color: "#fff",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      <div
        className="header-top"
        style={{
          background: "transparent",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 col-md-6">
              <div className="ht-left d-flex align-items-center">
                <div className="mail-service mr-4">
                  <i className="fa fa-envelope"></i>
                  <span className="ml-2">support@fashion-shop.vn</span>
                </div>
                <div className="phone-service">
                  <i className="fa fa-phone"></i>
                  <span className="ml-2">1900 6868</span>
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-6">
              <div className="ht-right d-flex align-items-center justify-content-end">
                <div className="top-link-icons d-flex align-items-center">
                  <Link to="#" title="Thông báo">
                    <i className="fa fa-bell-o"></i>
                  </Link>
                  <Link to="#" title="Hỗ trợ">
                    <i className="fa fa-question-circle-o"></i>
                  </Link>
                  <Link to="#" title="Ngôn ngữ">
                    <i className="fa fa-globe"></i>
                  </Link>
                  {isAdmin() && (
                    <Link
                      to="/dashboard"
                      className="admin-link-highlight"
                      title="Quản trị"
                    >
                      <i className="fa fa-dashboard"></i>
                    </Link>
                  )}
                </div>
                <div className="user-panel-top d-flex align-items-center">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/profile"
                        className="user-profile-link"
                        title="Hồ sơ"
                      >
                        <i className="fa fa-user-circle-o"></i>
                        <span className="ml-2">
                          {user?.username || user?.userName || "Tài khoản"}
                        </span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="logout-btn-top ml-3"
                        title="Đăng xuất"
                      >
                        <i className="fa fa-sign-out"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link to="/register" title="Đăng ký" className="mr-3">
                        <i className="fa fa-user-plus"></i>
                      </Link>
                      <Link to="/login" title="Đăng nhập">
                        <i className="fa fa-sign-in"></i>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="inner-header">
          <div className="row align-items-center">
            <div className="col-lg-2 col-md-2">
              <div className="logo">
                <Link to="/" className="logo-circle">
                  <img src="/img/logo.png" alt="Fashion Shop" />
                </Link>
              </div>
            </div>
            <div className="col-lg-8 col-md-8">
              <form
                className="advanced-search product-search-form"
                onSubmit={handleProductSearch}
              >
                <select
                  className="category-btn"
                  value={searchCategoryId}
                  onChange={(e) => setSearchCategoryId(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <div className="input-group">
                  <input
                    type="text"
                    className="keyword-input"
                    placeholder="Tìm áo thun, váy, quần jean..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                  />
                  <button
                    type="submit"
                    style={{ background: "#c08d32", border: "none" }}
                  >
                    <i className="ti-search" style={{ color: "#fff" }}></i>
                  </button>
                </div>
              </form>
            </div>
            <div className="col-lg-2 text-right col-md-2">
              <ul className="nav-right">
                <li className="heart-icon">
                  <Link to="/wishlist" title="Yêu thích">
                    <i className="icon_heart_alt"></i>
                  </Link>
                </li>
                <li className="order-icon">
                  <Link to="/my-orders" title="Đơn mua">
                    <i className="fa fa-list-alt"></i>
                  </Link>
                </li>
                <li className="cart-icon">
                  <Link to="/shopping-cart" title="Giỏ hàng">
                    <i className="icon_bag_alt"></i>
                    <span
                      style={{
                        background: "#222",
                        border: "none",
                        color: "#fff",
                      }}
                    >
                      {cartCount}
                    </span>
                  </Link>
                  <div className="cart-hover">
                    <div className="select-total">
                      <span>Tạm tính:</span>
                      <h5>{formatMoney(cartTotal)}</h5>
                    </div>
                    <div className="select-button">
                      <Link
                        to="/shopping-cart"
                        className="primary-btn view-card"
                      >
                        Xem giỏ hàng
                      </Link>
                      <Link
                        to="/check-out"
                        className="primary-btn checkout-btn"
                      >
                        Thanh toán
                      </Link>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
