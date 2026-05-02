import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LayoutPublic from "../components/LayoutPublic";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(username, password, rememberMe);

    if (result.success) {
      // Redirect dựa trên role (check từ userData trả về, không gọi isAdmin())
      const user = result.user;
      if (user?.role === "Admin") {
        navigate("/dashboard");
      } else {
        navigate("/home");
      }
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <LayoutPublic>
      <div className="register-login-section spad">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 offset-lg-3">
              <div className="login-form">
                <h2>Đăng nhập</h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="group-input">
                    <label htmlFor="username">Tên đăng nhập *</label>
                    <input
                      id="username"
                      type="text"
                      placeholder="Nhập tên đăng nhập"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="group-input">
                    <label htmlFor="password">Mật khẩu *</label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="group-input gi-check">
                    <div className="gi-more">
                      <label htmlFor="rememberMe">
                        Ghi nhớ đăng nhập
                        <input
                          id="rememberMe"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span className="checkmark"></span>
                      </label>
                      <a href="#" className="forget-pass">
                        Quên mật khẩu
                      </a>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="site-btn login-btn"
                    disabled={loading}
                  >
                    {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </button>
                </form>
                <div className="switch-login">
                  <Link to="/register" className="or-login">
                    Tạo tài khoản mới
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutPublic>
  );
};

export default Login;
