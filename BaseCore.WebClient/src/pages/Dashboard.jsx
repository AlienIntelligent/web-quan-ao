import React, { useState, useEffect } from "react";
import { analyticsApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    growthPercentage: 0
  });
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, bestSellersRes] = await Promise.all([
        analyticsApi.getStats(),
        analyticsApi.getBestSellers(5)
      ]);
      setStats(statsRes.data);
      setBestSellers(bestSellersRes.data || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Bảng điều khiển quản trị</h1>
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
              {/* Summary Cards */}
              <div className="row">
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-info shadow-sm">
                    <div className="inner">
                      <h3>{stats.totalOrders}</h3>
                      <p>Đơn hàng mới</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-shopping-cart"></i>
                    </div>
                    <a href="/orders" className="small-box-footer">
                      Xem chi tiết <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-success shadow-sm">
                    <div className="inner">
                      <h3>{formatMoney(stats.totalRevenue)}</h3>
                      <p>Tổng doanh thu</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-dollar-sign"></i>
                    </div>
                    <a href="#" className="small-box-footer">
                      Báo cáo chi tiết <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-warning shadow-sm">
                    <div className="inner">
                      <h3>{stats.totalCustomers}</h3>
                      <p>Khách hàng</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-users"></i>
                    </div>
                    <a href="/users" className="small-box-footer">
                      Xem chi tiết <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-danger shadow-sm">
                    <div className="inner">
                      <h3>{stats.totalProducts}</h3>
                      <p>Sản phẩm</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-box-open"></i>
                    </div>
                    <a href="/products" className="small-box-footer">
                      Xem chi tiết <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
              </div>

              <div className="row">
                {/* Best Sellers Table */}
                <div className="col-lg-7">
                  <div className="card shadow-sm">
                    <div className="card-header border-0">
                      <h3 className="card-title">Sản phẩm bán chạy</h3>
                      <div className="card-tools">
                        <a href="#" className="btn btn-tool btn-sm">
                          <i className="fas fa-download"></i>
                        </a>
                      </div>
                    </div>
                    <div className="card-body table-responsive p-0">
                      <table className="table table-striped table-valign-middle">
                        <thead>
                          <tr>
                            <th>Sản phẩm</th>
                            <th>Giá</th>
                            <th>Đã bán</th>
                            <th>Doanh thu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bestSellers.map((item) => (
                            <tr key={item.productId}>
                              <td>{item.productName}</td>
                              <td>{formatMoney(item.totalRevenue / (item.totalSold || 1))}</td>
                              <td>
                                <small className="text-success mr-1">
                                  <i className="fas fa-arrow-up"></i>
                                </small>
                                {item.totalSold}
                              </td>
                              <td>{formatMoney(item.totalRevenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Growth/Info Card */}
                <div className="col-lg-5">
                  <div className="card shadow-sm bg-gradient-primary">
                    <div className="card-header border-0">
                      <h3 className="card-title">Hiệu suất tăng trưởng</h3>
                    </div>
                    <div className="card-body text-center py-5">
                      <div className="growth-circle mb-3">
                        <h2 className="display-4 font-weight-bold">+{stats.growthPercentage}%</h2>
                        <p>Tăng trưởng so với tháng trước</p>
                      </div>
                      <button className="btn btn-light btn-sm px-4 font-weight-bold">XEM PHÂN TÍCH</button>
                    </div>
                  </div>

                  <div className="card shadow-sm">
                    <div className="card-header">
                      <h3 className="card-title">Ghi chú nhanh</h3>
                    </div>
                    <div className="card-body">
                      <div className="d-flex align-items-center border-bottom mb-3 pb-3">
                        <i className="fas fa-info-circle text-info mr-3 fa-2x"></i>
                        <div>
                          <p className="mb-0 font-weight-bold">Kiểm tra kho hàng</p>
                          <small className="text-muted">Có 3 sản phẩm sắp hết hàng.</small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-exclamation-triangle text-warning mr-3 fa-2x"></i>
                        <div>
                          <p className="mb-0 font-weight-bold">Đơn hàng chờ duyệt</p>
                          <small className="text-muted">Có 5 đơn hàng mới cần xử lý.</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
