import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import {
  cartStorage,
  productApi,
  productVariantApi,
  reviewApi,
} from "../services/api";

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const sliderRef = useRef(null);

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const pid = Number(id);
    if (!Number.isFinite(pid) || pid <= 0) {
      setError("ID sản phẩm không hợp lệ");
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [pRes, vRes, rRes] = await Promise.all([
          productApi.getById(pid),
          productVariantApi.getAll({ productId: pid }),
          reviewApi.getByProductId(pid, { page: 1, pageSize: 10 }),
        ]);

        const p = pRes?.data;
        const vs = Array.isArray(vRes?.data) ? vRes.data : [];

        setProduct(p ?? null);
        setVariants(vs);
        
        if (vs.length > 0) {
            setSelectedSize(vs[0].size);
            setSelectedColor(vs[0].color);
        }

        const payload = rRes?.data || {};
        setReviews(Array.isArray(payload.items) ? payload.items : []);
        setReviewsCount(payload.totalCount ?? 0);
        setAverageRating(payload.averageRating ?? 0);

        // Load related products
        if (p?.categoryId) {
          const relRes = await productApi.getAll({ 
            categoryId: p.categoryId, 
            pageSize: 10,
            status: "active" 
          });
          const relItems = (relRes?.data?.items || []).filter(x => x.id !== pid);
          setRelatedProducts(relItems);
        }
      } catch (e) {
        console.error(e);
        setError(e?.response?.data?.message || "Không tải được sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const sizeOptions = useMemo(() => {
    const sizes = new Set();
    (variants || []).forEach(v => {
        if (v.size) sizes.add(v.size);
    });
    return Array.from(sizes);
  }, [variants]);

  const colorOptions = useMemo(() => {
    const colors = new Set();
    (variants || []).forEach(v => {
        if (v.size === selectedSize && v.color) {
            colors.add(v.color);
        }
    });
    return Array.from(colors);
  }, [variants, selectedSize]);

  const selectedVariant = useMemo(() => {
    if (!variants?.length) return null;
    return variants.find(v => v.size === selectedSize && v.color === selectedColor) 
           || variants.find(v => v.size === selectedSize)
           || variants[0];
  }, [selectedSize, selectedColor, variants]);

  const displayPrice = Number(selectedVariant?.price ?? product?.price ?? 0);
  const displayOriginalPrice = product?.originalPrice ?? null;
  const displayStock = Number(selectedVariant?.stock ?? product?.stock ?? 0);
  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

  const roundedAvg = Math.round(averageRating || 0);
  const productImage = useMemo(() => {
    const raw = product?.imageUrl;
    if (!raw || !String(raw).trim()) return "/img/products/product-1.jpg";
    if (String(raw).startsWith("http://") || String(raw).startsWith("https://") || String(raw).startsWith("/")) {
      return raw;
    }
    if (String(raw).includes("/")) {
      return `/img/${raw}`;
    }
    return `/img/products/${raw}`;
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;

    const qty = Math.max(1, Number(quantity) || 1);
    if (displayStock < qty) {
      alert("Hết hàng cho lựa chọn này");
      return;
    }

    cartStorage.addItem(
      {
        id: product.id,
        variantId: selectedVariant?.id,
        name: product.name,
        price: displayPrice,
        size: selectedVariant?.size,
        color: selectedVariant?.color,
        imageUrl: productImage,
      },
      qty,
    );

    navigate("/shopping-cart");
  };

  if (loading) {
    return (
      <LayoutPublic>
        <div className="container" style={{ padding: 40 }}>
          <div className="spinner-border text-primary" role="status" />
        </div>
      </LayoutPublic>
    );
  }

  if (error || !product) {
    return (
      <LayoutPublic>
        <div className="container" style={{ padding: 40 }}>
          <div className="alert alert-danger">{error || "Không tìm thấy sản phẩm"}</div>
        </div>
      </LayoutPublic>
    );
  }

  return (
    <LayoutPublic>
      {/* Breadcrumb Section Begin */}
      <section className="breadcrumb-section set-bg" data-setbg="/img/breadcrumb.jpg">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2>Chi tiết sản phẩm</h2>
            </div>
          </div>
        </div>
      </section>
      {/* Breadcrumb Section End */}

      {/* Product Details Section Begin */}
      <section className="product-details spad">
        <div className="container">
          <div className="row">
            <div className="col-lg-6">
              <div className="product-pic-zoom">
                <img
                  className="product-big-img"
                  src={productImage}
                  alt={product.name}
                />
              </div>
              <div className="product-thumbs">
                <div className="product-thumbs-track ps-slider owl-carousel">
                  <div className="pt active">
                    <img src={productImage} alt={product.name} />
                  </div>
                  <div className="pt">
                    <img src={productImage} alt={product.name} />
                  </div>
                  <div className="pt">
                    <img src={productImage} alt={product.name} />
                  </div>
                  <div className="pt">
                    <img src={productImage} alt={product.name} />
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-center mt-4" style={{ gap: '20px', fontSize: '16px' }}>
                <div className="d-flex align-items-center" style={{ gap: '10px' }}>
                  <span>Chia sẻ:</span>
                  <i className="fa fa-facebook-official" style={{ color: '#3b5998', cursor: 'pointer' }}></i>
                  <i className="fa fa-messenger" style={{ color: '#0084ff', cursor: 'pointer' }}></i>
                  <i className="fa fa-pinterest" style={{ color: '#bd081c', cursor: 'pointer' }}></i>
                  <i className="fa fa-twitter" style={{ color: '#1da1f2', cursor: 'pointer' }}></i>
                </div>
                <div style={{ width: '1px', height: '15px', backgroundColor: '#ddd' }}></div>
                <div className="d-flex align-items-center" style={{ cursor: 'pointer' }}>
                  <i className="fa fa-heart-o mr-2" style={{ color: '#ff424e' }}></i>
                  <span>Đã thích (1,2k)</span>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="product-details">
                <div className="pd-title-shopee mb-3">
                  <h3 style={{ fontSize: '24px', fontWeight: '500', lineHeight: '1.4', color: '#222', marginBottom: '15px' }}>
                    {product.name}
                  </h3>
                  <div className="d-flex align-items-center mb-0" style={{ gap: '0', fontSize: '14px', height: '24px' }}>
                    {/* Rating Section */}
                    <div className="d-flex align-items-center" style={{ paddingRight: '15px' }}>
                      <span style={{ color: '#e7ab3c', fontWeight: '600', borderBottom: '1px solid #e7ab3c', lineHeight: '1', marginRight: '8px' }}>
                        {averageRating.toFixed(1)}
                      </span>
                      <div className="d-flex align-items-center" style={{ gap: '2px' }}>
                        {[...Array(5)].map((_, i) => (
                          <i
                            key={i}
                            className={i < roundedAvg ? "fa fa-star" : "fa fa-star-o"}
                            style={{ color: '#e7ab3c', fontSize: '12px', lineHeight: '1' }}
                          ></i>
                        ))}
                      </div>
                    </div>

                    {/* Separator */}
                    <div style={{ width: '1px', height: '16px', backgroundColor: '#ddd' }}></div>

                    {/* Reviews Section */}
                    <div className="d-flex align-items-center" style={{ padding: '0 15px' }}>
                      <span style={{ borderBottom: '1px solid #222', fontWeight: '500', lineHeight: '1', marginRight: '5px', color: '#222' }}>
                        {reviewsCount}
                      </span> 
                      <span className="text-muted" style={{ lineHeight: '1' }}>Đánh Giá</span>
                    </div>

                    {/* Separator */}
                    <div style={{ width: '1px', height: '16px', backgroundColor: '#ddd' }}></div>

                    {/* Sold Section */}
                    <div className="d-flex align-items-center" style={{ paddingLeft: '15px' }}>
                      <span style={{ fontWeight: '500', lineHeight: '1', marginRight: '5px', color: '#222' }}>
                        {Math.floor(Math.random() * 5000)}+
                      </span> 
                      <span className="text-muted" style={{ lineHeight: '1' }}>Đã Bán</span>
                    </div>
                  </div>
                </div>
                <div className="pd-price-bar mb-4" style={{ backgroundColor: '#fafafa', padding: '15px 20px', borderRadius: '2px' }}>
                  <div className="d-flex align-items-center flex-wrap">
                    {displayOriginalPrice != null && (
                      <span className="text-muted mr-3" style={{ textDecoration: 'line-through', fontSize: '16px' }}>
                        {formatMoney(displayOriginalPrice)}
                      </span>
                    )}
                    <h4 className="mb-0" style={{ color: '#e7ab3c', fontSize: '30px', fontWeight: '500' }}>
                      {formatMoney(displayPrice)}
                    </h4>
                    {displayOriginalPrice != null && (
                      <span className="ml-3 badge" style={{ backgroundColor: '#e7ab3c', color: '#fff', fontSize: '12px', padding: '2px 5px' }}>
                        -{Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)}% GIẢM
                      </span>
                    )}
                  </div>
                </div>

                <div className="pd-vouchers d-flex align-items-center mb-4" style={{ fontSize: '14px' }}>
                  <span className="text-muted" style={{ width: '110px' }}>Mã Giảm Giá</span>
                  <div className="d-flex" style={{ gap: '10px' }}>
                    <span style={{ background: 'rgba(231, 171, 60, 0.1)', color: '#e7ab3c', padding: '2px 8px', border: '1px dashed #e7ab3c' }}>Giảm 10k</span>
                    <span style={{ background: 'rgba(231, 171, 60, 0.1)', color: '#e7ab3c', padding: '2px 8px', border: '1px dashed #e7ab3c' }}>Giảm 20k</span>
                  </div>
                </div>

                <div className="pd-shipping d-flex align-items-center mb-4" style={{ fontSize: '14px' }}>
                  <span className="text-muted" style={{ width: '110px', flexShrink: 0 }}>Vận Chuyển</span>
                  <div className="d-flex align-items-center">
                    <div className="d-flex align-items-center mr-3">
                      <i className="fa fa-truck mr-2" style={{ color: '#00bfa5', fontSize: '16px' }}></i>
                      <span>Vận chuyển tới <b className="ml-2">Toàn quốc</b></span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '13px', borderLeft: '1px solid #eee', paddingLeft: '15px' }}>
                      Phí vận chuyển: <span style={{ color: '#222', fontWeight: '500' }}>{formatMoney(30000)}</span>
                    </div>
                  </div>
                </div>
                <div className="pd-size-choose d-flex align-items-center mb-4">
                  <span className="text-muted" style={{ width: '110px', fontSize: '14px' }}>Kích cỡ</span>
                  <div className="d-flex flex-wrap">
                    {sizeOptions.length > 0 ? (
                      sizeOptions.map((size) => {
                        const inputId = `size-${String(size).toLowerCase()}`;
                        const isActive = selectedSize === size;
                        return (
                          <div className="sc-item mr-2" key={size}>
                            <label
                              htmlFor={inputId}
                              className={isActive ? "active" : ""}
                              style={{
                                display: 'inline-block', padding: '6px 15px', border: isActive ? '1px solid #e7ab3c' : '1px solid #ebebeb',
                                cursor: 'pointer', transition: 'all 0.3s', backgroundColor: '#fff',
                                color: isActive ? '#e7ab3c' : '#252525', borderRadius: '2px', fontSize: '14px',
                                textAlign: 'center', minWidth: '60px', position: 'relative'
                              }}
                            >
                              <input
                                type="radio"
                                id={inputId}
                                name="size"
                                value={size}
                                checked={isActive}
                                onChange={() => {
                                    setSelectedSize(size);
                                    // Auto select first color of this size
                                    const firstColor = variants.find(v => v.size === size)?.color;
                                    if (firstColor) setSelectedColor(firstColor);
                                }}
                                style={{ display: 'none' }}
                              />
                              {size}
                              {isActive && (
                                <div style={{
                                  position: 'absolute', right: 0, bottom: 0, width: '0', height: '0',
                                  borderStyle: 'solid', borderWidth: '0 0 10px 10px',
                                  borderColor: `transparent transparent #e7ab3c transparent`
                                }}>
                                  <i className="fa fa-check" style={{ position: 'absolute', bottom: '-10px', right: 0, color: '#fff', fontSize: '8px' }}></i>
                                </div>
                              )}
                            </label>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-muted">Mặc định</div>
                    )}
                  </div>
                </div>

                {colorOptions.length > 0 && (
                  <div className="pd-color-choose d-flex align-items-center mb-4">
                    <span className="text-muted" style={{ width: '110px', fontSize: '14px' }}>Màu sắc</span>
                    <div className="d-flex flex-wrap">
                      {colorOptions.map((color) => {
                        const inputId = `color-${String(color).toLowerCase()}`;
                        const isActive = selectedColor === color;
                        return (
                          <div className="sc-item mr-2" key={color}>
                            <label
                              htmlFor={inputId}
                              className={isActive ? "active" : ""}
                              style={{
                                display: 'inline-block', padding: '6px 15px', border: isActive ? '1px solid #e7ab3c' : '1px solid #ebebeb',
                                cursor: 'pointer', transition: 'all 0.3s', backgroundColor: '#fff',
                                color: isActive ? '#e7ab3c' : '#252525', borderRadius: '2px', fontSize: '14px',
                                textAlign: 'center', minWidth: '60px', position: 'relative'
                              }}
                            >
                              <input
                                type="radio"
                                id={inputId}
                                name="color"
                                value={color}
                                checked={isActive}
                                onChange={() => setSelectedColor(color)}
                                style={{ display: 'none' }}
                              />
                              {color}
                              {isActive && (
                                <div style={{
                                  position: 'absolute', right: 0, bottom: 0, width: '0', height: '0',
                                  borderStyle: 'solid', borderWidth: '0 0 10px 10px',
                                  borderColor: `transparent transparent #e7ab3c transparent`
                                }}>
                                  <i className="fa fa-check" style={{ position: 'absolute', bottom: '-10px', right: 0, color: '#fff', fontSize: '8px' }}></i>
                                </div>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="quantity-section d-flex align-items-center mb-5">
                  <span className="text-muted" style={{ width: '110px', fontSize: '14px', flexShrink: 0 }}>Số lượng</span>
                  <div className="quantity-selector-shopee mr-3" style={{ border: '1px solid #ebebeb', display: 'flex', alignItems: 'center', height: '32px', margin: 0, padding: 0 }}>
                    <button 
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      style={{ border: 'none', background: 'none', padding: '0 10px', cursor: 'pointer', borderRight: '1px solid #ebebeb', height: '100%', outline: 'none' }}
                    >-</button>
                    <input
                      type="text"
                      value={quantity}
                      readOnly
                      style={{ width: '50px', textAlign: 'center', border: 'none', background: 'none', fontWeight: '400', height: '100%', fontSize: '14px', outline: 'none' }}
                    />
                    <button 
                      type="button"
                      onClick={() => setQuantity(q => q + 1)}
                      style={{ border: 'none', background: 'none', padding: '0 10px', cursor: 'pointer', borderLeft: '1px solid #ebebeb', height: '100%', outline: 'none' }}
                    >+</button>
                  </div>
                  <span className="text-muted" style={{ fontSize: '14px' }}>{displayStock} sản phẩm có sẵn</span>
                </div>

                <div className="action-buttons d-flex mt-5" style={{ gap: '15px' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleAddToCart}
                    style={{ 
                      backgroundColor: 'rgba(231, 171, 60, 0.1)', border: '1px solid #e7ab3c', color: '#e7ab3c',
                      height: '48px', padding: '0 25px', fontWeight: '500', fontSize: '15px',
                      borderRadius: '2px'
                    }}
                  >
                    <i className="fa fa-cart-plus mr-2"></i>
                    Thêm Vào Giỏ Hàng
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      handleAddToCart();
                      navigate("/shopping-cart");
                    }}
                    style={{ 
                      backgroundColor: '#e7ab3c', border: 'none', color: '#fff',
                      height: '48px', padding: '0 40px', fontWeight: '500', fontSize: '15px',
                      borderRadius: '2px', boxShadow: '0 1px 1px rgba(0,0,0,0.05)'
                    }}
                  >
                    Mua Ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="product-details-content mt-5">
            <div className="pd-description-box mb-4 p-4 bg-white" style={{ border: '1px solid #f0f0f0', borderRadius: '2px' }}>
              <h5 className="mb-4" style={{ backgroundColor: '#fafafa', padding: '15px 20px', margin: '-24px -24px 24px -24px', fontSize: '18px', fontWeight: '500', textTransform: 'uppercase' }}>
                Chi tiết sản phẩm
              </h5>
              <div style={{ lineHeight: '1.8', color: '#252525', whiteSpace: 'pre-line' }}>
                {product.description || "Đang cập nhật..."}
              </div>
            </div>

            <div className="pd-reviews-box p-4 bg-white" style={{ border: '1px solid #f0f0f0', borderRadius: '2px' }}>
              <h5 className="mb-4" style={{ backgroundColor: '#fafafa', padding: '15px 20px', margin: '-24px -24px 24px -24px', fontSize: '18px', fontWeight: '500', textTransform: 'uppercase' }}>
                Đánh giá sản phẩm ({reviewsCount})
              </h5>
              <div className="customer-review-option">
                <div className="product-rating-summary d-flex align-items-center mb-4 p-4" style={{ backgroundColor: '#fffbf8', border: '1px solid #f9ede5' }}>
                  <div className="mr-5 text-center">
                    <div style={{ fontSize: '30px', color: '#e7ab3c', fontWeight: '500' }}>{averageRating.toFixed(1)} trên 5</div>
                    <div className="mt-2">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={i < roundedAvg ? "fa fa-star" : "fa fa-star-o"}
                          style={{ color: '#e7ab3c', fontSize: '20px', margin: '0 2px' }}
                        ></i>
                      ))}
                    </div>
                  </div>
                  <div className="d-flex flex-wrap" style={{ gap: '10px' }}>
                    {['Tất Cả', '5 Sao', '4 Sao', '3 Sao', '2 Sao', '1 Sao', 'Có Bình Luận'].map(label => (
                      <button key={label} className="btn btn-sm" style={{ backgroundColor: '#fff', border: '1px solid #ddd', padding: '5px 20px', borderRadius: '2px' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-center py-5 text-muted">Chưa có đánh giá nào cho sản phẩm này.</p>
                ) : (
                  <div className="reviews-list">
                    {reviews.map((r) => (
                      <div key={r.id} className="review-item d-flex pb-4 mb-4 border-bottom" style={{ gap: '15px' }}>
                        <div className="user-avatar">
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fa fa-user" style={{ color: '#999' }}></i>
                          </div>
                        </div>
                        <div className="review-content">
                          <div className="user-name mb-1" style={{ fontSize: '13px', fontWeight: '500' }}>{r.userName}</div>
                          <div className="review-stars mb-2">
                            {[...Array(5)].map((_, i) => (
                              <i
                                key={i}
                                className={i < r.rating ? "fa fa-star" : "fa fa-star-o"}
                                style={{ color: '#e7ab3c', fontSize: '10px' }}
                              ></i>
                            ))}
                          </div>
                          {r.comment && <p className="mb-2" style={{ fontSize: '14px', color: '#252525' }}>{r.comment}</p>}
                          <small style={{ color: '#999' }}>
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Product Details Section End */}

      {/* Related Products Begin */}
      <section className="related-products spad">
        <div className="container" style={{ position: 'relative' }}>
          <div className="row">
            <div className="col-lg-12">
              <div className="section-title">
                <h2>Sản phẩm liên quan</h2>
              </div>
            </div>
          </div>
          
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => scrollSlider('left')}
              style={{
                position: 'absolute', left: '-20px', top: '50%', transform: 'translateY(-50%)',
                zIndex: 10, background: '#fff', border: '1px solid #eee', borderRadius: '50%',
                width: '40px', height: '40px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer'
              }}
            >
              <i className="fa fa-angle-left"></i>
            </button>

            <div className="related-products-slider" ref={sliderRef} style={{ 
              display: 'flex', 
              overflowX: 'auto', 
              gap: '15px', 
              paddingBottom: '20px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollBehavior: 'smooth'
            }}>
              {relatedProducts.length === 0 ? (
                <div className="col-12 text-center text-muted py-4">Không có sản phẩm tương tự.</div>
              ) : (
                relatedProducts.map((rel) => {
                  const relImage = rel.imageUrl || "/img/products/product-1.jpg";
                  const discountPercent = rel.originalPrice > rel.price 
                    ? Math.round(((rel.originalPrice - rel.price) / rel.originalPrice) * 100) 
                    : 0;

                  return (
                    <div className="related-item-box" key={rel.id} style={{ flex: '0 0 190px' }}>
                      <div className="product-item bg-white shadow-sm h-100" style={{ border: '1px solid #f0f0f0' }}>
                        <div className="pi-pic product-square" style={{ height: '190px' }}>
                          <img src={relImage} alt={rel.name} style={{ objectFit: 'cover', height: '100%' }} />
                          {discountPercent > 0 && (
                            <div className="sale">-{discountPercent}%</div>
                          )}
                          <ul>
                            <li className="w-icon">
                              <a href="#" onClick={(e) => { e.preventDefault(); cartStorage.addItem(rel); }}>
                                <i className="icon_bag_alt"></i>
                                <span className="tooltip-text">Thêm vào giỏ</span>
                              </a>
                            </li>
                            <li className="w-icon">
                              <Link to={`/product/${rel.id}`}>
                                <i className="fa fa-eye"></i>
                                <span className="tooltip-text">Chi tiết</span>
                              </Link>
                            </li>
                            <li className="w-icon">
                              <Link to={`/shop?categoryId=${rel.categoryId}`}>
                                <i className="fa fa-random"></i>
                                <span className="tooltip-text">Tương tự</span>
                              </Link>
                            </li>
                          </ul>
                        </div>
                        <div className="pi-text p-2 d-flex flex-column" style={{ minHeight: '100px' }}>
                          <Link to={`/product/${rel.id}`}>
                            <h5 className="product-name-limit mb-2 text-dark" style={{ fontSize: '12px', height: '34px', overflow: 'hidden' }}>
                              {rel.name}
                            </h5>
                          </Link>
                          <div className="mt-auto">
                            {rel.originalPrice > rel.price && (
                              <div className="old-price small text-muted text-decoration-line-through mb-0" style={{ fontSize: '11px', textAlign: 'left' }}>
                                {formatMoney(rel.originalPrice)}
                              </div>
                            )}
                            <div className="d-flex align-items-center justify-content-between">
                              <div className="product-price text-warning font-weight-bold" style={{ fontSize: '14px', textAlign: 'left', color: '#e7ab3c !important' }}>
                                {formatMoney(rel.price)}
                              </div>
                              <div className="sold-count text-muted" style={{ fontSize: '10px' }}>
                                Đã bán {Math.floor(Math.random() * 50)}+
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <button 
              onClick={() => scrollSlider('right')}
              style={{
                position: 'absolute', right: '-20px', top: '50%', transform: 'translateY(-50%)',
                zIndex: 10, background: '#fff', border: '1px solid #eee', borderRadius: '50%',
                width: '40px', height: '40px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer'
              }}
            >
              <i className="fa fa-angle-right"></i>
            </button>
          </div>
          {relatedProducts.length > 0 && (
            <div className="row mt-4">
              <div className="col-lg-12 text-center">
                <Link to={`/shop?categoryId=${product.categoryId}`} className="outline-btn" style={{ padding: '12px 40px', display: 'inline-block' }}>
                  Xem thêm tất cả
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
      {/* Related Products End */}
    </LayoutPublic>
  );
};

export default Product;
