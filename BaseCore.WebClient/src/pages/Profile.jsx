import React from "react";
import { Link } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { useAuth } from "../contexts/AuthContext";

const Profile = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <LayoutPublic>
      <section className="breadcrumb-section set-bg" style={{ backgroundImage: "url(/img/breadcrumb.jpg)" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2>Tài khoản của tôi</h2>
            </div>
          </div>
        </div>
      </section>

      <section className="customer-section spad">
        <div className="container">
          {!isAuthenticated ? (
            <div className="customer-empty">
              <h4>Bạn chưa đăng nhập</h4>
              <p>Đăng nhập để quản lý thông tin nhận hàng và xem đơn mua.</p>
              <Link to="/login" className="primary-btn">Đăng nhập</Link>
            </div>
          ) : (
            <div className="row">
              <div className="col-lg-4">
                <div className="account-menu">
                  <Link to="/profile" className="active"><i className="fa fa-user"></i> Hồ sơ</Link>
                  <Link to="/my-orders"><i className="fa fa-list-alt"></i> Đơn mua</Link>
                  <Link to="/shopping-cart"><i className="fa fa-shopping-bag"></i> Giỏ hàng</Link>
                </div>
              </div>
              <div className="col-lg-8">
                <div className="profile-panel">
                  <h4>Thông tin mua hàng</h4>
                  <div className="profile-row">
                    <span>Tên tài khoản</span>
                    <strong>{user?.username || user?.userName || "Khách hàng"}</strong>
                  </div>
                  <div className="profile-row">
                    <span>Email</span>
                    <strong>{user?.email || "Chưa cập nhật"}</strong>
                  </div>
                  <div className="profile-row">
                    <span>Vai trò</span>
                    <strong>{user?.role || "User"}</strong>
                  </div>
                  <div className="profile-note">
                    <i className="fa fa-info-circle"></i>
                    Thông tin giao hàng chi tiết sẽ được nhập tại bước thanh toán cho từng đơn.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </LayoutPublic>
  );
};

export default Profile;
