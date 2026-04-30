import React from "react";
import { Link } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";

const Home = () => {
  return (
    <LayoutPublic>
      {/* Hero Section Begin */}
      <section className="hero-section">
        <div className="hero-items owl-carousel">
          <div
            className="single-hero-items set-bg"
            style={{ backgroundImage: "url(/img/hero-1.jpg)" }}
          >
            <div className="container">
              <div className="row">
                <div className="col-lg-5">
                  <span>Bag,kids</span>
                  <h1>Khuyến mãi cuối tuần</h1>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit,
                    sed do eiusmod tempor incididunt ut labore et dolore
                  </p>
                  <Link to="/shop" className="primary-btn">
                    Mua ngay
                  </Link>
                </div>
              </div>
              <div className="off-card">
                <h2>
                  Giảm <span>50%</span>
                </h2>
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
                  <span>Bag,kids</span>
                  <h1>Khuyến mãi cuối tuần</h1>
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit,
                    sed do eiusmod tempor incididunt ut labore et dolore
                  </p>
                  <Link to="/shop" className="primary-btn">
                    Mua ngay
                  </Link>
                </div>
              </div>
              <div className="off-card">
                <h2>
                  Giảm <span>50%</span>
                </h2>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Hero Section End */}

      {/* Banner Section Begin */}
      <div className="banner-section spad">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-4">
              <div className="single-banner">
                <img src="/img/banner-1.jpg" alt="Nam" />
                <div className="inner-text">
                  <h4>Nam</h4>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="single-banner">
                <img src="/img/banner-2.jpg" alt="Nu" />
                <div className="inner-text">
                  <h4>Nu</h4>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="single-banner">
                <img src="/img/banner-3.jpg" alt="Tre em" />
                <div className="inner-text">
                  <h4>Tre em</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Banner Section End */}

      {/* Women Banner Section Begin */}
      <section className="women-banner spad">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-3">
              <div
                className="product-large set-bg"
                style={{
                  backgroundImage: "url(/img/products/women-large.jpg)",
                }}
              >
                <h2>Thời trang nữ</h2>
                <a href="/shop">Khám phá thêm</a>
              </div>
            </div>
            <div className="col-lg-8 offset-lg-1">
              <div className="filter-control">
                <ul>
                  <li className="active">Quần áo</li>
                  <li>Túi xách</li>
                  <li>Giày dép</li>
                  <li>Phụ kiện</li>
                </ul>
              </div>
              <div className="product-slider owl-carousel">
                {/* Product items will go here */}
                <div className="product-item">
                  <div className="pi-pic">
                    <img src="/img/products/women-1.jpg" alt="Product" />
                    <div className="sale">Giảm giá</div>
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
                        <Link to="/product/1">+ Xem nhanh</Link>
                      </li>
                      <li className="w-icon">
                        <a href="#">
                          <i className="fa fa-random"></i>
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div className="pi-text">
                    <div className="catagory-name">Coat</div>
                    <a href="#">
                      <h5>Pure Pineapple</h5>
                    </a>
                    <div className="product-price">
                      $14.00
                      <span>$35.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Women Banner Section End */}

      {/* Deal Of The Week Section Begin */}
      <section
        className="deal-of-week set-bg spad"
        style={{ backgroundImage: "url(/img/time-bg.jpg)" }}
      >
        <div className="container">
          <div className="col-lg-6 text-center">
            <div className="section-title">
              <h2>Ưu đãi trong tuần</h2>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed
                <br /> do ipsum dolor sit amet, consectetur adipisicing
                elit{" "}
              </p>
              <div className="product-price">
                $35.00
                <span>/ Túi xách</span>
              </div>
            </div>
            <div className="countdown-timer" id="countdown">
              <div className="cd-item">
                <span>56</span>
                <p>Ngày</p>
              </div>
              <div className="cd-item">
                <span>25</span>
                <p>Giờ</p>
              </div>
              <div className="cd-item">
                <span>32</span>
                <p>Phút</p>
              </div>
              <div className="cd-item">
                <span>47</span>
                <p>Giây</p>
              </div>
            </div>
            <Link to="/product/1" className="primary-btn">
              Mua ngay
            </Link>
          </div>
        </div>
      </section>
      {/* Deal Of The Week Section End */}
    </LayoutPublic>
  );
};

export default Home;
