import React, { useEffect, useMemo, useState } from "react";
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

  const [reviews, setReviews] = useState([]);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setSelectedSize(vs[0]?.size ?? null);

        const payload = rRes?.data || {};
        setReviews(Array.isArray(payload.items) ? payload.items : []);
        setReviewsCount(payload.totalCount ?? 0);
        setAverageRating(payload.averageRating ?? 0);
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
    const map = new Map();
    (variants || []).forEach((v) => {
      if (!v?.size) return;
      if (!map.has(v.size)) map.set(v.size, v);
    });
    return Array.from(map.values());
  }, [variants]);

  const selectedVariant = useMemo(() => {
    if (!variants?.length) return null;
    if (selectedSize) return variants.find((v) => v.size === selectedSize) ?? null;
    return variants[0] ?? null;
  }, [selectedSize, variants]);

  const displayPrice = Number(selectedVariant?.price ?? product?.price ?? 0);
  const displayOriginalPrice = product?.originalPrice ?? null;
  const displayStock = Number(selectedVariant?.stock ?? product?.stock ?? 0);

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
    if (!product || !selectedVariant) return;

    const qty = Math.max(1, Number(quantity) || 1);
    if (displayStock < qty) {
      alert("Hết hàng cho size bạn chọn");
      return;
    }

    cartStorage.addItem(
      {
        id: product.id,
        name: product.name,
        price: displayPrice,
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
            </div>
            <div className="col-lg-6">
              <div className="product-details">
                <div className="pd-title">
                  <span>{product.category?.name || "Danh mục"}</span>
                  <h3>{product.name}</h3>
                </div>
                <div className="pd-rating">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={i < roundedAvg ? "fa fa-star" : "fa fa-star-o"}
                    ></i>
                  ))}
                  <span>({reviewsCount} đánh giá)</span>
                </div>
                <div className="pd-desc">
                  <h4>
                    ${displayPrice.toFixed(2)}
                  {displayOriginalPrice != null && (
                    <span>${Number(displayOriginalPrice).toFixed(2)}</span>
                  )}
                  </h4>
                  <p>{product.description}</p>
                </div>
                <div className="pd-size-choose">
                      {sizeOptions.length > 0 ? (
                        sizeOptions.map((v) => {
                          const inputId = `size-${String(v.size).toLowerCase()}`;
                          return (
                            <div className="sc-item" key={v.size}>
                            <label
                              htmlFor={inputId}
                              className={selectedSize === v.size ? "active" : ""}
                            >
                              <input
                                type="radio"
                                id={inputId}
                                name="size"
                                value={v.size}
                                checked={selectedSize === v.size}
                                onChange={() => setSelectedSize(v.size)}
                              />
                              <span>{v.size}</span>
                            </label>
                            </div>
                          );
                        })
                      ) : (
                        <div>Không có phân loại</div>
                      )}
                </div>
                <div className="quantity">
                  <div className="pro-qty">
                    <input
                      type="number"
                      value={quantity}
                      min="1"
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value || "1", 10)))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    className="primary-btn pd-cart"
                    onClick={handleAddToCart}
                  >
                    Thêm vào giỏ
                  </button>
                </div>
                <ul className="pd-tags">
                  <li>
                    <b>Tình trạng</b>{" "}
                    <span>{displayStock > 0 ? "Còn hàng" : "Hết hàng"}</span>
                  </li>
                  <li>
                    <b>Vận chuyển</b>{" "}
                    <span>
                      Giao trong 1 ngày. <samp>Miễn phí nhận tại cửa hàng hôm nay</samp>
                    </span>
                  </li>
                  <li>
                    <b>Khối lượng</b> <span>0.5 kg</span>
                  </li>
                </ul>
                <div className="pd-share">
                  <div className="pd-social">
                    <a href="#"><i className="ti-facebook"></i></a>
                    <a href="#"><i className="ti-twitter-alt"></i></a>
                    <a href="#"><i className="ti-linkedin"></i></a>
                    <a href="#"><i className="ti-pinterest"></i></a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="product-tab">
            <div className="tab-item">
              <ul className="nav" role="tablist">
                <li>
                  <a className="active" data-toggle="tab" href="#tab-1">
                  Mô tả
                  </a>
                </li>
                <li>
                  <a data-toggle="tab" href="#tab-2">
                  Đánh giá ({reviewsCount})
                  </a>
                </li>
              </ul>
            </div>
            <div className="tab-content">
              <div className="tab-pane active" id="tab-1" role="tabpanel">
                <div className="product-content">
                  <h5>Mô tả</h5>
                  <p>{product.description}</p>
                </div>
              </div>
              <div className="tab-pane" id="tab-2" role="tabpanel">
                <div className="product-content">
                  <h5>Đánh giá ({reviewsCount})</h5>
                {reviews.length === 0 ? (
                  <p>Chưa có đánh giá.</p>
                ) : (
                  <div className="customer-review-option">
                    <div className="product-rating" style={{ marginBottom: 16 }}>
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={i < roundedAvg ? "fa fa-star" : "fa fa-star-o"}
                        ></i>
                      ))}
                      <span style={{ marginLeft: 8 }}>
                        {averageRating.toFixed(1)} / 5
                      </span>
                    </div>

                    {reviews.map((r) => (
                      <div key={r.id} style={{ marginBottom: 18 }}>
                        <div className="at-rating">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={i < r.rating ? "fa fa-star" : "fa fa-star-o"}
                            ></i>
                          ))}
                          <h5 style={{ margin: "6px 0 4px" }}>{r.userName}</h5>
                        </div>
                        {r.comment && <p style={{ margin: 0 }}>{r.comment}</p>}
                        <small style={{ opacity: 0.8 }}>
                          {r.createdAt
                            ? new Date(r.createdAt).toLocaleDateString()
                            : ""}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Product Details Section End */}

      {/* Related Products Begin */}
      <section className="related-products spad">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="section-title">
                <h2>Sản phẩm liên quan</h2>
              </div>
            </div>
          </div>
          <div className="row">
            {[1, 2, 3, 4].map((relId) => (
              <div className="col-lg-3 col-md-6 col-sm-6" key={relId}>
                <div className="product-item">
                  <div className="pi-pic">
                    <img src={`/img/products/product-${relId}.jpg`} alt="" />
                    <div className="icon">
                      <i className="icon_heart_alt"></i>
                    </div>
                    <ul>
                      <li className="w-icon active">
                        <a href="#">
                          <i className="icon_bag_alt"></i>
                        </a>
                      </li>
                      <li className="quick-view">
                        <Link to={`/product/${relId}`}>+ Xem nhanh</Link>
                      </li>
                      <li className="w-icon">
                        <a href="#">
                          <i className="fa fa-random"></i>
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div className="pi-text">
                    <div className="catagory-name">Danh mục</div>
                    <a href="#">
                      <h5>Product {relId}</h5>
                    </a>
                    <div className="product-price">
                      ${(15 + relId * 5).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Related Products End */}
    </LayoutPublic>
  );
};

export default Product;
