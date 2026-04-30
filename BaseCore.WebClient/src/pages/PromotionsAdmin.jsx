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
          <h1 className="m-0">Promotions Management</h1>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <form onSubmit={handleSearch} className="form-inline">
                <input
                  className="form-control mr-2"
                  placeholder="Search by code/name"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <select
                  className="form-control mr-2"
                  value={isActive}
                  onChange={(e) => setIsActive(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
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
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => openModal()}
                      >
                        Add Promotion
                      </button>
                    )}
                  </div>

                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Discount</th>
                        <th>Active</th>
                        <th>Start</th>
                        <th>End</th>
                        {isAdmin() && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin() ? 8 : 7} className="text-center">
                            No promotions found
                          </td>
                        </tr>
                      ) : (
                        items.map((p) => (
                          <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.code}</td>
                            <td>{p.name}</td>
                            <td>
                              {p.discountType} {p.discountValue}
                            </td>
                            <td>{p.isActive ? "Active" : "Inactive"}</td>
                            <td>{p.startDate ? new Date(p.startDate).toLocaleDateString() : ""}</td>
                            <td>{p.endDate ? new Date(p.endDate).toLocaleDateString() : ""}</td>
                            {isAdmin() && (
                              <td>
                                <button
                                  className="btn btn-sm btn-info mr-1"
                                  onClick={() => openModal(p)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(p.id)}
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
                <h5 className="modal-title">
                  {editing ? "Edit Promotion" : "Add Promotion"}
                </h5>
                <button type="button" className="close" onClick={closeModal}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}

                  <div className="form-group">
                    <label>Code</label>
                    <input
                      className="form-control"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input
                      className="form-control"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount Type</label>
                    <input
                      className="form-control"
                      value={formData.discountType}
                      onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Discount Value</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.discountValue}
                      onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Minimum Order Amount</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.minimumOrderAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, minimumOrderAmount: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Maximum Discount Amount</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.maximumDiscountAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, maximumDiscountAmount: e.target.value })
                      }
                      placeholder="(optional)"
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Usage Limit</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.usageLimit}
                      onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                      placeholder="(optional)"
                    />
                  </div>
                  <div className="form-group">
                    <div className="custom-control custom-switch">
                      <input
                        type="checkbox"
                        className="custom-control-input"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <label className="custom-control-label" htmlFor="isActive">
                        Active
                      </label>
                    </div>
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

export default PromotionsAdmin;

