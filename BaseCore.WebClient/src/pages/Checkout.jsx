import React, { useState } from "react";
import LayoutPublic from "../components/LayoutPublic";
import { cartStorage, orderApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const Checkout = () => {
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    city: "",
    zipCode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("credit-card");
  const [submitting, setSubmitting] = useState(false);
  const cartItems = cartStorage.getItems();
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = cartItems.length ? 10 : 0;
  const total = subtotal + shipping;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cartItems = cartStorage.getItems();
    if (!isAuthenticated) {
      alert("Bạn cần đăng nhập để đặt hàng.");
      return;
    }
    if (cartItems.length === 0) {
      alert("Giỏ hàng đang trống.");
      return;
    }

    setSubmitting(true);
    try {
      await orderApi.create({
        shippingAddress: formData.address,
        items: cartItems.map((x) => ({
          productId: x.productId,
          quantity: x.quantity,
        })),
      });
      cartStorage.clear();
      alert("Đặt hàng thành công!");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        country: "",
        city: "",
        zipCode: "",
      });
    } catch (error) {
      alert(error.response?.data?.message || "Đặt hàng thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LayoutPublic>
      {/* Breadcrumb Section Begin */}
      <section className="breadcrumb-section set-bg" data-setbg="/img/breadcrumb.jpg">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2>Thanh toán</h2>
            </div>
          </div>
        </div>
      </section>
      {/* Breadcrumb Section End */}

      {/* Checkout Section Begin */}
      <section className="checkout-section spad">
        <div className="container">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="row">
              <div className="col-lg-8">
                <h4>Thông tin thanh toán</h4>
                <div className="row">
                  <div className="col-lg-6">
                    <label htmlFor="firstName">Họ</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-lg-6">
                    <label htmlFor="lastName">Tên</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-lg-12">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-lg-12">
                    <label htmlFor="phone">Số điện thoại</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-lg-12">
                    <label htmlFor="address">Địa chỉ</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-lg-6">
                    <label htmlFor="country">Quốc gia</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-lg-6">
                    <label htmlFor="city">Thành phố</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-lg-12">
                    <label htmlFor="zipCode">Mã bưu chính</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                    />
                  </div>
                </div>

              </div>
              <div className="col-lg-4">
                <div className="place-order">
                  <h4>Đơn hàng của bạn</h4>
                  <div className="order-total">
                    <ul className="order-table">
                      <li>Sản phẩm <span>Tổng</span></li>
                      {cartItems.map((item) => (
                        <li key={item.productId} className="fw-normal">
                          {item.name} x {item.quantity}
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                      <li className="fw-normal">
                        Tạm tính <span>${subtotal.toFixed(2)}</span>
                      </li>
                      <li className="fw-normal">
                        Vận chuyển <span>${shipping.toFixed(2)}</span>
                      </li>
                      <li className="total-price">
                        Tổng cộng <span>${total.toFixed(2)}</span>
                      </li>
                    </ul>
                    <div className="payment-check">
                      <div className="pc-item">
                        <label htmlFor="pm-card">
                          Thẻ tín dụng
                          <input
                            id="pm-card"
                            type="radio"
                            value="credit-card"
                            checked={paymentMethod === "credit-card"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </div>
                      <div className="pc-item">
                        <label htmlFor="pm-paypal">
                          Paypal
                          <input
                            id="pm-paypal"
                            type="radio"
                            value="paypal"
                            checked={paymentMethod === "paypal"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </div>
                    </div>
                    <div className="order-btn">
                      <button type="submit" className="site-btn place-btn">
                        {submitting ? "Đang đặt hàng..." : "Đặt hàng"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
      {/* Checkout Section End */}
    </LayoutPublic>
  );
};

export default Checkout;
