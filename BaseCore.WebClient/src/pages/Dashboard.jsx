import React, { useState, useEffect } from "react";
import {
  productApi,
  userApi,
  categoryApi,
  originApi,
  promotionApi,
  shippingApi,
  productOriginApi,
  orderDetailApi,
  orderPromotionApi,
  cartDetailApi,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    users: 0,
    origins: 0,
    promotions: 0,
    shippings: 0,
    productOrigins: 0,
    orderDetails: 0,
    orderPromotions: 0,
    cartDetails: 0,
  });
  const [loading, setLoading] = useState(true);
  const { isAdmin, user } = useAuth();

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    setLoading(true);

    const extractCount = (resData) => {
      if (!resData) return 0;

      // Prefer server-reported totalCount when available.
      if (typeof resData.totalCount === "number") return resData.totalCount;

      // Some responses are wrapped as { data: [...] }.
      const d = resData?.data ?? resData;
      if (!d) return 0;

      return d.totalCount ?? d.items?.length ?? d.length ?? 0;
    };

    const next = { products: 0, categories: 0, users: 0 };

    try {
      const productsRes = await productApi.getAll({ page: 1, pageSize: 10 });
      next.products = extractCount(productsRes.data);
    } catch (error) {
      console.error("Failed to load products stats:", error);
    }

    try {
      const categoriesRes = await categoryApi.getAll();
      next.categories = extractCount(categoriesRes.data);
    } catch (error) {
      console.error("Failed to load categories stats:", error);
    }

    try {
      if (isAdmin()) {
        const usersRes = await userApi.getAll({ page: 1, pageSize: 1 });
        next.users = extractCount(usersRes.data);
      }
    } catch (error) {
      console.error("Failed to load users stats:", error);
    }

    try {
      const res = await originApi.getAll({ page: 1, pageSize: 1 });
      next.origins = extractCount(res.data);
    } catch (error) {
      console.error("Failed to load origins stats:", error);
    }

    try {
      const res = await promotionApi.getAll({ page: 1, pageSize: 1 });
      next.promotions = extractCount(res.data);
    } catch (error) {
      console.error("Failed to load promotions stats:", error);
    }

    try {
      const res = await shippingApi.getAll({ page: 1, pageSize: 1 });
      next.shippings = extractCount(res.data);
    } catch (error) {
      console.error("Failed to load shippings stats:", error);
    }

    try {
      const res = await productOriginApi.getAll({ page: 1, pageSize: 1 });
      next.productOrigins = extractCount(res.data);
    } catch (error) {
      console.error("Failed to load product origins stats:", error);
    }

    try {
      const res = await orderDetailApi.getAll({ page: 1, pageSize: 1 });
      next.orderDetails = extractCount(res.data);
    } catch (error) {
      console.error("Failed to load order details stats:", error);
    }

    try {
      const res = await orderPromotionApi.getAll({ page: 1, pageSize: 1 });
      next.orderPromotions = extractCount(res.data);
    } catch (error) {
      console.error("Failed to load order promotions stats:", error);
    }

    try {
      const res = await cartDetailApi.getAll({ page: 1, pageSize: 1 });
      next.cartDetails = extractCount(res.data);
    } catch (error) {
      console.error("Failed to load cart details stats:", error);
    }

    setStats(next);
    setLoading(false);
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Bảng điều khiển</h1>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="sr-only">Đang tải...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="row">
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-info">
                    <div className="inner">
                      <h3>{stats.products}</h3>
                      <p>Sản phẩm</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-box"></i>
                    </div>
                    <a href="/products" className="small-box-footer">
                      Xem chi tiết <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-success">
                    <div className="inner">
                      <h3>{stats.categories}</h3>
                      <p>Danh mục</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-tags"></i>
                    </div>
                    <a href="/categories" className="small-box-footer">
                      Xem chi tiết <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
                {isAdmin() && (
                  <div className="col-lg-3 col-6">
                    <div className="small-box bg-warning">
                      <div className="inner">
                        <h3>{stats.users}</h3>
                        <p>Người dùng</p>
                      </div>
                      <div className="icon">
                        <i className="fas fa-users"></i>
                      </div>
                      <a href="/users" className="small-box-footer">
                        Xem chi tiết <i className="fas fa-arrow-circle-right"></i>
                      </a>
                    </div>
                  </div>
                )}
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-primary">
                    <div className="inner">
                      <h3>{stats.origins}</h3>
                      <p>Xuất xứ</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-industry"></i>
                    </div>
                    <a href="/origins" className="small-box-footer">
                      Xem chi tiết <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-purple">
                    <div className="inner">
                      <h3>{stats.promotions}</h3>
                      <p>Khuyến mãi</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-percentage"></i>
                    </div>
                    <a href="/promotions" className="small-box-footer">
                      Xem chi tiết <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-teal">
                    <div className="inner">
                      <h3>{stats.shippings}</h3>
                      <p>Vận chuyển</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-truck"></i>
                    </div>
                    <a href="/shippings" className="small-box-footer">
                      Xem chi tiết <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-maroon">
                    <div className="inner">
                      <h3>{stats.productOrigins}</h3>
                      <p>Xuất xứ sản phẩm</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-link"></i>
                    </div>
                    <a href="/product-origins" className="small-box-footer">
                      Xem chi tiết <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-info">
                    <div className="inner">
                      <h3>{stats.orderDetails}</h3>
                      <p>Chi tiết đơn hàng</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-list"></i>
                    </div>
                    <a href="/order-details" className="small-box-footer">
                      Xem chi tiết <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-warning">
                    <div className="inner">
                      <h3>{stats.orderPromotions}</h3>
                      <p>Khuyến mãi đơn hàng</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-tags"></i>
                    </div>
                    <a href="/order-promotions" className="small-box-footer">
                      Xem chi tiết <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-success">
                    <div className="inner">
                      <h3>{stats.cartDetails}</h3>
                      <p>Chi tiết giỏ hàng</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-shopping-cart"></i>
                    </div>
                    <a href="/cart-details" className="small-box-footer">
                      Xem chi tiết <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    Chào mừng đến với Hệ thống Quản trị Store Sales
                  </h3>
                </div>
                <div className="card-body">
                  <p>Hệ thống quản lý được xây dựng trên các công nghệ hiện đại:</p>
                  <ul>
                    <li>
                      <strong>Backend:</strong> .NET Core 8.0 với Entity Framework Core
                    </li>
                    <li>
                      <strong>Frontend:</strong> React 18 với React Router
                    </li>
                    <li>
                      <strong>Giao diện:</strong> AdminLTE 3 với Bootstrap 4
                    </li>
                    <li>
                      <strong>Bảo mật:</strong> JWT Bearer Token
                    </li>
                  </ul>
                  <p>Các tính năng chính:</p>
                  <ul>
                    <li>Quản lý xác thực (Đăng nhập/Đăng xuất)</li>
                    <li>Quản lý sản phẩm (Thêm, Xóa, Sửa, Tìm kiếm & Phân trang)</li>
                    <li>Quản lý danh mục & Đơn hàng</li>
                    <li>Quản lý người dùng (Chỉ dành cho Quản trị viên)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
