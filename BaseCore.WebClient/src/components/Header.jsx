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
    <header className="header-section">
      <div className="header-top">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 col-md-6">
              <div className="ht-left">
                <div className="mail-service">
                  <i className="fa fa-envelope"></i>
                  support@fashion-shop.vn
                </div>
                <div className="phone-service">
                  <i className="fa fa-phone"></i>
                  1900 6868
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-6">
              <div className="ht-right">
                {isAuthenticated ? (
                  <div className="login-panel">
                    <Link to="/profile" title="Tài khoản">
                      <i className="fa fa-user"></i>
                      {user?.username || user?.userName || "Tài khoản"}
                    </Link>
                    <Link to="/my-orders" style={{ marginLeft: 10 }} title="Đơn mua">
                      <i className="fa fa-list-alt"></i>
                    </Link>
                    {isAdmin() && (
                      <Link to="/dashboard" style={{ marginLeft: 10 }} title="Trang quản trị">
                        <i className="fa fa-cogs"></i>
                      </Link>
                    )}
                    <a href="#" onClick={handleLogout} style={{ marginLeft: 10 }} title="Đăng xuất">
                      <i className="fa fa-sign-out"></i>
                    </a>
                  </div>
                ) : (
                  <Link to="/login" className="login-panel">
                    <i className="fa fa-user"></i>
                    Đăng nhập
                  </Link>
                )}
                <div className="top-link">
                  <Link to="/my-orders">Theo dõi đơn hàng</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="inner-header">
          <div className="row">
            <div className="col-lg-2 col-md-2">
              <div className="logo">
                <Link to="/">
                  <img src="/img/logo.png" alt="Fashion Shop" />
                </Link>
              </div>
            </div>
            <div className="col-lg-7 col-md-7">
              <form className="advanced-search product-search-form" onSubmit={handleProductSearch}>
                <select
                  className="category-btn"
                  value={searchCategoryId}
                  onChange={(e) => setSearchCategoryId(e.target.value)}
                  aria-label="Danh mục sản phẩm"
                >
                  <option value="">Tất cả thời trang</option>
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
                  <button type="submit" aria-label="Tìm kiếm">
                    <i className="ti-search"></i>
                  </button>
                </div>
              </form>
            </div>
            <div className="col-lg-3 text-right col-md-3">
              <ul className="nav-right">
                <li className="order-icon">
                  <Link to="/my-orders" title="Đơn mua">
                    <i className="fa fa-list-alt"></i>
                  </Link>
                </li>
                <li className="cart-icon">
                  <Link to="/shopping-cart" title="Giỏ hàng">
                    <i className="icon_bag_alt"></i>
                    <span>{cartCount}</span>
                  </Link>
                  <div className="cart-hover">
                    <div className="select-total">
                      <span>Tạm tính:</span>
                      <h5>{formatMoney(cartTotal)}</h5>
                    </div>
                    <div className="select-button">
                      <Link to="/shopping-cart" className="primary-btn view-card">
                        Xem giỏ hàng
                      </Link>
                      <Link to="/check-out" className="primary-btn checkout-btn">
                        Thanh toán
                      </Link>
                    </div>
                  </div>
                </li>
                <li className="cart-price">{formatMoney(cartTotal)}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="nav-item">
        <div className="container">
          <div className="nav-depart">
            <div className="depart-btn">
              <i className="ti-menu"></i>
              <span>Danh mục thời trang</span>
              <ul className="depart-hover">
                <li><Link to="/shop?keyword=áo">Áo</Link></li>
                <li><Link to="/shop?keyword=quần">Quần</Link></li>
                <li><Link to="/shop?keyword=váy">Váy</Link></li>
                <li><Link to="/shop?keyword=nam">Thời trang nam</Link></li>
                <li><Link to="/shop?keyword=nữ">Thời trang nữ</Link></li>
                <li><Link to="/shop?keyword=trẻ em">Thời trang trẻ em</Link></li>
                <li><Link to="/shop?keyword=phụ kiện">Phụ kiện</Link></li>
              </ul>
            </div>
          </div>
          <nav className="nav-menu mobile-menu">
            <ul>
              <li className={navClass("/home")}><Link to="/home">Trang chủ</Link></li>
              <li className={navClass("/shop")}><Link to="/shop">Sản phẩm</Link></li>
              <li className={navClass("/my-orders")}><Link to="/my-orders">Đơn mua</Link></li>
              <li className={navClass("/shopping-cart")}><Link to="/shopping-cart">Giỏ hàng</Link></li>
              <li className={navClass("/profile")}><Link to="/profile">Tài khoản</Link></li>
            </ul>
          </nav>
          <div id="mobile-menu-wrap"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;
