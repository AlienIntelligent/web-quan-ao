import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { wishlistApi, cartStorage } from "../services/api";
import { alertSuccess, alertError, confirmAction } from "../services/swal";

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const res = await wishlistApi.get();
      setItems(res.data || []);
    } catch (err) {
      console.error("Failed to load wishlist", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const removeFromWishlist = async (productId, variantId) => {
    try {
      await wishlistApi.remove(productId, variantId);
      alertSuccess("Đã xóa!", "Sản phẩm đã được xóa khỏi danh sách yêu thích.");
      loadWishlist();
    } catch (err) {
      alertError("Lỗi", "Không thể xóa sản phẩm.");
    }
  };

  const clearWishlist = async () => {
    const isConfirmed = await confirmAction("Xóa tất cả?", "Bạn có chắc chắn muốn xóa toàn bộ danh sách yêu thích?");
    if (!isConfirmed) return;

    try {
      await wishlistApi.clear();
      alertSuccess("Đã xóa!", "Danh sách yêu thích đã được dọn sạch.");
      setItems([]);
    } catch (err) {
      alertError("Lỗi", "Không thể dọn sạch danh sách.");
    }
  };

  const addToCart = (item) => {
    const product = {
      id: item.productId,
      variantId: item.variantId,
      name: item.product?.name,
      price: item.product?.price,
      size: item.productVariant?.sizeNavigation?.name,
      color: item.productVariant?.colorNavigation?.name,
      imageUrl: item.product?.imageUrl
    };
    cartStorage.addItem(product, 1);
    alertSuccess("Đã thêm!", `${product.name} đã được thêm vào giỏ hàng.`);
  };

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

  const resolveProductImage = (item) => {
    const raw = item?.product?.imageUrl;
    if (!raw || !String(raw).trim()) return "/img/products/product-1.jpg";
    if (
      String(raw).startsWith("http://") ||
      String(raw).startsWith("https://") ||
      String(raw).startsWith("/")
    ) {
      return raw;
    }
    return `/img/products/${raw}`;
  };

  return (
    <LayoutPublic>
      <div className="breacrumb-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="breadcrumb-text">
                <Link to="/"><i className="fa fa-home"></i> Trang chủ</Link>
                <span>Yêu thích</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="shopping-cart spad">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="section-title">
                <h2>Sản phẩm yêu thích</h2>
              </div>
              
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-warning" role="status"></div>
                  <p className="mt-3">Đang tải danh sách...</p>
                </div>
              ) : items.length > 0 ? (
                <div className="cart-table shadow-sm rounded overflow-hidden">
                  <table>
                    <thead>
                      <tr>
                        <th>Hình ảnh</th>
                        <th className="p-name">Tên sản phẩm</th>
                        <th>Giá</th>
                        <th>Hành động</th>
                        <th><i className="ti-close"></i></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="cart-pic first-row">
                            <img 
                              src={resolveProductImage(item)} 
                              alt={item.product?.name} 
                              style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                            />
                          </td>
                          <td className="cart-title first-row">
                            <h5>{item.product?.name}</h5>
                            {item.productVariant && (
                              <p className="small text-muted mb-0">
                                {item.productVariant.sizeNavigation?.name} / {item.productVariant.colorNavigation?.name}
                              </p>
                            )}
                          </td>
                          <td className="p-price first-row">{formatMoney(item.product?.price)}</td>
                          <td className="add-cart first-row">
                            <button 
                              className="btn btn-warning btn-sm text-white"
                              onClick={() => addToCart(item)}
                            >
                              Thêm vào giỏ
                            </button>
                          </td>
                          <td className="close-td first-row">
                            <i 
                              className="ti-close" 
                              style={{ cursor: 'pointer' }}
                              onClick={() => removeFromWishlist(item.productId, item.variantId)}
                            ></i>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-5 bg-white shadow-sm rounded">
                  <i className="fa fa-heart-o text-muted mb-3" style={{ fontSize: '48px' }}></i>
                  <p className="text-muted">Danh sách yêu thích của bạn đang trống.</p>
                  <Link to="/shop" className="btn btn-warning text-white px-4">Mua sắm ngay</Link>
                </div>
              )}

              {items.length > 0 && (
                <div className="row mt-4">
                  <div className="col-lg-12">
                    <div className="cart-buttons text-right">
                      <Link to="/shop" className="primary-btn continue-shop mr-2">Tiếp tục mua sắm</Link>
                      <button 
                        className="primary-btn up-cart bg-danger border-0"
                        onClick={clearWishlist}
                      >
                        Xóa tất cả
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </LayoutPublic>
  );
};

export default Wishlist;
