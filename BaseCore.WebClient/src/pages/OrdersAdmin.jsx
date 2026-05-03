import React, { useEffect, useState } from "react";
import { orderApi, orderDetailApi, orderPromotionApi } from "../services/api";

const ORDER_STATUSES = [
  { value: "CHO_XU_LY", label: "Chờ xử lý" },
  { value: "DANG_VAN_CHUYEN", label: "Đang giao" },
  { value: "DA_VAN_CHUYEN", label: "Đã giao" },
  { value: "HUY", label: "Đã hủy" },
  { value: "CHO_DUYET_HUY", label: "Chờ duyệt hủy" },
];

const OrdersAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");

  // Order Details Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [orderPromotions, setOrderPromotions] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = await orderApi.getAll({
        keyword: keyword || undefined,
        status: status || undefined,
        fromDate: fromDate || undefined,
        page,
        pageSize,
      });
      setItems(response.data.items || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalCount(response.data.totalCount || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await loadOrders();
  };

  const changeStatus = async (orderId, nextStatus) => {
    const isCancel = nextStatus === "HUY";
    if (isCancel) {
      if (!window.confirm("Xác nhận duyệt hủy đơn hàng này? Tồn kho sẽ được hoàn lại.")) {
        return;
      }
    }

    try {
      await orderApi.updateStatus(orderId, nextStatus);
      alert("Cập nhật trạng thái thành công");
      await loadOrders();
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi cập nhật trạng thái");
    }
  };

  const viewDetails = async (order) => {
    setSelectedOrder(order);
    setOrderDetails([]);
    setOrderPromotions([]);
    setShowDetailModal(true);
    setDetailsLoading(true);

    try {
      // Giả sử API hỗ trợ lấy chi tiết theo OrderId
      const [detailsRes, promoRes] = await Promise.all([
        orderDetailApi.getAll({ keyword: String(order.id), pageSize: 100 }),
        orderPromotionApi ? orderPromotionApi.getAll({ keyword: String(order.id), pageSize: 100 }) : { data: { items: [] } }
      ]);
      
      // Lọc lại để chắc chắn chỉ lấy của đơn hàng này (nếu keyword search trả về nhiều hơn)
      const filteredDetails = (detailsRes.data.items || []).filter(d => d.orderId === order.id);
      const filteredPromos = (promoRes.data.items || []).filter(p => p.orderId === order.id);
      
      setOrderDetails(filteredDetails);
      setOrderPromotions(filteredPromos);
    } catch (error) {
      console.error("Lỗi khi tải chi tiết đơn hàng:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0 text-dark">Quản lý Đơn hàng</h1>
        </div>
      </div>
      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header border-0">
              <form onSubmit={handleSearch} className="form-inline">
                <div className="input-group mr-2">
                  <div className="input-group-prepend">
                    <span className="input-group-text"><i className="fas fa-search"></i></span>
                  </div>
                  <input
                    className="form-control"
                    placeholder="Mã đơn / ID khách..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <select
                  className="form-control mr-2"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  {ORDER_STATUSES.map((x) => (
                    <option key={x.value} value={x.value}>
                      {x.label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="form-control mr-2"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <button className="btn btn-primary shadow-sm" type="submit">
                  Tìm kiếm
                </button>
              </form>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                  <div className="mt-2 text-muted">Đang tải dữ liệu đơn hàng...</div>
                </div>
              ) : (
                <>
                  <table className="table table-hover table-valign-middle mb-0">
                    <thead className="thead-light">
                      <tr>
                        <th style={{ width: '80px' }}>Mã Đơn</th>
                        <th>Khách hàng</th>
                        <th>Ngày đặt</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Cập nhật trạng thái</th>
                        <th className="text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((order) => (
                        <tr key={order.id}>
                          <td><strong>#{order.id}</strong></td>
                          <td>
                            <div className="d-flex flex-column">
                              <span className="font-weight-bold text-truncate" style={{ maxWidth: '150px' }}>{order.userId}</span>
                              <small className="text-muted">ID: {order.userId?.substring(0, 8)}...</small>
                            </div>
                          </td>
                          <td>
                            <div>{new Date(order.orderDate).toLocaleDateString('vi-VN')}</div>
                            <small className="text-muted">{new Date(order.orderDate).toLocaleTimeString('vi-VN')}</small>
                          </td>
                          <td>
                            <span className="text-danger font-weight-bold">
                              {order.totalAmount?.toLocaleString()} VND
                            </span>
                          </td>
                          <td>
                            {order.status === "CHO_XU_LY" && <span className="badge badge-info">Chờ xử lý</span>}
                            {order.status === "DANG_VAN_CHUYEN" && <span className="badge badge-primary">Đang giao</span>}
                            {order.status === "DA_VAN_CHUYEN" && <span className="badge badge-success">Đã giao</span>}
                            {order.status === "HUY" && <span className="badge badge-danger">Đã hủy</span>}
                            {order.status === "CHO_DUYET_HUY" && <span className="badge badge-warning">Chờ duyệt hủy</span>}
                          </td>
                          <td>
                            <select
                              className="form-control form-control-sm status-select"
                              style={{ width: '150px' }}
                              value={order.status}
                              onChange={(e) => changeStatus(order.id, e.target.value)}
                            >
                              <option value="" disabled>Đổi trạng thái...</option>
                              {ORDER_STATUSES.map((x) => (
                                <option key={x.value} value={x.value}>
                                  {x.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="text-right">
                            <button 
                                className="btn btn-sm btn-outline-info" 
                                onClick={() => viewDetails(order)}
                                title="Xem chi tiết"
                            >
                                <i className="fas fa-eye"></i> Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                      {items.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center py-5">
                            <i className="fas fa-box-open fa-3x text-muted mb-3 d-block"></i>
                            Không tìm thấy đơn hàng nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="card-footer clearfix bg-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">Hiển thị {items.length} trên tổng số {totalCount} đơn hàng</span>
                      <div className="pagination-container">
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <span className="mx-3 font-weight-bold small">Trang {page} / {totalPages}</span>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage((p) => p + 1)}
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modal Chi tiết đơn hàng */}
      {showDetailModal && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog modal-xl">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title font-weight-bold">
                  <i className="fas fa-file-invoice mr-2"></i> Chi tiết Đơn hàng #{selectedOrder?.id}
                </h5>
                <button type="button" className="close text-white" onClick={() => setShowDetailModal(false)}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body p-0">
                <div className="p-4 bg-light border-bottom">
                    <div className="row">
                        <div className="col-md-4">
                            <p className="mb-1 text-muted small uppercase">Khách hàng</p>
                            <h6 className="font-weight-bold">{selectedOrder?.userId}</h6>
                        </div>
                        <div className="col-md-4">
                            <p className="mb-1 text-muted small uppercase">Ngày đặt</p>
                            <h6>{new Date(selectedOrder?.orderDate).toLocaleString('vi-VN')}</h6>
                        </div>
                        <div className="col-md-4">
                            <p className="mb-1 text-muted small uppercase">Trạng thái</p>
                            <span className="badge badge-lg badge-info">
                                {ORDER_STATUSES.find(s => s.value === selectedOrder?.status)?.label}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <h6 className="font-weight-bold mb-3"><i className="fas fa-list mr-2"></i> Danh sách sản phẩm</h6>
                    {detailsLoading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border spinner-border-sm text-primary mr-2"></div>
                            Đang tải danh sách mặt hàng...
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-bordered table-striped mb-0">
                                <thead className="bg-white">
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th className="text-center">Số lượng</th>
                                        <th className="text-right">Đơn giá</th>
                                        <th className="text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderDetails.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="font-weight-bold">{item.productName || `Mã SP: ${item.productId}`}</div>
                                                <small className="text-muted">ID: {item.productId}</small>
                                            </td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-right">{item.unitPrice?.toLocaleString()} VND</td>
                                            <td className="text-right font-weight-bold text-dark">
                                                {(item.quantity * item.unitPrice)?.toLocaleString()} VND
                                            </td>
                                        </tr>
                                    ))}
                                    {orderDetails.length === 0 && (
                                        <tr><td colSpan="4" className="text-center text-muted">Không có dữ liệu mặt hàng</td></tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-light">
                                    <tr>
                                        <td colSpan="3" className="text-right font-weight-bold">TỔNG CỘNG:</td>
                                        <td className="text-right font-weight-bold text-danger text-lg">
                                            {selectedOrder?.totalAmount?.toLocaleString()} VND
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {orderPromotions.length > 0 && (
                        <div className="mt-4">
                            <h6 className="font-weight-bold mb-3"><i className="fas fa-tag mr-2"></i> Khuyến mãi áp dụng</h6>
                            <div className="alert alert-success border-0 shadow-sm">
                                <ul className="mb-0">
                                    {orderPromotions.map(promo => (
                                        <li key={promo.id}>
                                            <strong>{promo.promotionCode}</strong>: Giảm {promo.discountAmount?.toLocaleString()} VND
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                  Đóng
                </button>
                <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                  <i className="fas fa-print mr-2"></i> In hóa đơn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDetailModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default OrdersAdmin;
