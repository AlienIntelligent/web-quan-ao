import React, { useEffect, useState } from "react";
import { cartDetailApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const CartDetailsAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [keyword, setKeyword] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    userId: "",
    productId: "",
    quantity: 1,
    unitPrice: 0,
    updatedAt: "",
  });

  const { isAdmin } = useAuth();

  const loadItems = async (nextPage = page) => {
    setLoading(true);
    try {
      const response = await cartDetailApi.getAll({
        keyword: keyword || undefined,
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
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await loadItems(1);
  };

  const openModal = (cd = null) => {
    if (cd) {
      setEditing(cd);
      setFormData({
        userId: cd.userId ?? "",
        productId: cd.productId ?? "",
        quantity: cd.quantity ?? 1,
        unitPrice: cd.unitPrice ?? 0,
        updatedAt: cd.updatedAt
          ? new Date(cd.updatedAt).toISOString().slice(0, 10)
          : "",
      });
    } else {
      setEditing(null);
      setFormData({
        userId: "",
        productId: "",
        quantity: 1,
        unitPrice: 0,
        updatedAt: "",
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
        userId: formData.userId,
        productId: parseInt(formData.productId),
        quantity: parseInt(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice) || 0,
        updatedAt: formData.updatedAt || null,
      };

      if (editing) await cartDetailApi.update(editing.id, payload);
      else await cartDetailApi.create(payload);

      closeModal();
      await loadItems(1);
      setPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chi tiết giỏ hàng này?"))
      return;
    try {
      await cartDetailApi.delete(id);
      await loadItems();
    } catch (err) {
      alert(err.response?.data?.message || "Xóa thất bại");
    }
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0 text-dark">Quản lý Giỏ hàng</h1>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header border-0 bg-white">
              <form onSubmit={handleSearch} className="form-inline">
                <div className="input-group">
                  <div className="input-group-prepend">
                    <span className="input-group-text bg-white">
                      <i className="fas fa-search"></i>
                    </span>
                  </div>
                  <input
                    className="form-control"
                    placeholder="Tìm theo Mã người dùng / Mã sản phẩm..."
                    style={{ width: "300px" }}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-primary ml-2 shadow-sm"
                  type="submit"
                >
                  Tìm kiếm
                </button>
              </form>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                  <div className="mt-2 text-muted">Đang tải dữ liệu...</div>
                </div>
              ) : (
                <>
                  <div className="px-4 py-3 d-flex justify-content-between align-items-center bg-light">
                    <span className="text-muted font-weight-bold">
                      Tổng số bản ghi: {totalCount}
                    </span>
                    {isAdmin() && (
                      <button
                        className="btn btn-success shadow-sm btn-sm"
                        onClick={() => openModal()}
                      >
                        <i className="fas fa-plus mr-1"></i> Thêm mới
                      </button>
                    )}
                  </div>

                  <table className="table table-hover table-valign-middle mb-0">
                    <thead className="thead-light">
                      <tr>
                        <th style={{ width: "80px" }}>ID</th>
                        <th>Khách hàng (User ID)</th>
                        <th>Sản phẩm</th>
                        <th className="text-center">Số lượng</th>
                        <th className="text-right">Đơn giá</th>
                        <th>Ngày cập nhật</th>
                        {isAdmin() && <th className="text-right">Hành động</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={isAdmin() ? 7 : 6}
                            className="text-center py-5"
                          >
                            <i className="fas fa-shopping-basket fa-3x text-muted mb-3 d-block"></i>
                            Không có dữ liệu giỏ hàng nào.
                          </td>
                        </tr>
                      ) : (
                        items.map((cd) => (
                          <tr key={cd.id}>
                            <td>
                              <strong>#{cd.id}</strong>
                            </td>
                            <td>
                              <div className="text-primary font-weight-bold">
                                {cd.userId}
                              </div>
                            </td>
                            <td>
                              <div className="font-weight-bold">
                                {cd.productName}
                              </div>
                              <small className="text-muted">
                                Mã SP: {cd.productId}
                              </small>
                            </td>
                            <td className="text-center">
                              <span className="badge badge-secondary p-2">
                                {cd.quantity}
                              </span>
                            </td>
                            <td className="text-right font-weight-bold">
                              {cd.unitPrice?.toLocaleString()} VND
                            </td>
                            <td>
                              <div className="small">
                                {cd.createdAt
                                  ? new Date(cd.createdAt).toLocaleDateString(
                                      "vi-VN",
                                    )
                                  : ""}
                              </div>
                              <small className="text-muted">
                                {cd.createdAt
                                  ? new Date(cd.createdAt).toLocaleTimeString(
                                      "vi-VN",
                                    )
                                  : ""}
                              </small>
                            </td>
                            {isAdmin() && (
                              <td className="text-right">
                                <button
                                  className="btn btn-sm btn-outline-info mr-2"
                                  onClick={() => openModal(cd)}
                                >
                                  <i className="fas fa-edit"></i> Sửa
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDelete(cd.id)}
                                >
                                  <i className="fas fa-trash"></i> Xóa
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div className="card-footer clearfix bg-white">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted small">
                        Trang {page} trên {totalPages}
                      </span>
                      <div className="pagination-container">
                        <button
                          className="btn btn-outline-secondary btn-sm mr-2"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
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

      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block" }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title font-weight-bold">
                  <i
                    className={`fas ${editing ? "fa-edit" : "fa-plus-circle"} mr-2`}
                  ></i>
                  {editing ? "Chỉnh sửa" : "Thêm mới"} Giỏ hàng tạm
                </h5>
                <button
                  type="button"
                  className="close text-white"
                  onClick={closeModal}
                >
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="form-group">
                    <label className="font-weight-bold">
                      Mã người dùng (User ID)
                    </label>
                    <input
                      className="form-control"
                      placeholder="VD: user123"
                      value={formData.userId}
                      onChange={(e) =>
                        setFormData({ ...formData, userId: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="font-weight-bold">
                      Mã sản phẩm (Product ID)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.productId}
                      onChange={(e) =>
                        setFormData({ ...formData, productId: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="font-weight-bold">Số lượng</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.quantity}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quantity: e.target.value,
                            })
                          }
                          required
                          min="1"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label className="font-weight-bold">Đơn giá</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.unitPrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              unitPrice: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="font-weight-bold">
                      Ngày cập nhật (Tùy chọn)
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.updatedAt}
                      onChange={(e) =>
                        setFormData({ ...formData, updatedAt: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary shadow-sm">
                    {editing ? "Cập nhật" : "Lưu lại"}
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

export default CartDetailsAdmin;
