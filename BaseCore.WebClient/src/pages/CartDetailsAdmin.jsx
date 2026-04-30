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
        updatedAt: cd.updatedAt ? new Date(cd.updatedAt).toISOString().slice(0, 10) : "",
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
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this cart detail?")) return;
    try {
      await cartDetailApi.delete(id);
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
          <h1 className="m-0">Cart Details Management</h1>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <form onSubmit={handleSearch} className="form-inline">
                <input
                  className="form-control mr-2"
                  placeholder="Keyword (UserId contains / ProductId)"
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
                        <th>UserId</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>UnitPrice</th>
                        <th>CreatedAt</th>
                        {isAdmin() && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin() ? 8 : 7} className="text-center">
                            No data found
                          </td>
                        </tr>
                      ) : (
                        items.map((cd) => (
                          <tr key={cd.id}>
                            <td>{cd.id}</td>
                            <td>{cd.userId}</td>
                            <td>
                              {cd.productId} - {cd.productName}
                            </td>
                            <td>{cd.quantity}</td>
                            <td>{cd.unitPrice}</td>
                            <td>{cd.createdAt ? new Date(cd.createdAt).toLocaleString() : ""}</td>
                            {isAdmin() && (
                              <td>
                                <button className="btn btn-sm btn-info mr-1" onClick={() => openModal(cd)}>
                                  Edit
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cd.id)}>
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
                <h5 className="modal-title">{editing ? "Edit" : "Add"} Cart Detail</h5>
                <button type="button" className="close" onClick={closeModal}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="form-group">
                    <label>UserId</label>
                    <input
                      className="form-control"
                      value={formData.userId}
                      onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                      required
                    />
                  </div>
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
                    <label>Quantity</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>UnitPrice</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>UpdatedAt (optional)</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.updatedAt}
                      onChange={(e) => setFormData({ ...formData, updatedAt: e.target.value })}
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

export default CartDetailsAdmin;

