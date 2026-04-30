import React, { useEffect, useState } from "react";
import { orderPromotionApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const OrderPromotionsAdmin = () => {
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
    orderId: "",
    promotionId: "",
    discountAmount: 0,
    appliedAt: "",
  });

  const { isAdmin } = useAuth();

  const loadItems = async (nextPage = page) => {
    setLoading(true);
    try {
      const response = await orderPromotionApi.getAll({
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

  const openModal = (op = null) => {
    if (op) {
      setEditing(op);
      setFormData({
        orderId: op.orderId ?? "",
        promotionId: op.promotionId ?? "",
        discountAmount: op.discountAmount ?? 0,
        appliedAt: op.appliedAt
          ? new Date(op.appliedAt).toISOString().slice(0, 10)
          : "",
      });
    } else {
      setEditing(null);
      setFormData({
        orderId: "",
        promotionId: "",
        discountAmount: 0,
        appliedAt: "",
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
        promotionId: parseInt(formData.promotionId),
        discountAmount: parseFloat(formData.discountAmount) || 0,
        appliedAt: formData.appliedAt || null,
      };

      if (editing) await orderPromotionApi.update(editing.id, payload);
      else await orderPromotionApi.create(payload);

      closeModal();
      await loadItems(1);
      setPage(1);
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this order promotion?")) return;
    try {
      await orderPromotionApi.delete(id);
      await loadItems();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
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
          <h1 className="m-0">Order Promotions Management</h1>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <form onSubmit={handleSearch} className="form-inline">
                <input
                  className="form-control mr-2"
                  placeholder="Keyword (OrderId / PromotionId)"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <button className="btn btn-primary" type="submit">
                  Search
                </button>
              </form>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">Loading...</div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>Total: {totalCount}</span>
                    {isAdmin() && (
                      <button className="btn btn-success btn-sm" onClick={() => openModal()}>
                        Add
                      </button>
                    )}
                  </div>

                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>OrderId</th>
                        <th>Promotion</th>
                        <th>Discount</th>
                        <th>AppliedAt</th>
                        {isAdmin() && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin() ? 6 : 5} className="text-center">
                            No data found
                          </td>
                        </tr>
                      ) : (
                        items.map((op) => (
                          <tr key={op.id}>
                            <td>{op.id}</td>
                            <td>{op.orderId}</td>
                            <td>
                              {op.promotionId} - {op.promotionCode} {op.promotionName ? `(${op.promotionName})` : ""}
                            </td>
                            <td>{op.discountAmount}</td>
                            <td>
                              {op.appliedAt ? new Date(op.appliedAt).toLocaleString() : ""}
                            </td>
                            {isAdmin() && (
                              <td>
                                <button className="btn btn-sm btn-info mr-1" onClick={() => openModal(op)}>
                                  Edit
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(op.id)}>
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
                        {page}/{totalPages}
                      </span>
                      <button
                        className="btn btn-outline-secondary btn-sm ml-2"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                    <ul className="pagination mb-0">{renderPagination()}</ul>
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
                <h5 className="modal-title">{editing ? "Edit" : "Add"} Order Promotion</h5>
                <button type="button" className="close" onClick={closeModal}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="form-group">
                    <label>OrderId</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.orderId}
                      onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>PromotionId</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.promotionId}
                      onChange={(e) => setFormData({ ...formData, promotionId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>DiscountAmount</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.discountAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, discountAmount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>AppliedAt (optional)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.appliedAt}
                      onChange={(e) => setFormData({ ...formData, appliedAt: e.target.value })}
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

export default OrderPromotionsAdmin;

