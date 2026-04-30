import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { cartStorage } from "../services/api";

const Header = () => {
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const { isAuthenticated, logout, user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <>
      {/* Header Section Begin */}
      <header className="header-section">
        {/* Header Top */}
        <div className="header-top">
          <div className="container">
            <div className="row">
              <div className="col-lg-6 col-md-6">
                <div className="ht-left">
                  <div className="mail-service">
                    <i className="fa fa-envelope"></i>
                    hello.colorlib@gmail.com
                  </div>
                  <div className="phone-service">
                    <i className="fa fa-phone"></i>
                    +65 11.188.888
                  </div>
                </div>
              </div>
              <div className="col-lg-6 col-md-6">
                <div className="ht-right">
                  {isAuthenticated ? (
                    <div className="login-panel">
                      <a href="#" title={user?.username || "Người dùng"}>
                        <i className="fa fa-user"></i>
                        {user?.username || "Tài khoản"}
                      </a>
                      {isAdmin() && (
                        <Link
                          to="/dashboard"
                          style={{ marginLeft: "10px" }}
                          title="Trang quản trị"
                        >
                          <i className="fa fa-cogs"></i>
                        </Link>
                      )}
                      <a
                        href="#"
                        onClick={handleLogout}
                        style={{ marginLeft: "10px" }}
                        title="Đăng xuất"
                      >
                        <i className="fa fa-sign-out"></i>
                      </a>
                    </div>
                  ) : (
                    <Link to="/login" className="login-panel">
                      <i className="fa fa-user"></i>
                      Đăng nhập
                    </Link>
                  )}
                  <div className="lan-selector">
                    <select
                      className="language_drop"
                      name="countries"
                      id="countries"
                    >
                      <option value="yt">Tiếng Việt</option>
                      <option value="yu">English</option>
                    </select>
                  </div>
                  <div className="top-social">
                    <a href="#">
                      <i className="ti-facebook"></i>
                    </a>
                    <a href="#">
                      <i className="ti-twitter-alt"></i>
                    </a>
                    <a href="#">
                      <i className="ti-linkedin"></i>
                    </a>
                    <a href="#">
                      <i className="ti-pinterest"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inner Header */}
        <div className="container">
          <div className="inner-header">
            <div className="row">
              <div className="col-lg-2 col-md-2">
                <div className="logo">
                  <Link to="/">
                    <img src="/img/logo.png" alt="Logo" />
                  </Link>
                </div>
              </div>
              <div className="col-lg-7 col-md-7">
                <div className="advanced-search">
                  <button type="button" className="category-btn">
                    Tất cả danh mục
                  </button>
                  <div className="input-group">
                    <input type="text" placeholder="Bạn cần tìm gì?" />
                    <button type="button">
                      <i className="ti-search"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 text-right col-md-3">
                <ul className="nav-right">
                  <li className="heart-icon">
                    <a href="#">
                      <i className="icon_heart_alt"></i>
                      <span>1</span>
                    </a>
                  </li>
                  <li className="cart-icon">
                    <Link to="/shopping-cart">
                      <i className="icon_bag_alt"></i>
                      <span>{cartCount}</span>
                    </Link>
                    <div className="cart-hover">
                      <div className="select-items">
                        <table>
                          <tbody>
                            <tr>
                              <td className="si-pic">
                                <img src="/img/select-product-1.jpg" alt="" />
                              </td>
                              <td className="si-text">
                                <div className="product-selected">
                                  <p>$60.00 x 1</p>
                                  <h6>Kabino Bedside Table</h6>
                                </div>
                              </td>
                              <td className="si-close">
                                <i className="ti-close"></i>
                              </td>
                            </tr>
                            <tr>
                              <td className="si-pic">
                                <img src="/img/select-product-2.jpg" alt="" />
                              </td>
                              <td className="si-text">
                                <div className="product-selected">
                                  <p>$60.00 x 1</p>
                                  <h6>Kabino Bedside Table</h6>
                                </div>
                              </td>
                              <td className="si-close">
                                <i className="ti-close"></i>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="select-total">
                        <span>Tổng:</span>
                        <h5>${cartTotal.toFixed(2)}</h5>
                      </div>
                      <div className="select-button">
                        <Link
                          to="/shopping-cart"
                          className="primary-btn view-card"
                        >
                          XEM GIỎ HÀNG
                        </Link>
                        <Link
                          to="/check-out"
                          className="primary-btn checkout-btn"
                        >
                          THANH TOÁN
                        </Link>
                      </div>
                    </div>
                  </li>
                  <li className="cart-price">${cartTotal.toFixed(2)}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="nav-item">
          <div className="container">
            <div className="nav-depart">
              <div className="depart-btn">
                <i className="ti-menu"></i>
                <span>Tất cả ngành hàng</span>
                <ul className="depart-hover">
                  <li className="active">
                    <a href="#">Thời trang nữ</a>
                  </li>
                  <li>
                    <a href="#">Thời trang nam</a>
                  </li>
                  <li>
                    <a href="#">Đồ lót</a>
                  </li>
                  <li>
                    <a href="#">Thời trang trẻ em</a>
                  </li>
                  <li>
                    <a href="#">Thương hiệu thời trang</a>
                  </li>
                  <li>
                    <a href="#">Phụ kiện/Giày dép</a>
                  </li>
                  <li>
                    <a href="#">Thương hiệu cao cấp</a>
                  </li>
                  <li>
                    <a href="#">Trang phục ngoài trời</a>
                  </li>
                </ul>
              </div>
            </div>
            <nav className="nav-menu mobile-menu">
              <ul>
                <li className={location.pathname === "/home" ? "active" : ""}>
                  <Link to="/home">Trang chủ</Link>
                </li>
                <li className={location.pathname === "/shop" ? "active" : ""}>
                  <Link to="/shop">Cửa hàng</Link>
                </li>
                <li>
                  <a href="#">Bộ sưu tập</a>
                  <ul className="dropdown">
                    <li>
                      <a href="#">Nam</a>
                    </li>
                    <li>
                      <a href="#">Nu</a>
                    </li>
                    <li>
                      <a href="#">Tre em</a>
                    </li>
                  </ul>
                </li>
                <li className={location.pathname === "/blog" ? "active" : ""}>
                  <Link to="/blog">Tin tức</Link>
                </li>
                <li className={location.pathname === "/contact" ? "active" : ""}>
                  <Link to="/contact">Liên hệ</Link>
                </li>
                <li>
                  <a href="#">Trang phụ</a>
                  <ul className="dropdown">
                    <li>
                      <Link to="/blog-details">Chi tiết bài viết</Link>
                    </li>
                    <li>
                      <Link to="/shopping-cart">Giỏ hàng</Link>
                    </li>
                    <li>
                      <Link to="/check-out">Thanh toán</Link>
                    </li>
                    <li>
                      <a href="#">Câu hỏi thường gặp</a>
                    </li>
                    <li>
                      <Link to="/register">Đăng ký</Link>
                    </li>
                    <li>
                      <Link to="/login">Đăng nhập</Link>
                    </li>
                  </ul>
                </li>
              </ul>
            </nav>
            <div id="mobile-menu-wrap"></div>
          </div>
        </div>
      </header>
      {/* Header End */}
    </>
  );
};

export default Header;
