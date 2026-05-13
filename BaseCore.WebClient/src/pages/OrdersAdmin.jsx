import React, { useEffect, useState } from "react";
import { orderApi, orderDetailApi, shippingApi } from "../services/api";

const ORDER_STATUSES = [
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "PROCESSING", label: "Đang xử lý hủy" },
  { value: "SHIPPED", label: "Đã lấy hàng" },
  { value: "DELIVERING", label: "Đang giao" },
  { value: "DELIVERED", label: "Đã giao" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "RETURNED", label: "Đã hoàn" },
];

const ORDER_MANAGED_STATUS_VALUES = new Set([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "CANCELLED",
]);
const ORDER_MANAGED_STATUSES = ORDER_STATUSES.filter((status) =>
  ORDER_MANAGED_STATUS_VALUES.has(status.value),
);

const STATUS_BADGE = {
  PENDING: "badge-info",
  CONFIRMED: "badge-primary",
  PROCESSING: "badge-warning",
  SHIPPED: "badge-secondary",
  DELIVERING: "badge-primary",
  DELIVERED: "badge-success",
  CANCELLED: "badge-danger",
  RETURNED: "badge-dark",
};

const CARRIER_OPTIONS = [
  { value: "VNPost", label: "VNPost" },
  { value: "GHN", label: "GHN" },
  { value: "Grab", label: "Grab" },
  { value: "Viettel Post", label: "Viettel Post" },
  { value: "J&T", label: "J&T" },
  { value: "FedEx", label: "FedEx" },
  { value: "DHL", label: "DHL" },
  { value: "UPS", label: "UPS" },
];

