import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { cartStorage, couponStorage, promotionApi, checkoutStorage } from "../services/api";
import { alertSuccess, alertError, confirmAction } from "../services/swal";

const ShoppingCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState([]);

  useEffect(() => {
    const syncCart = () => setCartItems(cartStorage.getItems());
    syncCart();
    window.addEventListener(cartStorage.eventName, syncCart);
    window.addEventListener("storage", syncCart);

    // Fetch available promotions
    promotionApi.getAll({ pageSize: 100 }).then(res => {
      setAvailablePromotions(res.data.items || []);
    }).catch(err => console.error("Error fetching promotions:", err));

    return () => {
      window.removeEventListener(cartStorage.eventName, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const selectedItems = useMemo(
    () => cartItems.filter(item => selectedItemIds.includes(item.productId)),
    [cartItems, selectedItemIds]
  );

  const subtotal = useMemo(
    () => selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [selectedItems],
  );

  const shipping = selectedItems.length ? 30000 : 0;
  const discount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, subtotal + shipping - discount);
  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

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

  const removeItem = async (productId) => {
    const item = cartItems.find((x) => x.productId === productId);
    const result = await confirmAction(
      "Xóa sản phẩm?",
      `Bạn có chắc chắn muốn xóa ${item?.name || "sản phẩm này"} khỏi giỏ hàng?`,
      "Xóa ngay",
    );

    if (result.isConfirmed) {
      cartStorage.removeItem(productId);
      alertSuccess("Đã xóa!", "Sản phẩm đã được xóa khỏi giỏ hàng.");
    }
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
      alertSuccess("Thành công!", response.data.message || "Đã áp dụng mã giảm giá.");
    } catch (error) {
      setAppliedCoupon(null);
      couponStorage.clear();
      alertError("Thất bại!", error.response?.data?.message || "Mã giảm giá không hợp lệ.");
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

  const selectPromo = async (promo) => {
    setCouponCode(promo.code);
    setShowPromoModal(false);
    
    // Automatically apply the coupon after selection
    setApplyingCoupon(true);
    try {
      const response = await promotionApi.validate({
        code: promo.code,
        orderSubtotal: subtotal,
        shippingFee: shipping,
      });
      setAppliedCoupon(response.data);
      couponStorage.set(response.data);
      alertSuccess("Thành công!", response.data.message || "Đã áp dụng mã giảm giá.");
    } catch (error) {
      setAppliedCoupon(null);
      couponStorage.clear();
      alertError("Thất bại!", error.response?.data?.message || "Mã giảm giá không hợp lệ.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const toggleItem = (productId) => {
    setSelectedItemIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleAll = () => {
    if (selectedItemIds.length === cartItems.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cartItems.map(i => i.productId));
    }
  };

  const removeSelected = async () => {
    if (selectedItemIds.length === 0) return;
    const result = await confirmAction(
      "Xóa sản phẩm đã chọn?",
      "Bạn có chắc chắn muốn xóa các sản phẩm đang được chọn khỏi giỏ hàng?",
      "Xóa ngay"
    );
    if (result.isConfirmed) {
      selectedItemIds.forEach(id => cartStorage.removeItem(id));
      setSelectedItemIds([]);
      alertSuccess("Đã xóa!", "Các sản phẩm đã được loại bỏ.");
    }
  };

  const handlePurchase = () => {
    if (selectedItems.length === 0) return;
    checkoutStorage.set(selectedItems);
    window.location.href = '/check-out';
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

      <section className="shopping-cart spad" style={{ background: '#f5f5f5', padding: '20px 0 100px' }}>
        <div className="container">
          {/* Cart Header */}
          <div className="cart-header-shopee d-flex align-items-center mb-3 shadow-sm">
            <div className="col-checkbox px-3">
              <input 
                type="checkbox" 
                checked={cartItems.length > 0 && selectedItemIds.length === cartItems.length}
                onChange={toggleAll}
              />
            </div>
            <div className="col-product">Sản Phẩm</div>
            <div className="col-price text-center">Đơn Giá</div>
            <div className="col-quantity text-center">Số Lượng</div>
            <div className="col-total text-center">Số Tiền</div>
            <div className="col-action text-center">Thao Tác</div>
          </div>

          {/* Cart Items */}
          <div className="cart-items-container">
            {cartItems.length === 0 ? (
              <div className="empty-cart-shopee shadow-sm text-center p-5">
                <img src="/img/empty-cart.png" alt="Empty" style={{ width: '100px', opacity: 0.5 }} />
                <p className="mt-3">Giỏ hàng của bạn còn trống</p>
                <Link to="/shop" className="primary-btn mt-2" style={{ background: '#e7ab3c', border: 'none' }}>MUA NGAY</Link>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.productId} className={`cart-item-shopee d-flex align-items-center mb-3 shadow-sm ${selectedItemIds.includes(item.productId) ? 'selected' : ''}`}>
                  <div className="col-checkbox px-3">
                    <input 
                      type="checkbox" 
                      checked={selectedItemIds.includes(item.productId)}
                      onChange={() => toggleItem(item.productId)}
                    />
                  </div>
                  <div className="col-product d-flex align-items-center">
                    <div className="item-pic">
                      <img src={item.imageUrl} alt={item.name} />
                    </div>
                    <div className="item-info ml-3">
                      <Link to={`/product/${item.productId}`} className="item-name">{item.name}</Link>
                    </div>
                  </div>
                  <div className="col-price text-center">{formatMoney(item.price)}</div>
                  <div className="col-quantity d-flex justify-content-center">
                    <div className="quantity-shopee d-flex align-items-center">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                      <input type="text" value={item.quantity} readOnly />
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <div className="col-total text-center text-orange">{formatMoney(item.price * item.quantity)}</div>
                  <div className="col-action text-center">
                    <button className="btn-delete-item" onClick={() => removeItem(item.productId)}>Xóa</button>
                    <Link to={`/shop?categoryId=${item.categoryId}`} className="btn-similar-item mt-1">Tìm tương tự</Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Voucher Section */}
          <div className="voucher-section-shopee shadow-sm mb-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center flex-grow-1">
              <i className="fa fa-ticket mr-2" style={{ color: '#e7ab3c', fontSize: '20px' }}></i>
              <span style={{ fontWeight: '500' }}>Fashi Voucher</span>
              {appliedCoupon && (
                <div className="applied-badge ml-4">
                  Mã: <strong>{appliedCoupon.code}</strong>
                  <span className="ml-2 text-dark">(-{formatMoney(discount)})</span>
                </div>
              )}
            </div>
            <div className="d-flex align-items-center">
              {appliedCoupon && (
                <button type="button" className="btn-link mr-4" onClick={removeCoupon} style={{ color: '#888', fontSize: '13px' }}>
                  Xóa mã
                </button>
              )}
              <button 
                className="btn-select-voucher-link" 
                onClick={() => setShowPromoModal(true)}
              >
                {appliedCoupon ? 'Thay đổi mã' : 'Chọn hoặc nhập mã'}
              </button>
            </div>
          </div>

          {/* Sticky Checkout Bar */}
          <div className="checkout-bar-shopee shadow-lg d-flex align-items-center justify-content-between">
            <div className="checkout-left d-flex align-items-center">
              <div className="select-all ml-4 d-flex align-items-center">
                <input 
                  type="checkbox" 
                  checked={cartItems.length > 0 && selectedItemIds.length === cartItems.length}
                  onChange={toggleAll}
                  className="mr-2"
                />
                Chọn Tất Cả ({cartItems.length})
              </div>
              <button className="btn-link ml-4" onClick={removeSelected} style={{ color: '#222' }}>Xóa mục đã chọn</button>
            </div>
            <div className="checkout-right d-flex align-items-center">
              <div className="total-label text-right">
                <div>Tổng thanh toán ({selectedItems.length} Sản phẩm):</div>
                {appliedCoupon && (
                  <div className="small text-muted">Tiết kiệm: {formatMoney(discount)}</div>
                )}
              </div>
              <div className="total-amount mx-3">{formatMoney(total)}</div>
              <button 
                onClick={handlePurchase} 
                className="btn-purchase" 
                disabled={selectedItems.length === 0}
                style={{ opacity: selectedItems.length === 0 ? 0.6 : 1 }}
              >
                Mua Hàng
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Promotion Modal */}
      {showPromoModal && (
        <div className="modal-overlay" onClick={() => setShowPromoModal(false)}>
          <div className="promo-modal" onClick={e => e.stopPropagation()}>
            <div className="promo-modal-header d-flex justify-content-between align-items-center">
              <h5>Danh sách mã giảm giá</h5>
              <button className="close-btn" onClick={() => setShowPromoModal(false)}>&times;</button>
            </div>
            <div className="promo-modal-body">
              {availablePromotions.length === 0 ? (
                <p className="text-center">Không có mã giảm giá khả dụng.</p>
              ) : (
                availablePromotions.map(promo => (
                  <div key={promo.id} className="promo-item d-flex justify-content-between align-items-center">
                    <div className="promo-info">
                      <div className="promo-code">{promo.code}</div>
                      <div className="promo-desc">{promo.name}</div>
                      <div className="promo-expiry">Hết hạn: {new Date(promo.endDate).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <button className="btn-use-promo" onClick={() => selectPromo(promo)}>Dùng ngay</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </LayoutPublic>
  );
};

export default ShoppingCart;
