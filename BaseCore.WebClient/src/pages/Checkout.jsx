import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { cartStorage, couponStorage, orderApi, promotionApi, checkoutStorage } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { alertSuccess, alertError, confirmAction } from "../services/swal";

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
  const [promotions, setPromotions] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    // Ưu tiên lấy từ checkoutStorage (những món đã chọn từ giỏ)
    const items = checkoutStorage.get();
    if (items && items.length > 0) {
      setCartItems(items);
    } else {
      // Fallback lấy toàn bộ giỏ (nếu vào trực tiếp trang checkout)
      setCartItems(cartStorage.getItems());
    }
  }, []);
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);
  const promotionLines = useMemo(
    () =>
      cartItems.map((item) => ({
        productId: item.productId,
        subtotal: item.price * item.quantity,
      })),
    [cartItems],
  );
  const shipping = cartItems.length ? 30000 : 0;
  const vat = Math.round(subtotal * 0.08);
  const discount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, subtotal + shipping + vat - discount);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await promotionApi.getAll({ pageSize: 100, isActive: true });
        const list = response.data.items || response.data || [];
        // Lọc mã còn hạn và còn lượt dùng
        const activePromos = list.filter(p => {
          const isExpired = p.endDate && new Date(p.endDate) < new Date();
          const isLimitReached = p.usageLimit && p.usedCount >= p.usageLimit;
          return !isExpired && !isLimitReached && p.isActive;
        });
        setPromotions(activePromos);
      } catch (err) {
        console.error("Không thể tải danh sách khuyến mãi", err);
      }
    };
    fetchPromotions();
  }, []);

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
        lines: promotionLines,
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
  }, [subtotal, shipping, cartItems.length, promotionLines]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyCode = async (code) => {
    if (!code) return;
    if (!cartItems.length) {
      setCouponError("Giỏ hàng đang trống.");
      return;
    }

    setApplyingCoupon(true);
    setCouponMessage("");
    setCouponError("");
    try {
      const response = await promotionApi.validate({
        code,
        orderSubtotal: subtotal,
        shippingFee: shipping,
        lines: promotionLines,
      });
      setAppliedCoupon(response.data);
      couponStorage.set(response.data);
      setCouponMessage(response.data.message || "Áp dụng mã giảm giá thành công.");
      setCouponCode(code);
    } catch (error) {
      setAppliedCoupon(null);
      couponStorage.clear();
      setCouponError(error.response?.data?.message || "Không thể áp dụng mã giảm giá.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const applyCoupon = async () => {
    await handleApplyCode(couponCode.trim());
  };

  const onSelectPromotion = (e) => {
    const code = e.target.value;
    if (code) {
      handleApplyCode(code);
    } else {
      removeCoupon();
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
    const currentCartItems = cartItems;
    if (!isAuthenticated) {
      alertError("Chưa đăng nhập!", "Bạn cần đăng nhập để thực hiện đặt hàng.");
      return;
    }
    if (currentCartItems.length === 0) {
      alertError("Giỏ hàng trống!", "Vui lòng chọn sản phẩm trước khi thanh toán.");
      return;
    }

    const result = await confirmAction(
      "Xác nhận đặt hàng?",
      `Tổng số tiền thanh toán là ${formatMoney(total)}.`,
      "Đặt hàng ngay"
    );

    if (!result.isConfirmed) return;

    const shippingAddress = [
      `${formData.firstName} ${formData.lastName}`.trim(),
      formData.phone,
      formData.address,
      formData.ward,
      formData.city,
    ]
      .filter(Boolean)
      .join(" - ");

    setSubmitting(true);
    try {
      await orderApi.create({
        shippingAddress,
        shippingFee: shipping,
        promotionCode: appliedCoupon?.code || null,
        paymentMethod: paymentMethod === "cod" ? "COD" : "BANK_TRANSFER",
        note: formData.note,
        items: currentCartItems.map((x) => ({
          productId: x.productId,
          variantId: x.variantId || null,
          quantity: x.quantity,
        })),
      });
      
      // Chỉ xóa những sản phẩm đã mua khỏi giỏ hàng chính
      cartItems.forEach(item => {
          const items = cartStorage.getItems().filter(x => !(x.productId === item.productId && (x.variantId || 0) === (item.variantId || 0)));
          localStorage.setItem('fashi_cart', JSON.stringify(items));
      });
      window.dispatchEvent(new Event('fashi-cart-updated'));
      
      checkoutStorage.clear();
      couponStorage.clear();
      
      await alertSuccess("Thành công!", "Đơn hàng của bạn đã được tiếp nhận.");
      navigate("/my-orders");
    } catch (error) {
      alertError("Lỗi đặt hàng", error.response?.data?.message || "Đã có lỗi xảy ra, vui lòng thử lại.");
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
                      {cartItems.map((item) => {
                        const itemKey = `${item.productId}-${item.variantId || 0}`;
                        return (
                          <li key={itemKey} className="fw-normal">
                            <div className="d-flex justify-content-between">
                              <span>
                                {item.name} x {item.quantity}
                                {(item.size || item.color) && (
                                  <div className="small text-muted" style={{ fontSize: '11px' }}>
                                    Phân loại: {item.size}{item.size && item.color ? ', ' : ''}{item.color}
                                  </div>
                                )}
                              </span>
                              <span>{formatMoney(item.price * item.quantity)}</span>
                            </div>
                          </li>
                        );
                      })}
                      <li className="fw-normal">Tạm tính <span>{formatMoney(subtotal)}</span></li>
                      <li className="fw-normal">Vận chuyển <span>{formatMoney(shipping)}</span></li>
                      <li className="fw-normal">Thuế VAT (8%) <span>{formatMoney(vat)}</span></li>
                      {appliedCoupon && <li className="fw-normal">Giảm giá <span>-{formatMoney(discount)}</span></li>}
                      <li className="total-price">Tổng cộng <span>{formatMoney(total)}</span></li>
                    </ul>
                    <div className="discount-coupon mb-4">
                      <h6>Mã giảm giá</h6>
                      <div className="coupon-select mb-2">
                        <select 
                          className="form-control" 
                          value={appliedCoupon?.code || ""} 
                          onChange={onSelectPromotion}
                        >
                          <option value="">-- Chọn mã giảm giá --</option>
                          {promotions.map(p => (
                            <option key={p.id} value={p.code}>
                              {p.code} - Giảm {formatMoney(p.discountValue)}{p.discountType === 'Percentage' || p.discountType === '1' ? '%' : 'đ'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="coupon-form">
                        <input
                          type="text"
                          placeholder="Hoặc nhập mã tay"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              applyCoupon();
                            }
                          }}
                        />
                        <button type="button" onClick={applyCoupon} className="site-btn coupon-btn" disabled={applyingCoupon}>
                          {applyingCoupon ? "Đang kiểm tra..." : "Áp dụng"}
                        </button>
                      </div>
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
