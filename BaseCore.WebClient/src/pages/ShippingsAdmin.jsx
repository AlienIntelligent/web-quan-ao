import React, { useEffect, useState } from "react";
import { shippingApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const STATUS_OPTIONS = [
  { value: "WAITING", label: "Chờ xử lý", className: "badge-secondary" },
  { value: "PICKED_UP", label: "Đã lấy hàng", className: "badge-info" },
  { value: "SHIPPING", label: "Đang giao", className: "badge-primary" },
  { value: "DELIVERED", label: "Đã giao", className: "badge-success" },
  { value: "FAILED", label: "Giao thất bại", className: "badge-danger" },
  { value: "CANCELLED", label: "Đã hủy", className: "badge-warning" },
];

const METHOD_OPTIONS = [
  { value: "STANDARD", label: "Tiêu chuẩn" },
  { value: "EXPRESS", label: "Nhanh" },
];

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

const emptyForm = {
  orderId: "",
  receiverName: "",
  receiverPhone: "",
  shippingAddress: "",
  shippingMethod: "STANDARD",
  shippingStatus: "WAITING",
  shippingFee: 0,
  shippedDate: "",
  estimatedDeliveryDate: "",
  deliveredDate: "",
  trackingCode: "",
  carrierName: "",
  note: "",
};

const ShippingsAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCarrier, setFilterCarrier] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { isAdmin } = useAuth();

  const loadItems = async (nextPage = page) => {
    setLoading(true);
    setSuccess("");
    try {
      const res = await shippingApi.getAll({
        status: filterStatus || undefined,
        carrierName: filterCarrier || undefined,
        keyword: keyword || undefined,
        page: nextPage,
        pageSize,
      });

      setItems(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.totalCount || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [page]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await loadItems(1);
  };

  const toDateInputValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const openModal = (shipping = null) => {
    if (shipping) {
      setEditing(shipping);
      setFormData({
        orderId: shipping.orderId ?? "",
        receiverName: shipping.receiverName || "",
        receiverPhone: shipping.receiverPhone || "",
        shippingAddress: shipping.shippingAddress || "",
        shippingMethod: shipping.shippingMethod || "STANDARD",
        shippingStatus: shipping.shippingStatus || "WAITING",
        shippingFee: shipping.shippingFee ?? 0,
        shippedDate: toDateInputValue(shipping.shippedDate),
        estimatedDeliveryDate: toDateInputValue(shipping.estimatedDeliveryDate),
        deliveredDate: toDateInputValue(shipping.deliveredDate),
        trackingCode: shipping.trackingCode || "",
        carrierName: shipping.carrierName || "",
        note: shipping.note || "",
      });
    } else {
      setEditing(null);
      setFormData(emptyForm);
    }
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        orderId: Number(formData.orderId),
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        shippingAddress: formData.shippingAddress,
        shippingMethod: formData.shippingMethod,
        shippingStatus: formData.shippingStatus,
        shippingFee: Number(formData.shippingFee) || 0,
        shippedDate: formData.shippedDate || null,
        estimatedDeliveryDate: formData.estimatedDeliveryDate || null,
        deliveredDate: formData.deliveredDate || null,
        trackingCode: formData.trackingCode || null,
        carrierName: formData.carrierName || null,
        note: formData.note || null,
      };

      if (editing) await shippingApi.update(editing.id, payload);
      else await shippingApi.create(payload);

      closeModal();
      await loadItems(1);
      setPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa vận chuyển này?")) return;
    try {
      await shippingApi.delete(id);
      await loadItems();
    } catch (err) {
      alert(err.response?.data?.message || "Xóa thất bại");
    }
  };

  const handleConfirmShipment = async (id) => {
    if (
      !window.confirm(
        "Xác nhận chuyển đơn hàng này? Trạng thái sẽ được cập nhật thành 'Đã lấy hàng' và trạng thái đơn hàng sẽ chuyển thành 'Đã chuyển'.",
      )
    )
      return;
    try {
      await shippingApi.confirm(id);
      setSuccess("Xác nhận chuyển đơn thành công!");
      await loadItems();
    } catch (err) {
      alert(err.response?.data?.message || "Xác nhận thất bại");
    }
  };

  const getStatusMeta = (status) =>
    STATUS_OPTIONS.find((item) => item.value === status) || {
      value: status,
      label: status || "-",
      className: "badge-secondary",
    };

  const getMethodLabel = (method) =>
    METHOD_OPTIONS.find((item) => item.value === method)?.label ||
    method ||
    "-";

  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("vi-VN") : "-";

  const renderPagination = () =>
    Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
      <li
        key={pageNumber}
        className={`page-item ${page === pageNumber ? "active" : ""}`}
      >
        <button className="page-link" onClick={() => setPage(pageNumber)}>
          {pageNumber}
        </button>
      </li>
    ));

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Quản lý Vận chuyển</h1>
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
                    <select
                      className="form-control mr-2"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="">Tất cả trạng thái</option>
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="form-control mr-2"
                      placeholder="Tìm mã vận đơn, người nhận, địa chỉ..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-control mr-2"
                      placeholder="Tìm đơn vị vận chuyển..."
                      value={filterCarrier}
                      onChange={(e) => setFilterCarrier(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">
                      <i className="fas fa-search"></i> Tìm
                    </button>
                  </form>
                </div>
                <div className="col-md-4 text-right">
                  {isAdmin() && (
                    <button
                      className="btn btn-success"
                      onClick={() => openModal()}
                    >
                      <i className="fas fa-plus"></i> Thêm vận chuyển
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                </div>
              ) : (
                <>
                  {success && (
                    <div
                      className="alert alert-success alert-dismissible fade show"
                      role="alert"
                    >
                      {success}
                      <button
                        type="button"
                        className="close"
                        onClick={() => setSuccess("")}
                      >
                        <span>&times;</span>
                      </button>
                    </div>
                  )}
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>Mã vận đơn</th>
                        <th>Đơn hàng</th>
                        <th>Người nhận</th>
                        <th>Địa chỉ</th>
                        <th>Phương thức</th>
                        <th>Đơn vị</th>
                        <th>Phí</th>
                        <th>Ngày dự kiến</th>
                        <th>Ngày giao thành công</th>
                        <th>Trạng thái</th>
                        {isAdmin() && (
                          <th style={{ width: "120px" }}>Thao tác</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={isAdmin() ? 11 : 10}
                            className="text-center py-4"
                          >
                            Không tìm thấy dữ liệu nào
                          </td>
                        </tr>
                      ) : (
                        items.map((shipping) => {
                          const status = getStatusMeta(shipping.shippingStatus);
                          return (
                            <tr key={shipping.id}>
                              <td>{shipping.trackingCode || shipping.id}</td>
                              <td>#{shipping.orderId}</td>
                              <td>
                                <div>{shipping.receiverName || "-"}</div>
                                <small className="text-muted">
                                  {shipping.receiverPhone || "-"}
                                </small>
                              </td>
                              <td>
                                <div
                                  style={{
                                    maxWidth: "220px",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                  title={shipping.shippingAddress || ""}
                                >
                                  {shipping.shippingAddress || "-"}
                                </div>
                              </td>
                              <td>{getMethodLabel(shipping.shippingMethod)}</td>
                              <td>{shipping.carrierName || "-"}</td>
                              <td>{formatMoney(shipping.shippingFee)}</td>
                              <td>
                                {formatDate(shipping.estimatedDeliveryDate)}
                              </td>
                              <td>{formatDate(shipping.deliveredDate)}</td>
                              <td>
                                <span className={`badge ${status.className}`}>
                                  {status.label}
                                </span>
                              </td>
                              {isAdmin() && (
                                <td>
                                  {shipping.shippingStatus === "WAITING" ? (
                                    <>
                                      <button
                                        className="btn btn-sm btn-success mr-1"
                                        onClick={() =>
                                          handleConfirmShipment(shipping.id)
                                        }
                                        title="Xác nhận chuyển đơn"
                                      >
                                        <i className="fas fa-check"></i>
                                      </button>
                                      <button
                                        className="btn btn-sm btn-info mr-1"
                                        onClick={() => openModal(shipping)}
                                        title="Sửa"
                                      >
                                        <i className="fas fa-edit"></i>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        className="btn btn-sm btn-info mr-1"
                                        onClick={() => openModal(shipping)}
                                        title="Sửa"
                                      >
                                        <i className="fas fa-edit"></i>
                                      </button>
                                    </>
                                  )}
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDelete(shipping.id)}
                                    title="Xóa"
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  <div className="admin-table-footer d-flex justify-content-between align-items-center mt-3 mx-2 pb-3">
                    <span>Tổng: {totalCount} bản ghi</span>
                    <nav>
                      <ul className="pagination mb-0">
                        <li
                          className={`page-item ${page === 1 ? "disabled" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setPage((current) => Math.max(1, current - 1))
                            }
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
                            onClick={() =>
                              setPage((current) =>
                                Math.min(totalPages, current + 1),
                              )
                            }
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

      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editing ? "Sửa vận chuyển" : "Thêm vận chuyển"}
                </h5>
                <button type="button" className="close" onClick={closeModal}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>ID đơn hàng</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.orderId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              orderId: e.target.value,
                            })
                          }
                          min="1"
                          required
                          disabled={!!editing}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Phương thức</label>
                        <select
                          className="form-control"
                          value={formData.shippingMethod}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shippingMethod: e.target.value,
                            })
                          }
                          disabled={!!editing}
                        >
                          {METHOD_OPTIONS.map((method) => (
                            <option key={method.value} value={method.value}>
                              {method.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Trạng thái</label>
                        <select
                          className="form-control"
                          value={formData.shippingStatus}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shippingStatus: e.target.value,
                            })
                          }
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Người nhận</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.receiverName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              receiverName: e.target.value,
                            })
                          }
                          required
                          disabled={!!editing}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Số điện thoại</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.receiverPhone}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              receiverPhone: e.target.value,
                            })
                          }
                          required
                          disabled={!!editing}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Địa chỉ giao hàng</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.shippingAddress}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingAddress: e.target.value,
                        })
                      }
                      required
                      disabled={!!editing}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Phí vận chuyển</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.shippingFee}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shippingFee: e.target.value,
                            })
                          }
                          min="0"
                          disabled={!!editing}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Đơn vị vận chuyển</label>
                        <select
                          className="form-control"
                          value={formData.carrierName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              carrierName: e.target.value,
                            })
                          }
                          disabled={!!editing}
                        >
                          <option value="">-- Chọn đơn vị vận chuyển --</option>
                          {CARRIER_OPTIONS.map((carrier) => (
                            <option key={carrier.value} value={carrier.value}>
                              {carrier.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Mã vận đơn</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.trackingCode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              trackingCode: e.target.value,
                            })
                          }
                          placeholder="Tự động: SHIP-{orderId}"
                          disabled={!!editing}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Ngày lấy hàng</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.shippedDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              shippedDate: e.target.value,
                            })
                          }
                          disabled={!!editing}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Ngày dự kiến</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.estimatedDeliveryDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              estimatedDeliveryDate: e.target.value,
                            })
                          }
                          disabled={!!editing}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Ngày giao thành công</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.deliveredDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              deliveredDate: e.target.value,
                            })
                          }
                          disabled={!!editing}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Ghi chú</label>
                    <textarea
                      className="form-control"
                      value={formData.note}
                      onChange={(e) =>
                        setFormData({ ...formData, note: e.target.value })
                      }
                      rows="2"
                      disabled={!!editing}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editing ? "Cập nhật" : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default ShippingsAdmin;
