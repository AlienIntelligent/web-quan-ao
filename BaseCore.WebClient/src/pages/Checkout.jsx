import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { cartStorage, couponStorage, orderApi, promotionApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const formatMoney = (value) =>
  Number(value || 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });

const Checkout = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    ward: "",
    city: "",
    note: "",
  });

  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const cartItems = cartStorage.getItems();
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = cartItems.length ? 30000 : 0;
  const discount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, subtotal + shipping - discount);

  useEffect(() => {
    const savedCoupon = couponStorage.get();
    if (!savedCoupon?.code || !cartItems.length) {
      setAppliedCoupon(null);
      setCouponCode(savedCoupon?.code || "");
      return;
    }

    let cancelled = false;
    promotionApi
      .validate({
        code: savedCoupon.code,
        orderSubtotal: subtotal,
        shippingFee: shipping,
      })
      .then((res) => {
        if (cancelled) return;
        setAppliedCoupon(res.data);
        setCouponCode(res.data.code);
        couponStorage.set(res.data);
      })
      .catch(() => {
        if (cancelled) return;
        setAppliedCoupon(null);
        couponStorage.clear();
      });

    return () => {
      cancelled = true;
    };
  }, [subtotal, shipping, cartItems.length]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const applyCoupon = async (e) => {
    e.preventDefault();
    const code = couponCode.trim();
    setCouponMessage("");
    setCouponError("");

    if (!code) {
      setCouponError("Vui lòng nhập mã giảm giá.");
      return;
    }

    if (!cartItems.length) {
      setCouponError("Giỏ hàng đang trống.");
      return;
    }

    setApplyingCoupon(true);
    try {
      const response = await promotionApi.validate({
        code,
        orderSubtotal: subtotal,
        shippingFee: shipping,
      });
      setAppliedCoupon(response.data);
      couponStorage.set(response.data);
      setCouponMessage(response.data.message || "Áp dụng mã giảm giá thành công.");
    } catch (error) {
      setAppliedCoupon(null);
      couponStorage.clear();
      setCouponError(error.response?.data?.message || "Không thể áp dụng mã giảm giá.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
    setCouponError("");
    couponStorage.clear();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentCartItems = cartStorage.getItems();
    if (!isAuthenticated) {
      alert("Bạn cần đăng nhập để đặt hàng.");
      return;
    }
    if (currentCartItems.length === 0) {
      alert("Giỏ hàng đang trống.");
      return;
    }

    const shippingAddress = [
      `${formData.firstName} ${formData.lastName}`.trim(),
      formData.phone,
      formData.address,
      formData.ward,
      formData.city,
      formData.note ? `Ghi chú: ${formData.note}` : "",
      `Thanh toán: ${paymentMethod === "cod" ? "Khi nhận hàng" : "Chuyển khoản"}`,
    ]
      .filter(Boolean)
      .join(" - ");

    setSubmitting(true);
    try {
      await orderApi.create({
        shippingAddress,
        shippingFee: shipping,
        promotionCode: appliedCoupon?.code || null,
        items: currentCartItems.map((x) => ({
          productId: x.productId,
          quantity: x.quantity,
        })),
      });
      cartStorage.clear();
      couponStorage.clear();
      alert("Đặt hàng thành công!");
      navigate("/my-orders");
    } catch (error) {
      alert(error.response?.data?.message || "Đặt hàng thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LayoutPublic>
      <section className="breadcrumb-section set-bg" style={{ backgroundImage: "url(/img/breadcrumb.jpg)" }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2>Thanh toán</h2>
            </div>
          </div>
        </div>
      </section>

      <section className="checkout-section spad">
        <div className="container">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="row">
              <div className="col-lg-8">
                <h4>Thông tin nhận hàng</h4>
                <div className="row">
                  <div className="col-lg-6">
                    <label htmlFor="firstName">Họ</label>
                    <input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                  </div>
                  <div className="col-lg-6">
                    <label htmlFor="lastName">Tên</label>
                    <input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                  </div>
                  <div className="col-lg-12">
                    <label htmlFor="phone">Số điện thoại</label>
                    <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required />
                  </div>
                  <div className="col-lg-12">
                    <label htmlFor="email">Email</label>
                    <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
                  </div>
                  <div className="col-lg-12">
                    <label htmlFor="address">Địa chỉ</label>
                    <input id="address" name="address" value={formData.address} onChange={handleChange} required />
                  </div>
                  <div className="col-lg-6">
                    <label htmlFor="ward">Phường/Xã</label>
                    <input id="ward" name="ward" value={formData.ward} onChange={handleChange} />
                  </div>
                  <div className="col-lg-6">
                    <label htmlFor="city">Tỉnh/Thành phố</label>
                    <input id="city" name="city" value={formData.city} onChange={handleChange} required />
                  </div>
                  <div className="col-lg-12">
                    <label htmlFor="note">Ghi chú giao hàng</label>
                    <input id="note" name="note" value={formData.note} onChange={handleChange} placeholder="Ví dụ: giao giờ hành chính" />
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
                          <span>{formatMoney(item.price * item.quantity)}</span>
                        </li>
                      ))}
                      <li className="fw-normal">Tạm tính <span>{formatMoney(subtotal)}</span></li>
                      <li className="fw-normal">Vận chuyển <span>{formatMoney(shipping)}</span></li>
                      {appliedCoupon && <li className="fw-normal">Giảm giá <span>-{formatMoney(discount)}</span></li>}
                      <li className="total-price">Tổng cộng <span>{formatMoney(total)}</span></li>
                    </ul>
                    <div className="discount-coupon mb-4">
                      <h6>Mã giảm giá</h6>
                      <form className="coupon-form" onSubmit={applyCoupon}>
                        <input
                          type="text"
                          placeholder="Nhập mã giảm giá"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                        />
                        <button type="submit" className="site-btn coupon-btn" disabled={applyingCoupon}>
                          {applyingCoupon ? "Đang kiểm tra..." : "Áp dụng"}
                        </button>
                      </form>
                      {appliedCoupon && (
                        <p className="text-success mt-2 mb-0">
                          Đã áp dụng {appliedCoupon.code}.{" "}
                          <button type="button" className="btn btn-link p-0" onClick={removeCoupon}>
                            Bỏ mã
                          </button>
                        </p>
                      )}
                      {couponMessage && <p className="text-success mt-2 mb-0">{couponMessage}</p>}
                      {couponError && <p className="text-danger mt-2 mb-0">{couponError}</p>}
                    </div>
                    <div className="payment-check">
                      <div className="pc-item">
                        <label htmlFor="pm-cod">
                          Thanh toán khi nhận hàng
                          <input
                            id="pm-cod"
                            type="radio"
                            value="cod"
                            checked={paymentMethod === "cod"}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                          />
                          <span className="checkmark"></span>
                        </label>
                      </div>
                      <div className="pc-item">
                        <label htmlFor="pm-bank">
                          Chuyển khoản ngân hàng
                          <input
                            id="pm-bank"
                            type="radio"
                            value="bank-transfer"
                            checked={paymentMethod === "bank-transfer"}
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
    </LayoutPublic>
  );
};

export default Checkout;
