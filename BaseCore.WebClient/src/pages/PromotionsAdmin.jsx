import React, { useEffect, useState } from "react";
import { promotionApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const PromotionsAdmin = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [keyword, setKeyword] = useState("");
  const [isActive, setIsActive] = useState(""); // '', 'true', 'false'

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discountType: "PERCENT",
    discountValue: 0,
    minimumOrderAmount: 0,
    maximumDiscountAmount: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
    isActive: true,
  });

  const { isAdmin } = useAuth();

  const loadItems = async (nextPage = page) => {
    setLoading(true);
    try {
      const params = {
        keyword: keyword || undefined,
        page: nextPage,
        pageSize,
      };
      if (isActive !== "") params.isActive = isActive === "true";

      const response = await promotionApi.getAll(params);
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

  const openModal = (promotion = null) => {
    if (promotion) {
      setEditing(promotion);
      setFormData({
        code: promotion.code || "",
        name: promotion.name || "",
        description: promotion.description || "",
        discountType: promotion.discountType || "PERCENT",
        discountValue: promotion.discountValue || 0,
        minimumOrderAmount: promotion.minimumOrderAmount || 0,
        maximumDiscountAmount:
          promotion.maximumDiscountAmount ?? "",
        startDate: promotion.startDate
          ? new Date(promotion.startDate).toISOString().slice(0, 10)
          : "",
        endDate: promotion.endDate
          ? new Date(promotion.endDate).toISOString().slice(0, 10)
          : "",
        usageLimit: promotion.usageLimit ?? "",
        isActive: !!promotion.isActive,
      });
    } else {
      setEditing(null);
      setFormData({
        code: "",
        name: "",
        description: "",
        discountType: "PERCENT",
        discountValue: 0,
        minimumOrderAmount: 0,
        maximumDiscountAmount: "",
        startDate: "",
        endDate: "",
        usageLimit: "",
        isActive: true,
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
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        discountType: formData.discountType,
        discountValue: parseFloat(formData.discountValue) || 0,
        minimumOrderAmount: parseFloat(formData.minimumOrderAmount) || 0,
        maximumDiscountAmount:
          formData.maximumDiscountAmount === ""
            ? null
            : parseFloat(formData.maximumDiscountAmount),
        startDate: formData.startDate ? formData.startDate : null,
        endDate: formData.endDate ? formData.endDate : null,
        usageLimit:
          formData.usageLimit === "" ? null : parseInt(formData.usageLimit),
        isActive: formData.isActive,
      };

      if (editing) {
        await promotionApi.update(editing.id, payload);
      } else {
        await promotionApi.create(payload);
      }

      closeModal();
      await loadItems(1);
      setPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;
    try {
      await promotionApi.delete(id);
      await loadItems();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete promotion");
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
          <h1 className="m-0 text-dark">Quản lý Khuyến mãi</h1>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <form onSubmit={handleSearch} className="form-inline">
                <input
                  className="form-control mr-2"
                  placeholder="Tìm theo mã hoặc tên..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <select
                  className="form-control mr-2"
                  value={isActive}
                  onChange={(e) => setIsActive(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="true">Đang kích hoạt</option>
                  <option value="false">Đang tạm dừng</option>
                </select>
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
                    <span className="text-muted">Tổng số: <strong>{totalCount}</strong> chương trình</span>
                    {isAdmin() && (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => openModal()}
                      >
                        <i className="fas fa-plus"></i> Thêm Khuyến mãi
                      </button>
                    )}
                  </div>

                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>ID</th>
                        <th>Mã KM</th>
                        <th>Tên chương trình</th>
                        <th>Mức giảm</th>
                        <th>Trạng thái</th>
                        <th>Bắt đầu</th>
                        <th>Kết thúc</th>
                        {isAdmin() && <th style={{ width: '150px' }}>Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin() ? 8 : 7} className="text-center py-4">
                            Không tìm thấy chương trình khuyến mãi nào
                          </td>
                        </tr>
                      ) : (
                        items.map((p) => (
                          <tr key={p.id}>
                            <td>{p.id}</td>
                            <td><span className="badge badge-primary px-2 py-1">{p.code}</span></td>
                            <td className="font-weight-bold">{p.name}</td>
                            <td>
                              <span className="text-danger font-weight-bold">
                                {p.discountType === 'PERCENT' ? `${p.discountValue}%` : `${p.discountValue?.toLocaleString()} VND`}
                              </span>
                            </td>
                            <td>
                                <span className={`badge ${p.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                    {p.isActive ? "Đang chạy" : "Tạm dừng"}
                                </span>
                            </td>
                            <td>{p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : "-"}</td>
                            <td>{p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : "-"}</td>
                            {isAdmin() && (
                              <td>
                                <button
                                  className="btn btn-sm btn-info mr-1"
                                  onClick={() => openModal(p)}
                                  title="Sửa"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(p.id)}
                                  title="Xóa"
                                >
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
                        Trang {page} / {totalPages}
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
                <h5 className="modal-title font-weight-bold">
                  {editing ? "Cập nhật Khuyến mãi" : "Tạo Khuyến mãi mới"}
                </h5>
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
                        <label>Mã khuyến mãi (Code)</label>
                        <input
                          className="form-control"
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          required
                          placeholder="VD: GIAM20, TET2024..."
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Tên chương trình</label>
                        <input
                          className="form-control"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="VD: Khuyến mãi Tết Nguyên Đán"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Mô tả chi tiết</label>
                    <textarea
                      className="form-control"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Nhập nội dung khuyến mãi..."
                      rows="2"
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Loại giảm giá</label>
                        <select
                          className="form-control"
                          value={formData.discountType}
                          onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                        >
                            <option value="PERCENT">Phần trăm (%)</option>
                            <option value="AMOUNT">Số tiền cố định (VND)</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Giá trị giảm</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.discountValue}
                          onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                          placeholder="VD: 20 hoặc 50000"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Giá trị đơn hàng tối thiểu</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.minimumOrderAmount}
                          onChange={(e) =>
                            setFormData({ ...formData, minimumOrderAmount: e.target.value })
                          }
                          placeholder="VD: 200000"
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Số tiền giảm tối đa (Nếu chọn %)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.maximumDiscountAmount}
                          onChange={(e) =>
                            setFormData({ ...formData, maximumDiscountAmount: e.target.value })
                          }
                          placeholder="Bỏ trống nếu không giới hạn"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Ngày bắt đầu</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Ngày kết thúc</label>
                        <input
                          type="date"
                          className="form-control"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Giới hạn số lần sử dụng</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.usageLimit}
                          onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                          placeholder="Bỏ trống nếu không giới hạn"
                        />
                      </div>
                    </div>
                    <div className="col-md-6 d-flex align-items-center mt-3">
                      <div className="custom-control custom-switch">
                        <input
                          type="checkbox"
                          className="custom-control-input"
                          id="isActivePromo"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label className="custom-control-label" htmlFor="isActivePromo">
                          Kích hoạt chương trình
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Hủy bỏ
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editing ? "Lưu thay đổi" : "Tạo ngay"}
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

export default PromotionsAdmin;

