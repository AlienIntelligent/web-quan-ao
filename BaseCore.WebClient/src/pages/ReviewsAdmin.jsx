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
          <h1 className="m-0">Reviews Management</h1>
          <div className="mt-2">
            <small>
              {selectedProduct ? `Product: ${selectedProduct.name}` : "Select a product"}
            </small>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="card">
            <div className="card-header">
              <div className="row">
                <div className="col-md-6">
                  <label>Product</label>
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
                <div className="col-md-6 text-right d-flex align-items-end justify-content-end">
                  {isAdmin() && (
                    <button
                      className="btn btn-success"
                      disabled={!selectedProductId}
                      onClick={() => openModal(null)}
                    >
                      <i className="fas fa-plus"></i> Add Review
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" />
                </div>
              ) : (
                <>
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>UserId</th>
                        <th>Rating</th>
                        <th>Comment</th>
                        <th>CreatedAt</th>
                        {isAdmin() && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin() ? 6 : 5} className="text-center">
                            No data
                          </td>
                        </tr>
                      ) : (
                        reviews.map((r) => (
                          <tr key={r.id}>
                            <td>{r.id}</td>
                            <td>{r.userId}</td>
                            <td>{r.rating}</td>
                            <td style={{ maxWidth: 420 }}>
                              {r.comment ?? ""}
                            </td>
                            <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}</td>
                            {isAdmin() && (
                              <td>
                                <button
                                  className="btn btn-sm btn-info mr-1"
                                  onClick={() => openModal(r)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(r.id)}
                                >
                                  Delete
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <button
                        className="btn btn-outline-secondary btn-sm mr-2"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Prev
                      </button>
                      <span>
                        Page {page}/{totalPages}
                      </span>
                      <button
                        className="btn btn-outline-secondary btn-sm ml-2"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
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
                <h5 className="modal-title">{editing ? "Edit Review" : "Add Review"}</h5>
                <button type="button" className="close" onClick={closeModal}>
                  <span>&times;</span>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}

                  <div className="form-group">
                    <label>ProductId</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.productId}
                      onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>UserId</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Rating (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      className="form-control"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Comment</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editing ? "Update" : "Create"}
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

