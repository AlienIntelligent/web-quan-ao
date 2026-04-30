import React from "react";
import { Link } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";

const featuredCategories = [
  { title: "Thời trang nam", image: "/img/banner-1.jpg", query: "nam" },
  { title: "Thời trang nữ", image: "/img/banner-2.jpg", query: "nữ" },
  { title: "Thời trang trẻ em", image: "/img/banner-3.jpg", query: "trẻ em" },
];

const quickProducts = [
  { id: 1, name: "Áo sơ mi linen", image: "/img/products/product-1.jpg", price: "329.000 đ" },
  { id: 2, name: "Quần jean slim", image: "/img/products/product-2.jpg", price: "459.000 đ" },
  { id: 3, name: "Váy midi công sở", image: "/img/products/women-1.jpg", price: "399.000 đ" },
  { id: 4, name: "Áo khoác nhẹ", image: "/img/products/man-1.jpg", price: "529.000 đ" },
];

const Home = () => {
  return (
    <LayoutPublic>
      <section className="hero-section">
        <div className="hero-items">
          <div
            className="single-hero-items set-bg"
            style={{ backgroundImage: "url(/img/hero-1.jpg)" }}
          >
            <div className="container">
              <div className="row">
                <div className="col-lg-5">
                  <span>Bộ sưu tập mới</span>
                  <h1>Fashion Shop</h1>
                  <p>Quần áo nam, nữ và trẻ em với size rõ ràng, giá minh bạch và giao hàng theo dõi được.</p>
                  <Link to="/shop" className="primary-btn">Mua ngay</Link>
                </div>
              </div>
              <div className="off-card">
                <h2>Sale <span>50%</span></h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="banner-section spad">
        <div className="container-fluid">
          <div className="row">
            {featuredCategories.map((category) => (
              <div className="col-lg-4" key={category.title}>
                <Link to={`/shop?keyword=${encodeURIComponent(category.query)}`} className="single-banner">
                  <img src={category.image} alt={category.title} />
                  <div className="inner-text">
                    <h4>{category.title}</h4>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="women-banner spad">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-3">
              <div
                className="product-large set-bg"
                style={{ backgroundImage: "url(/img/products/women-large.jpg)" }}
              >
                <h2>Đồ mặc hằng ngày</h2>
                <Link to="/shop">Xem sản phẩm</Link>
              </div>
            </div>
            <div className="col-lg-8 offset-lg-1">
              <div className="filter-control">
                <ul>
                  <li className="active">Bán chạy</li>
                  <li>Hàng mới</li>
                  <li>Đang giảm giá</li>
                  <li>Đủ size</li>
                </ul>
              </div>
              <div className="row">
                {quickProducts.map((product) => (
                  <div className="col-lg-3 col-md-6" key={product.id}>
                    <div className="product-item">
                      <div className="pi-pic">
                        <img src={product.image} alt={product.name} />
                        <ul>
                          <li className="quick-view">
                            <Link to={`/product/${product.id}`}>Xem chi tiết</Link>
                          </li>
                        </ul>
                      </div>
                      <div className="pi-text">
                        <div className="catagory-name">Quần áo</div>
                        <h5>{product.name}</h5>
                        <div className="product-price">{product.price}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="deal-of-week set-bg spad" style={{ backgroundImage: "url(/img/time-bg.jpg)" }}>
        <div className="container">
          <div className="col-lg-6 text-center">
            <div className="section-title">
              <h2>Ưu đãi trong tuần</h2>
              <p>Chọn đồ theo size, áp mã giảm giá ở giỏ hàng và theo dõi đơn sau khi đặt.</p>
              <div className="product-price">Miễn phí giao hàng <span>/ đơn từ 499.000 đ</span></div>
            </div>
            <Link to="/shop" className="primary-btn">Săn ưu đãi</Link>
          </div>
        </div>
      </section>
    </LayoutPublic>
  );
};

export default Home;
