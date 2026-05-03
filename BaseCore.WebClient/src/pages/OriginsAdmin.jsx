import React, { useEffect, useState } from "react";
import { originApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const OriginsAdmin = () => {
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
    name: "",
    description: "",
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

      const response = await originApi.getAll(params);
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

  const openModal = (origin = null) => {
    if (origin) {
      setEditing(origin);
      setFormData({
        name: origin.name || "",
        description: origin.description || "",
        isActive: !!origin.isActive,
      });
    } else {
      setEditing(null);
      setFormData({
        name: "",
        description: "",
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
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
      };

      if (editing) {
        await originApi.update(editing.id, payload);
      } else {
        await originApi.create(payload);
      }

      closeModal();
      await loadItems(1);
      setPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this origin?")) return;
    try {
      await originApi.delete(id);
      await loadItems();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete origin");
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
          <h1 className="m-0">Quản lý Xuất xứ</h1>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <form onSubmit={handleSearch} className="form-inline">
                <input
                  className="form-control mr-2"
                  placeholder="Tìm theo tên..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <select
                  className="form-control mr-2"
                  value={isActive}
                  onChange={(e) => setIsActive(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="true">Đang hoạt động</option>
                  <option value="false">Tạm khóa</option>
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
                    <span className="text-muted">Tổng số: <strong>{totalCount}</strong> bản ghi</span>
                    {isAdmin() && (
                      <button className="btn btn-success btn-sm" onClick={() => openModal()}>
                        <i className="fas fa-plus"></i> Thêm Xuất xứ
                      </button>
                    )}
                  </div>

                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>ID</th>
                        <th>Tên xuất xứ</th>
                        <th>Mô tả</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                        {isAdmin() && <th>Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin() ? 6 : 5} className="text-center py-4">
                            Không tìm thấy dữ liệu nào
                          </td>
                        </tr>
                      ) : (
                        items.map((o) => (
                          <tr key={o.id}>
                            <td>{o.id}</td>
                            <td className="font-weight-bold text-primary">{o.name}</td>
                            <td>{o.description}</td>
                            <td>
                                <span className={`badge ${o.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                    {o.isActive ? "Hoạt động" : "Tạm khóa"}
                                </span>
                            </td>
                            <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}</td>
                            {isAdmin() && (
                              <td>
                                <button className="btn btn-sm btn-info mr-1" onClick={() => openModal(o)} title="Sửa">
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(o.id)} title="Xóa">
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
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold">{editing ? "Cập nhật Xuất xứ" : "Thêm Xuất xứ mới"}</h5>
                <button type="button" className="close" onClick={closeModal}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="form-group">
                    <label>Tên xuất xứ</label>
                    <input
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="VD: Việt Nam, Mỹ, Nhật Bản..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Mô tả chi tiết</label>
                    <textarea
                      className="form-control"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Nhập mô tả chi tiết về xuất xứ..."
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <div className="custom-control custom-switch">
                      <input
                        type="checkbox"
                        className="custom-control-input"
                        id="isActiveOrigin"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <label className="custom-control-label" htmlFor="isActiveOrigin">Kích hoạt</label>
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
      {showModal && <div className="modal-backdrop fade show" />}
    </div>
  );
};

export default OriginsAdmin;