const getCustomerName = (order) =>
  order?.user?.name ||
  order?.user?.userName ||
  order?.user?.username ||
  order?.user?.email ||
  "Khách hàng";

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
  const [finalAmount, setFinalAmount] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState(null); // Quản lý dropdown trong bảng

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [showShippingModal, setShowShippingModal] = useState(false);
  const [orderForShipping, setOrderForShipping] = useState(null);
  const [shippingForm, setShippingForm] = useState({
    shippingMethod: "STANDARD",
    shippingFee: 0,
    carrierName: "",
    trackingCode: "",
    estimatedDeliveryDate: "",
    note: "",
  });
  const [shippingError, setShippingError] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);

  const loadOrders = async (nextPage = page) => {
    setLoading(true);
    try {
      const response = await orderApi.getAll({
        keyword: keyword || undefined,
        status: status || undefined,
        fromDate: fromDate || undefined,
        finalAmount: finalAmount || undefined,
        page: nextPage,
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
    await loadOrders(1);
  };

  const changeStatus = async (orderId, nextStatus) => {
    if (!nextStatus) return;

    if (nextStatus === "CANCELLED") {
      if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;
    }
    try {
      await orderApi.updateStatus(orderId, nextStatus);
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Cập nhật trạng thái thất bại");
    }
  };

  const viewDetails = async (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
    setDetailsLoading(true);
    try {
      const res = await orderDetailApi.getAll({
        orderId: order.id,
        pageSize: 100,
      });
      setOrderDetails(res.data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailsLoading(false);
    }
  };

  const openShippingModal = (order) => {
    setOrderForShipping(order);
    // Tính phí vận chuyển: nếu có mã giảm giá, giảm 50% hoặc miễn phí
    let calculatedFee = order.shippingFee || 0;
    if (order.discountAmount > 0) {
      // Nếu có mã giảm giá, giảm 50% phí vận chuyển
      calculatedFee = Math.max(0, calculatedFee * 0.5);
    }

    setShippingForm({
      shippingMethod: "STANDARD",
      shippingFee: calculatedFee,
      carrierName: "",
      trackingCode: `SHIP-${order.id}`, // Tự động generate
      estimatedDeliveryDate: "",
      note: "",
    });
    setShippingError("");
    setShowShippingModal(true);
  };

  const closeShippingModal = () => {
    setShowShippingModal(false);
    setOrderForShipping(null);
    setShippingError("");
  };

  const handleCreateShipping = async (e) => {
    e.preventDefault();
    if (!orderForShipping) return;

    setShippingError("");
    setShippingLoading(true);

    try {
      const payload = {
        orderId: orderForShipping.id,
        receiverName: getCustomerName(orderForShipping),
        receiverPhone: orderForShipping.user?.phoneNumber || "",
        shippingAddress: orderForShipping.shippingAddress,
        shippingMethod: shippingForm.shippingMethod,
        shippingStatus: "WAITING",
        shippingFee: Number(shippingForm.shippingFee) || 0,
        estimatedDeliveryDate: shippingForm.estimatedDeliveryDate || null,
        trackingCode: shippingForm.trackingCode || null,
        carrierName: shippingForm.carrierName || null,
        note: shippingForm.note || null,
      };

      await shippingApi.create(payload);
      closeShippingModal();
      await loadOrders();
    } catch (err) {
      setShippingError(
        err.response?.data?.message || "Tạo vận chuyển thất bại",
      );
    } finally {
      setShippingLoading(false);
    }
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <li key={i} className={`page-item ${page === i ? "active" : ""}`}>
          <button className="page-link" onClick={() => setPage(i)}>
            {i}
          </button>
        </li>,
      );
    }
    return pages;
  };

  const formatMoney = (v) => Number(v || 0).toLocaleString("vi-VN") + " đ";

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Quản lý Đơn hàng</h1>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <div className="row">
                <div className="col-md-8">
                  <form onSubmit={handleSearch} className="form-inline">
                    <input
                      type="text"
                      className="form-control mr-2"
                      placeholder="Tìm theo mã đơn, khách hàng..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                    <select
                      className="form-control mr-2"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">Tất cả trạng thái</option>
                      {ORDER_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      className="form-control mr-2"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                    <input
                      type="number"
                      className="form-control mr-2"
                      placeholder="Tìm thành tiền..."
                      value={finalAmount}
                      onChange={(e) => setFinalAmount(e.target.value)}
                      min="0"
                    />
                    <button type="submit" className="btn btn-primary">
                      <i className="fas fa-search"></i> Tìm
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                </div>
              ) : (
                <>
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Ngày đặt</th>
                        <th>Phương thức TT</th>
                        <th>TT thanh toán</th>
                        <th>Thành tiền</th>
                        <th>Trạng thái</th>
                        <th style={{ width: "200px" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            Không tìm thấy đơn hàng nào
                          </td>
                        </tr>
                      ) : (
                        items.map((order) => {
                          const isOrderManaged =
                            ORDER_MANAGED_STATUS_VALUES.has(order.status);

                          return (
                            <tr key={order.id}>
                              <td>
                                <strong>#{order.id}</strong>
                              </td>
                              <td>
                                <div>{getCustomerName(order)}</div>
                                <small className="text-muted">
                                  {order.shippingAddress?.substring(0, 25)}...
                                </small>
                              </td>
                              <td>
                                {new Date(order.orderDate).toLocaleDateString(
                                  "vi-VN",
                                )}
                              </td>
                              <td>
                                <small>{order.paymentMethod}</small>
                              </td>
                              <td>
                                <span
                                  className={`badge ${order.paymentStatus === "PAID" ? "badge-success" : "badge-warning"}`}
                                >
                                  {order.paymentStatus === "PAID"
                                    ? "Đã TT"
                                    : "Chưa TT"}
                                </span>
                              </td>
                              <td>
                                <strong className="text-danger">
                                  {formatMoney(order.finalAmount)}
                                </strong>
                              </td>
                              <td>
                                <span
                                  className={`badge ${STATUS_BADGE[order.status] || "badge-secondary"}`}
                                >
                                  {ORDER_STATUSES.find(
                                    (s) => s.value === order.status,
                                  )?.label || order.status}
                                </span>
                              </td>
                              <td className="d-flex align-items-center">
                                <button
                                  className="btn btn-sm btn-info mr-1"
                                  onClick={() => viewDetails(order)}
                                  title="Xem chi tiết"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                {order.status === "CONFIRMED" && (
                                  <button
                                    className="btn btn-sm btn-success mr-1"
                                    onClick={() => openShippingModal(order)}
                                    title="Tạo vận chuyển"
                                  >
                                    <i className="fas fa-truck"></i>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  <div className="d-flex justify-content-between align-items-center">
                    <span>Tổng: {totalCount} đơn hàng</span>
                    <nav>
                      <ul className="pagination mb-0">
                        <li
                          className={`page-item ${page === 1 ? "disabled" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setPage(page - 1)}
                          >
                            Trước
                          </button>
                        </li>
                        {renderPagination()}
                        <li
                          className={`page-item ${page === totalPages ? "disabled" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setPage(page + 1)}
                          >
                            Sau
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Chi tiết Đơn hàng #{selectedOrder.id}
                </h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => setShowDetailModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {/* Order Info */}
                <div className="row mb-3">
                  <div className="col-md-3">
                    <strong>Khách hàng:</strong>
                    <br />
                    <span>{getCustomerName(selectedOrder)}</span>
                  </div>
                  <div className="col-md-3">
                    <strong>Ngày đặt:</strong>
                    <br />
                    <span>
                      {new Date(selectedOrder.orderDate).toLocaleString(
                        "vi-VN",
                      )}
                    </span>
                  </div>
                  <div className="col-md-3">
                    <strong>Phương thức TT:</strong>
                    <br />
                    <span className="badge badge-secondary">
                      {selectedOrder.paymentMethod}
                    </span>
                  </div>
                  <div className="col-md-3">
                    <strong>Trạng thái TT:</strong>
                    <br />
                    <span
                      className={`badge ${selectedOrder.paymentStatus === "PAID" ? "badge-success" : "badge-warning"}`}
                    >
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Địa chỉ giao hàng:</strong>
                    <br />
                    <span>{selectedOrder.shippingAddress}</span>
                  </div>
                  <div className="col-md-3">
                    <strong>Phí vận chuyển:</strong>
                    <br />
                    <span>{formatMoney(selectedOrder.shippingFee)}</span>
                  </div>
                  <div className="col-md-3">
                    <strong>Trạng thái:</strong>
                    <br />
                    <div className="d-flex align-items-center mt-1">
                      <span
                        className={`badge ${STATUS_BADGE[selectedOrder.status] || "badge-secondary"}`}
                        style={{ fontSize: "14px", marginRight: "8px" }}
                      >
                        {
                          ORDER_STATUSES.find(
                            (s) => s.value === selectedOrder.status,
                          )?.label
                        }
                      </span>
                      <div className="ml-2" style={{ width: "160px" }}>
                        <select
                          className="form-control form-control-sm"
                          value={ORDER_MANAGED_STATUS_VALUES.has(selectedOrder.status) ? selectedOrder.status : ""}
                          onChange={(e) => {
                            const nextVal = e.target.value;
                            if (nextVal) {
                              changeStatus(selectedOrder.id, nextVal);
                              setSelectedOrder({ ...selectedOrder, status: nextVal });
                            }
                          }}
                          disabled={!ORDER_MANAGED_STATUS_VALUES.has(selectedOrder.status)}
                        >
                          {!ORDER_MANAGED_STATUS_VALUES.has(selectedOrder.status) && (
                            <option value="">(Quản lý vận chuyển)</option>
                          )}
                          {ORDER_MANAGED_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Details Table */}
                {detailsLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border text-primary"></div>
                  </div>
                ) : (
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>Biến thể</th>
                        <th className="text-center">SL</th>
                        <th className="text-right">Đơn giá</th>
                        <th className="text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.map((d) => (
                        <tr key={d.id}>
                          <td>{d.productName || `SP #${d.productId}`}</td>
                          <td>{d.variantInfo || "-"}</td>
                          <td className="text-center">{d.quantity}</td>
                          <td className="text-right">
                            {formatMoney(d.unitPrice)}
                          </td>
                          <td className="text-right">
                            {formatMoney(d.quantity * d.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="4" className="text-right">
                          <strong>Tổng tiền hàng:</strong>
                        </td>
                        <td className="text-right">
                          {formatMoney(selectedOrder.totalAmount)}
                        </td>
                      </tr>
                      {selectedOrder.discountAmount > 0 && (
                        <tr>
                          <td colSpan="4" className="text-right text-success">
                            Giảm giá:
                          </td>
                          <td className="text-right text-success">
                            -{formatMoney(selectedOrder.discountAmount)}
                          </td>
                        </tr>
                      )}
                      {selectedOrder.shippingFee > 0 && (
                        <tr>
                          <td colSpan="4" className="text-right text-muted">
                            Phí vận chuyển:
                          </td>
                          <td className="text-right text-muted">
                            {formatMoney(selectedOrder.shippingFee)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan="4" className="text-right">
                          <strong>THÀNH TIỀN:</strong>
                        </td>
                        <td className="text-right">
                          <strong className="text-danger">
                            {formatMoney(selectedOrder.finalAmount)}
                          </strong>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}

                {selectedOrder.cancelledReason && (
                  <div className="alert alert-warning mt-2">
                    <strong>Lý do hủy:</strong> {selectedOrder.cancelledReason}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDetailModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDetailModal && <div className="modal-backdrop fade show"></div>}

      {/* Shipping Modal */}
      {showShippingModal && orderForShipping && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Tạo vận chuyển cho đơn #
                  {orderForShipping.orderCode || orderForShipping.id}
                </h5>
                <button
                  type="button"
                  className="close"
                  onClick={closeShippingModal}
                >
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleCreateShipping}>
                <div className="modal-body">
                  {shippingError && (
                    <div className="alert alert-danger">{shippingError}</div>
                  )}

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <strong>Khách hàng:</strong>
                      <p className="text-muted mb-0">
                        {getCustomerName(orderForShipping)}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <strong>Địa chỉ giao hàng:</strong>
                      <p className="text-muted mb-0">
                        {orderForShipping.shippingAddress}
                      </p>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>
                          Phương thức vận chuyển{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-control"
                          value={shippingForm.shippingMethod}
                          onChange={(e) =>
                            setShippingForm({
                              ...shippingForm,
                              shippingMethod: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="STANDARD">Tiêu chuẩn</option>
                          <option value="EXPRESS">Nhanh</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>
                          Đơn vị vận chuyển{" "}
                          <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="VNPost, GHN, Grab, ..."
                          value={shippingForm.carrierName}
                          onChange={(e) =>
                            setShippingForm({
                              ...shippingForm,
                              carrierName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Mã vận đơn</label>
                        <input
                          type="text"
                          className="form-control"
                          value={shippingForm.trackingCode}
                          onChange={(e) =>
                            setShippingForm({
                              ...shippingForm,
                              trackingCode: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Phí vận chuyển</label>
                        <input
                          type="number"
                          className="form-control"
                          value={shippingForm.shippingFee}
                          onChange={(e) =>
                            setShippingForm({
                              ...shippingForm,
                              shippingFee: e.target.value,
                            })
                          }
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-12">
                      <div className="form-group">
                        <label>Ngày dự kiến giao hàng</label>
                        <input
                          type="date"
                          className="form-control"
                          value={shippingForm.estimatedDeliveryDate}
                          onChange={(e) =>
                            setShippingForm({
                              ...shippingForm,
                              estimatedDeliveryDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Ghi chú</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={shippingForm.note}
                      onChange={(e) =>
                        setShippingForm({
                          ...shippingForm,
                          note: e.target.value,
                        })
                      }
                      placeholder="Nhập ghi chú nếu có..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeShippingModal}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={shippingLoading}
                  >
                    {shippingLoading ? "Đang tạo..." : "Tạo vận chuyển"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showShippingModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default OrdersAdmin;
