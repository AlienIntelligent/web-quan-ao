import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { cartStorage } from "../services/api";

const ShoppingCart = () => {
  const [cartItems, setCartItems] = useState([]);

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
  const shipping = 10;
  const total = subtotal + shipping;

  const updateQuantity = (productId, nextQty) => {
    cartStorage.updateQuantity(productId, nextQty);
  };

  const removeItem = (productId) => {
    cartStorage.removeItem(productId);
  };

  return (
    <LayoutPublic>
      {/* Breadcrumb Section Begin */}
      <section className="breadcrumb-section set-bg" data-setbg="/img/breadcrumb.jpg">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2>Giỏ hàng</h2>
            </div>
          </div>
        </div>
      </section>
      {/* Breadcrumb Section End */}

      {/* Shopping Cart Section Begin */}
      <section className="shopping-cart spad">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="cart-table">
                <table>
                  <thead>
                    <tr>
                      <th className="p-name">Sản phẩm</th>
                      <th>Gia</th>
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
                    <form action="#" className="coupon-form">
                      <input type="text" placeholder="Nhập mã giảm giá" />
                      <button type="submit" className="site-btn coupon-btn">
                        Áp dụng
                      </button>
                    </form>
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
      {/* Shopping Cart Section End */}
    </LayoutPublic>
  );
};

export default ShoppingCart;
