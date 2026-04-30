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
          <h1 className="m-0">Origins Management</h1>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <form onSubmit={handleSearch} className="form-inline">
                <input
                  className="form-control mr-2"
                  placeholder="Search by name"
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
                      <button className="btn btn-success btn-sm" onClick={() => openModal()}>
                        Add Origin
                      </button>
                    )}
                  </div>

                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Active</th>
                        <th>Created At</th>
                        {isAdmin() && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin() ? 6 : 5} className="text-center">
                            No origins found
                          </td>
                        </tr>
                      ) : (
                        items.map((o) => (
                          <tr key={o.id}>
                            <td>{o.id}</td>
                            <td>{o.name}</td>
                            <td>{o.description}</td>
                            <td>{o.isActive ? "Active" : "Inactive"}</td>
                            <td>{o.createdAt ? new Date(o.createdAt).toLocaleString() : ""}</td>
                            {isAdmin() && (
                              <td>
                                <button className="btn btn-sm btn-info mr-1" onClick={() => openModal(o)}>
                                  Edit
                                </button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(o.id)}>
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
                <h5 className="modal-title">{editing ? "Edit Origin" : "Add Origin"}</h5>
                <button type="button" className="close" onClick={closeModal}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
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
                    <label className="mr-2">Active</label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
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
      {showModal && <div className="modal-backdrop fade show" />}
    </div>
  );
};

export default OriginsAdmin;

