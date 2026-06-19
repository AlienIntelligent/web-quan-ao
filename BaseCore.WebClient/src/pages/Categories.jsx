import React, { useState, useEffect, useMemo } from "react";
import { categoryApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const normalizeSearchValue = (value = "") =>
  String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const keyword = normalizeSearchValue(appliedSearchTerm.trim());

    if (!keyword) return categories;

    return categories.filter((category, index) =>
      [index + 1, category.id, category.name, category.description].some(
        (value) => normalizeSearchValue(value).includes(keyword),
      ),
    );
  }, [categories, appliedSearchTerm]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setAppliedSearchTerm(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setAppliedSearchTerm("");
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setEditingCategory(null);
      setFormData({ name: "", description: "" });
    }
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingCategory) {
        await categoryApi.update(editingCategory.id, {
          id: editingCategory.id,
          ...formData,
        });
      } else {
        await categoryApi.create(formData);
      }
      closeModal();
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      await categoryApi.delete(id);
      loadCategories();
    } catch (err) {
      alert("Xóa thất bại. Danh mục có thể đang được sử dụng.");
    }
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Quản lý Danh mục</h1>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <div className="row align-items-center">
                <form className="row mt-3" onSubmit={handleSearch}>
                  <div className="col-md-8">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Tìm theo tên, mô tả hoặc số thứ tự..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <div className="input-group-append">
                        <button type="submit" className="btn btn-primary">
                          <i className="fas fa-search"></i> Tìm
                        </button>
                        {appliedSearchTerm && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleClearSearch}
                          >
                            <i className="fas fa-times"></i> Xóa lọc
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
                <div className="col-md-6 text-right">
                  {isAdmin() && (
                    <button
                      className="btn btn-success"
                      onClick={() => openModal()}
                    >
                      <i className="fas fa-plus"></i> Thêm Danh mục
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                </div>
              ) : (
                <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>ID</th>
                      <th>Tên danh mục</th>
                      <th>Mô tả</th>
                      {isAdmin() && (
                        <th style={{ width: "120px" }}>Thao tác</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isAdmin() ? 4 : 3}
                          className="text-center py-4"
                        >
                          Không tìm thấy danh mục nào
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((category) => (
                        <tr key={category.id}>
                          <td>{category.id}</td>
                          <td>{category.name}</td>
                          <td>{category.description}</td>
                          {isAdmin() && (
                            <td>
                              <button
                                className="btn btn-sm btn-info mr-1"
                                onClick={() => openModal(category)}
                                title="Sửa"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(category.id)}
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
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingCategory ? "Sửa Danh mục" : "Thêm Danh mục"}
                </h5>
                <button type="button" className="close" onClick={closeModal}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="form-group">
                    <label>Tên danh mục</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="Nhập tên danh mục..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Mô tả</label>
                    <textarea
                      className="form-control"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows="3"
                      placeholder="Nhập mô tả..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingCategory ? "Cập nhật" : "Tạo mới"}
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

export default Categories;
