import React, { useEffect, useState } from "react";
import { shippingApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const ShippingsAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [status, setStatus] = useState("");
  const [carrierName, setCarrierName] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    orderId: "",
    receiverName: "",
    receiverPhone: "",
    shippingAddress: "",
    shippingMethod: "",
    shippingStatus: "",
    shippingFee: 0,
    shippedDate: "",
    estimatedDeliveryDate: "",
    deliveredDate: "",
    trackingCode: "",
    carrierName: "",
    note: "",
  });

  const { isAdmin } = useAuth();

  const loadItems = async (nextPage = page) => {
    setLoading(true);
    try {
      const params = {
        page: nextPage,
        pageSize,
        status: status || undefined,
        carrierName: carrierName || undefined,
      };
      const response = await shippingApi.getAll(params);
      setItems(response.data.items || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalCount(response.data.totalCount || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await loadItems(1);
  };

  const openModal = (shipping = null) => {
    if (shipping) {
      setEditing(shipping);
      setFormData({
        orderId: shipping.orderId ?? "",
        receiverName: shipping.receiverName ?? "",
        receiverPhone: shipping.receiverPhone ?? "",
        shippingAddress: shipping.shippingAddress ?? "",
        shippingMethod: shipping.shippingMethod ?? "",
        shippingStatus: shipping.shippingStatus ?? "",
        shippingFee: shipping.shippingFee ?? 0,
        shippedDate: shipping.shippedDate
          ? new Date(shipping.shippedDate).toISOString().slice(0, 10)
          : "",
        estimatedDeliveryDate: shipping.estimatedDeliveryDate
          ? new Date(shipping.estimatedDeliveryDate).toISOString().slice(0, 10)
          : "",
        deliveredDate: shipping.deliveredDate
          ? new Date(shipping.deliveredDate).toISOString().slice(0, 10)
          : "",
        trackingCode: shipping.trackingCode ?? "",
        carrierName: shipping.carrierName ?? "",
        note: shipping.note ?? "",
      });
    } else {
      setEditing(null);
      setFormData({
        orderId: "",
        receiverName: "",
        receiverPhone: "",
        shippingAddress: "",
        shippingMethod: "",
        shippingStatus: "",
        shippingFee: 0,
        shippedDate: "",
        estimatedDeliveryDate: "",
        deliveredDate: "",
        trackingCode: "",
        carrierName: "",
        note: "",
      });
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
        orderId: parseInt(formData.orderId),
        receiverName: formData.receiverName,
        receiverPhone: formData.receiverPhone,
        shippingAddress: formData.shippingAddress,
        shippingMethod: formData.shippingMethod,
        shippingStatus: formData.shippingStatus,
        shippingFee: parseFloat(formData.shippingFee) || 0,
        shippedDate: formData.shippedDate || null,
        estimatedDeliveryDate: formData.estimatedDeliveryDate || null,
        deliveredDate: formData.deliveredDate || null,
        trackingCode: formData.trackingCode || null,
        carrierName: formData.carrierName || null,
        note: formData.note || null,
      };

      if (editing) {
        await shippingApi.update(editing.id, payload);
      } else {
        await shippingApi.create(payload);
      }

      closeModal();
      await loadItems(1);
      setPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shipping?")) return;
    try {
      await shippingApi.delete(id);
      await loadItems();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete shipping");
    }
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i += 1) {
      pages.push(
        <li key={i} className={`page-item ${page === i ? "active" : ""}`}>
          <button className="page-link" onClick={() => setPage(i)}>
            {i}
          </button>
        </li>
      );
    }
    return pages;
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0">Quản lý Vận chuyển</h1>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <form onSubmit={handleSearch} className="form-inline">
                <input
                  className="form-control mr-2"
                  placeholder="Trạng thái..."
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                />
                <input
                  className="form-control mr-2"
                  placeholder="Đơn vị vận chuyển..."
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                />
                <button className="btn btn-primary" type="submit">
                  <i className="fas fa-search"></i> Tìm kiếm
                </button>
              </form>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                  <div className="mt-2">Đang tải dữ liệu...</div>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="text-muted">Tổng số: <strong>{totalCount}</strong> vận đơn</span>
                    {isAdmin() && (
                      <button className="btn btn-success btn-sm" onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> Thêm Vận đơn
                      </button>
                    )}
                  </div>

                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>ID</th>
                        <th>Mã đơn</th>
                        <th>Người nhận</th>
                        <th>Trạng thái</th>
                        <th>Đơn vị VC</th>
                        <th>Phí VC</th>
                        <th>Mã vận đơn</th>
                        {isAdmin() && <th>Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin() ? 8 : 7} className="text-center py-4">
                            Không tìm thấy dữ liệu vận chuyển nào
                          </td>
                        </tr>
                      ) : (
                        items.map((s) => (
                          <tr key={s.id}>
                            <td>{s.id}</td>
                            <td><strong>#{s.orderId}</strong></td>
                            <td>{s.receiverName}</td>
                            <td>
                                <span className="badge badge-info">{s.shippingStatus}</span>
                            </td>
                            <td>{s.carrierName}</td>
                            <td>{s.shippingFee?.toLocaleString?.()} VND</td>
                            <td><code className="text-primary">{s.trackingCode}</code></td>
                            {isAdmin() && (
                              <td>
                                <button className="btn btn-sm btn-info mr-1" onClick={() => openModal(s)} title="Sửa">
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)} title="Xóa">
                                  <i className="fas fa-trash"></i>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="pagination-container">
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        <i className="fas fa-chevron-left"></i> Trước
                      </button>
                      <span className="mx-3 font-weight-bold">
                        {page} / {totalPages}
                      </span>
                      <button
                        className="btn btn-outline-secondary btn-sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Sau <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {showModal && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold">{editing ? "Cập nhật Vận đơn" : "Tạo Vận đơn mới"}</h5>
                <button type="button" className="close" onClick={closeModal}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Mã đơn hàng (OrderId)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.orderId}
                          onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                          required
                          placeholder="VD: 101"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Tên người nhận</label>
                        <input
                          className="form-control"
                          value={formData.receiverName}
                          onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                          placeholder="VD: Nguyễn Văn A"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Số điện thoại nhận</label>
                        <input
                          className="form-control"
                          value={formData.receiverPhone}
                          onChange={(e) => setFormData({ ...formData, receiverPhone: e.target.value })}
                          placeholder="09xx xxx xxx"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Địa chỉ giao hàng</label>
                        <input
                          className="form-control"
                          value={formData.shippingAddress}
                          onChange={(e) =>
                            setFormData({ ...formData, shippingAddress: e.target.value })
                          }
                          placeholder="Nhập địa chỉ nhận hàng..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Phương thức VC</label>
                        <input
                          className="form-control"
                          value={formData.shippingMethod}
                          onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value })}
                          placeholder="VD: Giao hàng nhanh"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Trạng thái vận chuyển</label>
                        <input
                          className="form-control"
                          value={formData.shippingStatus}
                          onChange={(e) => setFormData({ ...formData, shippingStatus: e.target.value })}
                          placeholder="VD: Đang giao"
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Phí vận chuyển (VND)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.shippingFee}
                          onChange={(e) => setFormData({ ...formData, shippingFee: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Ngày gửi hàng</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.shippedDate}
                          onChange={(e) => setFormData({ ...formData, shippedDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Dự kiến ngày giao</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.estimatedDeliveryDate}
                          onChange={(e) =>
                            setFormData({ ...formData, estimatedDeliveryDate: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="form-group">
                        <label>Ngày đã giao</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.deliveredDate}
                          onChange={(e) => setFormData({ ...formData, deliveredDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Mã vận đơn (Tracking Code)</label>
                        <input
                          className="form-control"
                          value={formData.trackingCode}
                          onChange={(e) => setFormData({ ...formData, trackingCode: e.target.value })}
                          placeholder="Nhập mã vận đơn từ nhà vận chuyển..."
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Đơn vị vận chuyển (Carrier)</label>
                        <input
                          className="form-control"
                          value={formData.carrierName}
                          onChange={(e) => setFormData({ ...formData, carrierName: e.target.value })}
                          placeholder="VD: GHTK, GHN, Viettel Post..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Ghi chú</label>
                    <textarea
                      className="form-control"
                      value={formData.note}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      rows="2"
                      placeholder="Nhập ghi chú vận chuyển nếu có..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editing ? "Lưu thay đổi" : "Tạo vận đơn"}
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

