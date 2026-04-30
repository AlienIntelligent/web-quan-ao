import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { cartStorage, couponStorage, promotionApi } from "../services/api";

const ShoppingCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    const syncCart = () => setCartItems(cartStorage.getItems());
    syncCart();
    window.addEventListener(cartStorage.eventName, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(cartStorage.eventName, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );
  const shipping = cartItems.length ? 10 : 0;
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

  const updateQuantity = (productId, nextQty) => {
    cartStorage.updateQuantity(productId, nextQty);
  };

  const removeItem = (productId) => {
    cartStorage.removeItem(productId);
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

  return (
    <LayoutPublic>
      <section className="breadcrumb-section set-bg" data-setbg="/img/breadcrumb.jpg">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2>Giỏ hàng</h2>
            </div>
          </div>
        </div>
      </section>

      <section className="shopping-cart spad">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="cart-table">
                <table>
                  <thead>
                    <tr>
                      <th className="p-name">Sản phẩm</th>
                      <th>Giá</th>
                      <th>Số lượng</th>
                      <th>Tổng</th>
                      <th><i className="ti-close"></i></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr key={item.productId}>
                        <td className="cart-pic first-row">
                          <img src={item.imageUrl} alt={item.name} />
                        </td>
                        <td className="cart-title first-row">
                          <div className="pc-title">
                            <h4>{item.name}</h4>
                          </div>
                        </td>
                        <td className="p-price first-row">${item.price.toFixed(2)}</td>
                        <td className="qua-col first-row">
                          <div className="quantity">
                            <div className="pro-qty">
                              <span
                                className="dec qtybtn"
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              >
                                -
                              </span>
                              <input
                                type="text"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(
                                    item.productId,
                                    Number.parseInt(e.target.value || "1", 10),
                                  )
                                }
                              />
                              <span
                                className="inc qtybtn"
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              >
                                +
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="total-price first-row">${(item.price * item.quantity).toFixed(2)}</td>
                        <td className="close-td first-row">
                          <a href="#" onClick={(e) => { e.preventDefault(); removeItem(item.productId); }}>
                            <i className="ti-close"></i>
                          </a>
                        </td>
                      </tr>
                    ))}
                    {cartItems.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center">
                          Giỏ hàng đang trống.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="row">
                <div className="col-lg-6">
                  <div className="cart-buttons">
                    <Link to="/shop" className="primary-btn continue-shop">
                      Tiếp tục mua sắm
                    </Link>
                    <a href="#" className="primary-btn up-cart" onClick={(e) => e.preventDefault()}>
                      Cập nhật giỏ hàng
                    </a>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="discount-coupon">
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
                </div>
                <div className="col-lg-4 offset-lg-8">
                  <div className="proceed-checkout">
                    <ul>
                      <li className="subtotal">
                        Tạm tính <span>${subtotal.toFixed(2)}</span>
                      </li>
                      <li className="subtotal">
                        Vận chuyển <span>${shipping.toFixed(2)}</span>
                      </li>
                      {appliedCoupon && (
                        <li className="subtotal">
                          Giảm giá <span>-${discount.toFixed(2)}</span>
                        </li>
                      )}
                      <li className="cart-total">
                        Tổng cộng <span>${total.toFixed(2)}</span>
                      </li>
                    </ul>
                    <Link to="/check-out" className="proceed-btn">
                      TIẾN HÀNH THANH TOÁN
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </LayoutPublic>
  );
};

export default ShoppingCart;
