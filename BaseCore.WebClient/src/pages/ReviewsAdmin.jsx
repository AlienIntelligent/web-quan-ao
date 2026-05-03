import React, { useEffect, useMemo, useState } from "react";
import { productApi, reviewApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const ReviewsAdmin = () => {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    productId: "",
    userId: "",
    rating: 5,
    comment: "",
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.search({
        keyword: "",
        categoryId: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        page: 1,
        pageSize: 200,
      });

      const payload = res?.data || {};
      const items = payload?.items || [];
      setProducts(items);

      if (!selectedProductId && items.length > 0) {
        setSelectedProductId(String(items[0].id));
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async (pid, nextPage = page) => {
    if (!pid) return;
    setLoading(true);
    setError("");
    try {
      const res = await reviewApi.getByProductId(pid, {
        page: nextPage,
        pageSize,
      });
      const payload = res?.data || {};

      setReviews(Array.isArray(payload.items) ? payload.items : []);
      setTotalPages(payload.totalPages || 1);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProductId) loadReviews(selectedProductId, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId]);

  useEffect(() => {
    if (selectedProductId) loadReviews(selectedProductId, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => String(p.id) === String(selectedProductId)) || null;
  }, [products, selectedProductId]);

  const openModal = (r = null) => {
    setError("");
    setEditing(r);
    if (r) {
      setFormData({
        productId: String(r.productId ?? selectedProductId),
        userId: r.userId ?? "",
        rating: r.rating ?? 5,
        comment: r.comment ?? "",
      });
    } else {
      setFormData({
        productId: selectedProductId,
        userId: "",
        rating: 5,
        comment: "",
      });
    }
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
        productId: parseInt(formData.productId, 10),
        userId: formData.userId?.trim(),
        rating: parseInt(formData.rating, 10),
        comment: formData.comment ?? null,
      };

      if (!payload.productId) {
        setError("ProductId is required");
        return;
      }
      if (!payload.userId) {
        setError("UserId is required");
        return;
      }
      if (payload.rating < 1 || payload.rating > 5) {
        setError("Rating must be 1-5");
        return;
      }

      if (editing) {
        await reviewApi.update(editing.id, payload);
      } else {
        await reviewApi.create(payload);
      }

      closeModal();
      await loadReviews(selectedProductId, 1);
      setPage(1);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this review?")) return;
    try {
      await reviewApi.delete(id);
      await loadReviews(selectedProductId, page);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0 text-dark">Quản lý Đánh giá</h1>
          <div className="mt-2">
            <span className="text-muted">
              {selectedProduct ? `Sản phẩm: ${selectedProduct.name}` : "Vui lòng chọn một sản phẩm"}
            </span>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="card">
            <div className="card-header">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <div className="form-group mb-0">
                    <label className="mr-2">Lọc theo sản phẩm:</label>
                    <select
                      className="form-control"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6 text-right">
                  {isAdmin() && (
                    <button
                      className="btn btn-success"
                      disabled={!selectedProductId}
                      onClick={() => openModal(null)}
                    >
                      <i className="fas fa-plus"></i> Thêm Đánh giá
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" />
                  <div className="mt-2">Đang tải dữ liệu...</div>
                </div>
              ) : (
                <>
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>ID</th>
                        <th>Mã khách hàng</th>
                        <th>Xếp hạng</th>
                        <th>Nội dung bình luận</th>
                        <th>Ngày tạo</th>
                        {isAdmin() && <th style={{ width: '150px' }}>Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin() ? 6 : 5} className="text-center py-4">
                            Sản phẩm này chưa có đánh giá nào
                          </td>
                        </tr>
                      ) : (
                        reviews.map((r) => (
                          <tr key={r.id}>
                            <td>{r.id}</td>
                            <td className="font-weight-bold">{r.userId}</td>
                            <td>
                                <span className="text-warning">
                                    {[...Array(r.rating)].map((_, i) => <i key={i} className="fas fa-star"></i>)}
                                    {[...Array(5 - r.rating)].map((_, i) => <i key={i} className="far fa-star"></i>)}
                                </span>
                            </td>
                            <td style={{ maxWidth: 420 }}>
                              {r.comment ?? ""}
                            </td>
                            <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
                            {isAdmin() && (
                              <td>
                                <button
                                  className="btn btn-sm btn-info mr-1"
                                  onClick={() => openModal(r)}
                                  title="Sửa"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(r.id)}
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
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title font-weight-bold">{editing ? "Cập nhật Đánh giá" : "Thêm Đánh giá mới"}</h5>
                <button type="button" className="close" onClick={closeModal}>
                  <span>&times;</span>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}

                  <div className="form-group">
                    <label>Sản phẩm (Mã ID)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.productId}
                      onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      required
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label>Mã khách hàng / Tên đăng nhập</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      required
                      placeholder="VD: user_01"
                    />
                  </div>

                  <div className="form-group">
                    <label>Xếp hạng (1 - 5 sao)</label>
                    <select
                      className="form-control"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      required
                    >
                        <option value="5">5 sao - Tuyệt vời</option>
                        <option value="4">4 sao - Tốt</option>
                        <option value="3">3 sao - Bình thường</option>
                        <option value="2">2 sao - Kém</option>
                        <option value="1">1 sao - Tệ</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Nội dung bình luận</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      placeholder="Nhập nội dung đánh giá của khách hàng..."
                    />
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

export default ReviewsAdmin;

