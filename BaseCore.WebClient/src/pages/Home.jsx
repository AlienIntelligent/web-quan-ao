import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import OwlCarousel from "react-owl-carousel";
import { productApi, cartStorage } from "../services/api";
import { alertSuccess } from "../services/swal";

const featuredCategories = [
  { title: "Thời trang nam", image: "/img/banner-1.jpg", query: "nam" },
  { title: "Thời trang nữ", image: "/img/banner-2.jpg", query: "nữ" },
  { title: "Thời trang trẻ em", image: "/img/banner-3.jpg", query: "trẻ em" },
];

const Home = () => {
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productApi.getAll({ pageSize: 30 });
        setRecommendedProducts(response.data.items || []);
      } catch (error) {
        console.error("Error fetching recommended products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const resolveProductImage = (item) => {
    const raw = item?.imageUrl;
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

  const addToCart = (product) => {
    cartStorage.addItem(product);
    alertSuccess(
      "Đã thêm!",
      `Sản phẩm ${product.name} đã được thêm vào giỏ hàng.`,
    );
  };

  return (
    <LayoutPublic>
      {/* Hero Section Begin */}
      <section className="hero-section">
        <OwlCarousel
          className="hero-items owl-carousel"
          items={1}
          nav={false}
          dots={true}
          loop={true}
          autoplay={true}
          autoplayTimeout={5000}
          smartSpeed={1000}
        >
          <div
            className="single-hero-items set-bg"
            style={{ backgroundImage: "url(/img/hero-1.jpg)" }}
          >
            <div className="container">
              <div className="row">
                <div className="col-lg-5">
                  <span>BỘ SƯU TẬP 2026</span>
                  <h1>Phong cách</h1>
                  <p>
                    Khám phá những xu hướng thời trang mới nhất, giúp bạn tự tin
                    tỏa sáng mọi lúc mọi nơi.
                  </p>
                  <Link to="/shop" className="primary-btn">
                    Săn Ngay
                  </Link>
                </div>
              </div>
              <div className="off-card">
                <h2>70%</h2>
                <span>OFF</span>
              </div>
            </div>
          </div>
          <div
            className="single-hero-items set-bg"
            style={{ backgroundImage: "url(/img/hero-2.jpg)" }}
          >
            <div className="container">
              <div className="row">
                <div className="col-lg-5">
                  <span>ƯU ĐÃI ĐẶC BIỆT</span>
                  <h1>Black friday</h1>
                  <p>
                    Đừng bỏ lỡ cơ hội sở hữu những món đồ cực chất với mức giá
                    không thể tin nổi.
                  </p>
                  <Link to="/shop" className="primary-btn">
                    Xem Deal
                  </Link>
                </div>
              </div>
              <div className="off-card">
                <h2>70%</h2>
                <span>OFF</span>
              </div>
            </div>
          </div>
          <div
            className="single-hero-items set-bg"
            style={{ backgroundImage: "url(/img/hero-3.jpg)" }}
          >
            <div className="container">
              <div className="row">
                <div className="col-lg-5">
                  <span>THỜI TRANG CÔNG SỞ</span>
                  <h1>Thanh lịch</h1>
                  <p>
                    Sự kết hợp hoàn hảo giữa nét cổ điển và hiện đại, dành riêng
                    cho quý cô công sở.
                  </p>
                  <Link to="/shop" className="primary-btn">
                    Khám Phá
                  </Link>
                </div>
              </div>
              <div className="off-card">
                <h2>
                  30% <span>OFF</span>
                </h2>
              </div>
            </div>
          </div>
        </OwlCarousel>
      </section>
      {/* Hero Section End */}

      <div className="banner-section spad">
        <div className="container-fluid">
          <div className="row">
            {featuredCategories.map((category) => (
              <div className="col-lg-4" key={category.title}>
                <Link
                  to={`/shop?keyword=${encodeURIComponent(category.query)}`}
                  style={{ textDecoration: "none" }}
                >
                  <div className="single-banner">
                    <img src={category.image} alt={category.title} />
                  </div>
                  <div className="category-info text-center mt-3">
                    <h4
                      style={{
                        fontWeight: 700,
                        color: "#111",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        fontSize: "18px",
                      }}
                    >
                      {category.title}
                    </h4>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Products Section Begin (Shopee Style) */}
      <section className="recommended-products spad">
        <div className="container">
          <div className="section-title text-center mb-4">
            <h2
              style={{
                position: "relative",
                display: "inline-block",
                paddingBottom: "10px",
              }}
            >
              GỢI Ý HÔM NAY
              <span
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: "25%",
                  right: "25%",
                  height: "4px",
                  background: "#e7ab3c",
                }}
              ></span>
            </h2>
          </div>
          {loading ? (
            <div className="text-center">
              <div className="spinner-border text-warning" role="status">
                <span className="sr-only">Đang tải...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="row">
                {recommendedProducts.slice(0, 12).map((product) => (
                  <div
                    className="col-lg-2 col-md-4 col-6 mb-4"
                    key={product.id}
                  >
                    <div className="product-item bg-white shadow-sm h-100">
                      <div className="pi-pic product-square">
                        <img
                          src={resolveProductImage(product)}
                          alt={product.name}
                        />
                        {product.originalPrice > product.price && (
                          <div className="sale">
                            -
                            {Math.round(
                              ((product.originalPrice - product.price) /
                                product.originalPrice) *
                                100,
                            )}
                            %
                          </div>
                        )}
                        <ul>
                          <li className="w-icon">
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                addToCart(product);
                              }}
                            >
                              <i className="icon_bag_alt"></i>
                              <span className="tooltip-text">Thêm vào giỏ</span>
                            </a>
                          </li>
                          <li className="w-icon">
                            <Link to={`/product/${product.id}`}>
                              <i className="fa fa-eye"></i>
                              <span className="tooltip-text">Chi tiết</span>
                            </Link>
                          </li>
                          <li className="w-icon">
                            <Link to={`/shop?categoryId=${product.categoryId}`}>
                              <i className="fa fa-random"></i>
                              <span className="tooltip-text">Tương tự</span>
                            </Link>
                          </li>
                        </ul>
                      </div>
                      <div
                        className="pi-text p-2 d-flex flex-column"
                        style={{ minHeight: "110px" }}
                      >
                        <Link to={`/product/${product.id}`}>
                          <h5
                            className="product-name-limit mb-2 text-dark"
                            style={{
                              fontSize: "12px",
                              height: "34px",
                              overflow: "hidden",
                            }}
                          >
                            {product.name}
                          </h5>
                        </Link>
                        <div className="mt-auto">
                          {product.originalPrice > product.price && (
                            <div
                              className="old-price small text-muted text-decoration-line-through mb-0"
                              style={{ fontSize: "11px", textAlign: "left" }}
                            >
                              {formatPrice(product.originalPrice)}
                            </div>
                          )}
                          <div className="d-flex align-items-center justify-content-between">
                            <div
                              className="product-price text-warning font-weight-bold"
                              style={{ fontSize: "14px", textAlign: "left" }}
                            >
                              {formatPrice(product.price)}
                            </div>
                            <div
                              className="sold-count text-muted"
                              style={{ fontSize: "10px" }}
                            >
                              Đã bán {Math.floor(Math.random() * 100)}+
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Deal of the Week (Inserted in middle) */}
              <section
                className="deal-of-week set-bg spad my-5"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=2070&auto=format&fit=crop')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  marginLeft: "-15px",
                  marginRight: "-15px",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div className="container">
                  <div className="row justify-content-center">
                    <div className="col-lg-6 text-center">
                      <div className="deal-text-box shadow-lg">
                        <div className="section-title">
                          <h2>Ưu đãi trong tuần</h2>
                          <p>
                            Chọn đồ theo size, áp mã giảm giá ở giỏ hàng và theo
                            dõi đơn sau khi đặt.
                          </p>
                          <div className="product-price">
                            Miễn phí giao hàng <span>/ đơn từ 499.000 đ</span>
                          </div>
                        </div>
                        <Link to="/shop" className="primary-btn">
                          Săn ưu đãi
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="row mt-5">
                {recommendedProducts.slice(12).map((product) => (
                  <div
                    className="col-lg-2 col-md-4 col-6 mb-4"
                    key={product.id}
                  >
                    <div className="product-item bg-white shadow-sm h-100">
                      <div className="pi-pic product-square">
                        <img
                          src={resolveProductImage(product)}
                          alt={product.name}
                        />
                        {product.originalPrice > product.price && (
                          <div className="sale">
                            -
                            {Math.round(
                              ((product.originalPrice - product.price) /
                                product.originalPrice) *
                                100,
                            )}
                            %
                          </div>
                        )}
                        <ul>
                          <li className="w-icon">
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                addToCart(product);
                              }}
                            >
                              <i className="icon_bag_alt"></i>
                              <span className="tooltip-text">Thêm vào giỏ</span>
                            </a>
                          </li>
                          <li className="w-icon">
                            <Link to={`/product/${product.id}`}>
                              <i className="fa fa-eye"></i>
                              <span className="tooltip-text">Chi tiết</span>
                            </Link>
                          </li>
                          <li className="w-icon">
                            <Link to={`/shop?categoryId=${product.categoryId}`}>
                              <i className="fa fa-random"></i>
                              <span className="tooltip-text">Tương tự</span>
                            </Link>
                          </li>
                        </ul>
                      </div>
                      <div
                        className="pi-text p-2 d-flex flex-column"
                        style={{ minHeight: "110px" }}
                      >
                        <Link to={`/product/${product.id}`}>
                          <h5
                            className="product-name-limit mb-2 text-dark"
                            style={{
                              fontSize: "12px",
                              height: "34px",
                              overflow: "hidden",
                            }}
                          >
                            {product.name}
                          </h5>
                        </Link>
                        <div className="mt-auto">
                          {product.originalPrice > product.price && (
                            <div
                              className="old-price small text-muted text-decoration-line-through mb-0"
                              style={{ fontSize: "11px", textAlign: "left" }}
                            >
                              {formatPrice(product.originalPrice)}
                            </div>
                          )}
                          <div className="d-flex align-items-center justify-content-between">
                            <div
                              className="product-price text-warning font-weight-bold"
                              style={{ fontSize: "14px", textAlign: "left" }}
                            >
                              {formatPrice(product.price)}
                            </div>
                            <div
                              className="sold-count text-muted"
                              style={{ fontSize: "10px" }}
                            >
                              Đã bán {Math.floor(Math.random() * 100)}+
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <Link to="/shop" className="primary-btn">
                  Xem thêm
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </LayoutPublic>
  );
};

export default Home;
