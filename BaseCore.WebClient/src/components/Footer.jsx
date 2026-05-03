import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { confirmAction, alertError } from "../services/swal";
import { cartStorage, checkoutStorage } from "../services/api";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const handleCheckoutClick = async (e) => {
    e.preventDefault();
    const items = cartStorage.getItems();
    if (items.length === 0) {
      alertError("Giỏ hàng trống!", "Vui lòng chọn sản phẩm vào giỏ hàng trước khi thanh toán.");
      return;
    }

    const result = await confirmAction(
      "Xác nhận thanh toán?",
      "Bạn có chắc chắn muốn thanh toán toàn bộ giỏ hàng?",
      "Thanh toán ngay"
    );

    if (result.isConfirmed) {
      checkoutStorage.set(items);
      navigate("/check-out");
    }
  };

  return (
    <footer className="footer-section">
      <div className="container">
        <div className="row">
          <div className="col-lg-4">
            <div className="footer-left">
              <div className="footer-logo">
                <Link to="/">
                  <img src="/img/footer-logo.png" alt="Fashion Shop" />
                </Link>
              </div>
              <ul>
                <li>Địa chỉ: 12 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh</li>
                <li>Điện thoại: 1900 6868</li>
                <li>Email: support@fashion-shop.vn</li>
              </ul>
            </div>
          </div>
          <div className="col-lg-2 offset-lg-1">
            <div className="footer-widget">
              <h5>Mua sắm</h5>
              <ul>
                <li><Link to="/shop">Tất cả sản phẩm</Link></li>
                <li><Link to="/shopping-cart">Giỏ hàng</Link></li>
                <li><a href="/check-out" onClick={handleCheckoutClick}>Thanh toán</a></li>
                <li><Link to="/my-orders">Theo dõi đơn</Link></li>
              </ul>
            </div>
          </div>
          <div className="col-lg-2">
            <div className="footer-widget">
              <h5>Tài khoản</h5>
              <ul>
                <li><Link to="/profile">Hồ sơ</Link></li>
                <li><Link to="/my-orders">Đơn mua</Link></li>
                <li><Link to="/login">Đăng nhập</Link></li>
                <li><Link to="/register">Đăng ký</Link></li>
              </ul>
            </div>
          </div>
          <div className="col-lg-3">
            <div className="newslatter-item">
              <h5>Ưu đãi thời trang</h5>
              <p>Nhận thông báo về bộ sưu tập mới, mã giảm giá và lịch giao hàng.</p>
              <form action="#" className="subscribe-form">
                <input type="email" placeholder="Email của bạn" />
                <button type="button">Đăng ký</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="copyright-reserved">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="copyright-text">
                Bản quyền &copy;{currentYear} Fashion Shop. Giao diện phục vụ nghiệp vụ bán quần áo.
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
