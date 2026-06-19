import React, { useState, useEffect } from "react";
import { analyticsApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const defaultStats = {
  totalRevenue: 0,
  revenueToday: 0,
  revenueThisMonth: 0,
  revenueLastMonth: 0,
  totalOrders: 0,
  ordersToday: 0,
  pendingOrders: 0,
  processingOrders: 0,
  shippingOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
  returnedOrders: 0,
  totalCustomers: 0,
  newCustomersThisMonth: 0,
  totalProducts: 0,
  totalStock: 0,
  lowStockProducts: 0,
  outOfStockProducts: 0,
  totalReviews: 0,
  averageRating: 0,
  averageOrderValue: 0,
  growthPercentage: 0,
};

const Dashboard = () => {
  const [stats, setStats] = useState(defaultStats);
  const [revenueRows, setRevenueRows] = useState([]);
  const [revenueMode, setRevenueMode] = useState("day");
  const [revenueStart, setRevenueStart] = useState("today");
  const [revenueEnd, setRevenueEnd] = useState("today");
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, bestSellersRes] = await Promise.all([
        analyticsApi.getStats(),
        analyticsApi.getBestSellers(5),
      ]);
      setStats({ ...defaultStats, ...(statsRes.data || {}) });
      setBestSellers(bestSellersRes.data || []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  const loadRevenueData = async (
    mode = revenueMode,
    start = revenueStart,
    end = revenueEnd,
  ) => {
    setRevenueLoading(true);
    try {
      const res = await analyticsApi.getRevenue(
        start || undefined,
        end || undefined,
        mode,
      );
      setRevenueRows(res.data || []);
    } finally {
      setRevenueLoading(false);
    }
  };
  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

  const formatCompactMoney = (value) => {
    const amount = Number(value || 0);
    if (Math.abs(amount) >= 1000000000) {
      return `${(amount / 1000000000).toLocaleString("vi-VN", {
        maximumFractionDigits: 1,
      })} tỷ`;
    }
    if (Math.abs(amount) >= 1000000) {
      return `${(amount / 1000000).toLocaleString("vi-VN", {
        maximumFractionDigits: 1,
      })} tr`;
    }
    return formatMoney(amount);
  };

  const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");

  const formatPercent = (value) => {
    const number = Number(value || 0);
    return `${number > 0 ? "+" : ""}${number.toLocaleString("vi-VN", {
      maximumFractionDigits: 1,
    })}%`;
  };

  const actionableOrders =
    Number(stats.pendingOrders || 0) + Number(stats.processingOrders || 0);
  const stockWarnings =
    Number(stats.lowStockProducts || 0) + Number(stats.outOfStockProducts || 0);

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
              <div className="row">
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-success shadow-sm">
                    <div className="inner">
                      <h3>{formatCompactMoney(stats.totalRevenue)}</h3>
                      <p>Doanh thu đã thanh toán</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-dollar-sign"></i>
                    </div>
                    <a href="/orders" className="small-box-footer">
                      Xem đơn hàng <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-info shadow-sm">
                    <div className="inner">
                      <h3>{formatNumber(actionableOrders)}</h3>
                      <p>Đơn cần xử lý</p>
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
                  <div className="small-box bg-warning shadow-sm">
                    <div className="inner">
                      <h3>{formatNumber(stats.totalStock)}</h3>
                      <p>Tồn kho hiện tại</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-boxes"></i>
                    </div>
                    <a href="/products" className="small-box-footer">
                      Xem sản phẩm <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
                <div className="col-lg-3 col-6">
                  <div className="small-box bg-danger shadow-sm">
                    <div className="inner">
                      <h3>{formatNumber(stockWarnings)}</h3>
                      <p>Sản phẩm cần nhập</p>
                    </div>
                    <div className="icon">
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <a href="/products" className="small-box-footer">
                      Kiểm tra kho <i className="fas fa-arrow-circle-right"></i>
                    </a>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <div className="card shadow-sm">
                    <div className="card-header">
                      <h3 className="card-title">
                        Doanh thu theo ngày, tháng, năm
                      </h3>
                    </div>

                    <div className="card-body">
                      <form
                        className="form-inline mb-3"
                        onSubmit={(e) => {
                          e.preventDefault();
                          loadRevenueData();
                        }}
                      >
                        <select
                          className="form-control mr-2"
                          value={revenueMode}
                          onChange={(e) => {
                            setRevenueMode(e.target.value);
                            loadRevenueData(e.target.value);
                          }}
                        >
                          <option value="day">Theo ngày</option>
                          <option value="month">Theo tháng</option>
                          <option value="year">Theo năm</option>
                        </select>

                        <input
                          type="date"
                          className="form-control mr-2"
                          value={revenueStart}
                          onChange={(e) => setRevenueStart(e.target.value)}
                        />

                        <input
                          type="date"
                          className="form-control mr-2"
                          value={revenueEnd}
                          onChange={(e) => setRevenueEnd(e.target.value)}
                        />

                        <button type="submit" className="btn btn-primary">
                          <i className="fas fa-search"></i> Xem
                        </button>
                      </form>

                      <div className="table-responsive p-0">
                        <table className="table table-striped table-valign-middle">
                          <thead>
                            <tr>
                              <th>Kỳ</th>
                              <th>Số đơn</th>
                              <th>Doanh thu</th>
                            </tr>
                          </thead>
                          <tbody>
                            {revenueLoading ? (
                              <tr>
                                <td colSpan="3" className="text-center py-4">
                                  Đang tải...
                                </td>
                              </tr>
                            ) : revenueRows.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="text-center py-4">
                                  Chưa có dữ liệu
                                </td>
                              </tr>
                            ) : (
                              revenueRows.map((row) => (
                                <tr key={row.date}>
                                  <td>{row.date}</td>
                                  <td>{formatNumber(row.orders)}</td>
                                  <td>{formatMoney(row.revenue)}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-lg-7">
                  <div className="card shadow-sm">
                    <div className="card-header border-0">
                      <h3 className="card-title">Sản phẩm bán chạy</h3>
                      <div className="card-tools">
                        <a href="/products" className="btn btn-tool btn-sm">
                          <i className="fas fa-box-open"></i>
                        </a>
                      </div>
                    </div>
                    <div className="card-body table-responsive p-0">
                      <table className="table table-striped table-valign-middle">
                        <thead>
                          <tr>
                            <th>Sản phẩm</th>
                            <th>Giá bán TB</th>
                            <th>Đã bán</th>
                            <th>Doanh thu</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bestSellers.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="text-center py-4">
                                Chưa có dữ liệu bán hàng
                              </td>
                            </tr>
                          ) : (
                            bestSellers.map((item) => (
                              <tr key={item.productId}>
                                <td>{item.productName}</td>
                                <td>
                                  {formatMoney(
                                    item.totalRevenue / (item.totalSold || 1),
                                  )}
                                </td>
                                <td>
                                  <small className="text-success mr-1">
                                    <i className="fas fa-arrow-up"></i>
                                  </small>
                                  {formatNumber(item.totalSold)}
                                </td>
                                <td>{formatMoney(item.totalRevenue)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="col-lg-5">
                  <div className="card shadow-sm bg-gradient-primary">
                    <div className="card-header border-0">
                      <h3 className="card-title">Hiệu suất tháng này</h3>
                    </div>
                    <div className="card-body text-center py-5">
                      <div className="growth-circle mb-3">
                        <h2 className="display-4 font-weight-bold">
                          {formatPercent(stats.growthPercentage)}
                        </h2>
                        <p>So với tháng trước</p>
                      </div>
                      <div className="row text-left mb-4">
                        <div className="col-6">
                          <small>Tháng này</small>
                          <div className="font-weight-bold">
                            {formatCompactMoney(stats.revenueThisMonth)}
                          </div>
                        </div>
                        <div className="col-6">
                          <small>Giá trị đơn TB</small>
                          <div className="font-weight-bold">
                            {formatCompactMoney(stats.averageOrderValue)}
                          </div>
                        </div>
                      </div>
                      <a
                        href="/orders"
                        className="btn btn-light btn-sm px-4 font-weight-bold"
                      >
                        XEM PHÂN TÍCH
                      </a>
                    </div>
                  </div>

                  <div className="card shadow-sm">
                    <div className="card-header">
                      <h3 className="card-title">Tình trạng cửa hàng</h3>
                    </div>
                    <div className="card-body">
                      <div className="d-flex align-items-center border-bottom mb-3 pb-3">
                        <i className="fas fa-clipboard-list text-info mr-3 fa-2x"></i>
                        <div>
                          <p className="mb-0 font-weight-bold">
                            {formatNumber(stats.ordersToday)} đơn hôm nay
                          </p>
                          <small className="text-muted">
                            {formatNumber(stats.deliveredOrders)} đã giao,{" "}
                            {formatNumber(stats.shippingOrders)} đang giao
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center border-bottom mb-3 pb-3">
                        <i className="fas fa-users text-warning mr-3 fa-2x"></i>
                        <div>
                          <p className="mb-0 font-weight-bold">
                            {formatNumber(stats.totalCustomers)} khách hàng
                          </p>
                          <small className="text-muted">
                            {formatNumber(stats.newCustomersThisMonth)} khách
                            mới tháng này
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center border-bottom mb-3 pb-3">
                        <i className="fas fa-star text-warning mr-3 fa-2x"></i>
                        <div>
                          <p className="mb-0 font-weight-bold">
                            {Number(stats.averageRating || 0).toLocaleString(
                              "vi-VN",
                              {
                                maximumFractionDigits: 1,
                              },
                            )}
                            /5 điểm đánh giá
                          </p>
                          <small className="text-muted">
                            Từ {formatNumber(stats.totalReviews)} đánh giá sản
                            phẩm
                          </small>
                        </div>
                      </div>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-box-open text-danger mr-3 fa-2x"></i>
                        <div>
                          <p className="mb-0 font-weight-bold">
                            {formatNumber(stats.totalProducts)} sản phẩm đang
                            quản lý
                          </p>
                          <small className="text-muted">
                            {formatNumber(stats.lowStockProducts)} sắp hết,{" "}
                            {formatNumber(stats.outOfStockProducts)} hết hàng
                          </small>
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
