import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { authApi } from "../services/api";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    country: "",
    zipCode: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.username.trim(),
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`.trim() || formData.username.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };

      const response = await authApi.register(payload);
      setSuccess(
        response.data?.message ||
          "Đã gửi đăng ký. Vui lòng chờ quản trị viên duyệt."
      );
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutPublic>
      {/* Breadcrumb Section Begin */}
      <section className="breadcrumb-section set-bg" data-setbg="/img/breadcrumb.jpg">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2>Đăng ký</h2>
            </div>
          </div>
        </div>
      </section>
      {/* Breadcrumb Section End */}

      {/* Register Section Begin */}
      <div className="register-login-section spad">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 offset-lg-3">
              <div className="register-form">
                <h2>Đăng ký</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="group-input">
                    <label htmlFor="username">Tên đăng nhập *</label>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      placeholder="Nhập tên đăng nhập"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="group-input">
                    <label htmlFor="firstName">Họ *</label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      placeholder="Nhập họ"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="group-input">
                    <label htmlFor="lastName">Tên *</label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      placeholder="Nhập tên"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="group-input">
                    <label htmlFor="email">Địa chỉ email *</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="group-input">
                    <label htmlFor="phone">Số điện thoại</label>
                    <input
                      id="phone"
                      type="text"
                      name="phone"
                      placeholder="Nhập số điện thoại"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="group-input">
                    <label htmlFor="password">Mật khẩu *</label>
                    <input
                      id="password"
                      type="password"
                      name="password"
                      placeholder="Nhập mật khẩu"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="group-input">
                    <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
                    <input
                      id="confirmPassword"
                      type="password"
                      name="confirmPassword"
                      placeholder="Nhập lại mật khẩu"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="group-input">
                    <input
                      type="text"
                      name="address"
                      placeholder="Địa chỉ"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="group-input">
                    <input
                      type="text"
                      name="city"
                      placeholder="Thành phố"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="group-input">
                    <input
                      type="text"
                      name="country"
                      placeholder="Quốc gia"
                      value={formData.country}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="group-input">
                    <input
                      type="text"
                      name="zipCode"
                      placeholder="Mã bưu chính"
                      value={formData.zipCode}
                      onChange={handleChange}
                    />
                  </div>
                  <button type="submit" className="site-btn register-btn" disabled={loading}>
                    {loading ? "Đang gửi..." : "ĐĂNG KÝ"}
                  </button>
                </form>
                <div className="switch-login">
                  <Link to="/login" className="or-login">
                    Đã có tài khoản? Đăng nhập
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Register Section End */}
    </LayoutPublic>
  );
};

export default Register;
