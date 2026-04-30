import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Footer Section Begin */}
      <footer className="footer-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-3">
              <div className="footer-left">
                <div className="footer-logo">
                  <a href="/">
                    <img src="/img/footer-logo.png" alt="Logo" />
                  </a>
                </div>
                <ul>
                  <li>Địa chỉ: 60-49 Road 11378 New York</li>
                  <li>Điện thoại: +65 11.188.888</li>
                  <li>Email: hello.colorlib@gmail.com</li>
                </ul>
                <div className="footer-social">
                  <a href="#">
                    <i className="fa fa-facebook"></i>
                  </a>
                  <a href="#">
                    <i className="fa fa-instagram"></i>
                  </a>
                  <a href="#">
                    <i className="fa fa-twitter"></i>
                  </a>
                  <a href="#">
                    <i className="fa fa-pinterest"></i>
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-2 offset-lg-1">
              <div className="footer-widget">
                <h5>Thông tin</h5>
                <ul>
                  <li>
                    <a href="#">Về chúng tôi</a>
                  </li>
                  <li>
                    <Link to="/check-out">Thanh toán</Link>
                  </li>
                  <li>
                    <Link to="/contact">Liên hệ</Link>
                  </li>
                  <li>
                    <a href="#">Dịch vụ</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-2">
              <div className="footer-widget">
                <h5>Tài khoản của tôi</h5>
                <ul>
                  <li>
                    <a href="#">Tài khoản của tôi</a>
                  </li>
                  <li>
                    <Link to="/contact">Liên hệ</Link>
                  </li>
                  <li>
                    <Link to="/shopping-cart">Giỏ hàng</Link>
                  </li>
                  <li>
                    <Link to="/shop">Cửa hàng</Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="newslatter-item">
                <h5>Đăng ký nhận tin khuyến mãi</h5>
                <p>
                  Nhận email cập nhật sản phẩm mới và ưu đãi đặc biệt.
                </p>
                <form action="#" className="subscribe-form">
                  <input type="text" placeholder="Nhập email của bạn" />
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
                  Bản quyền &copy;{currentYear} Bảo lưu mọi quyền | Mẫu giao diện này được thiết kế với{" "}
                  <i className="fa fa-heart-o" aria-hidden="true"></i> by{" "}
                  <a
                    href="https://colorlib.com"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Colorlib
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      {/* Footer Section End */}
    </>
  );
};

export default Footer;
