import React, { useState, useEffect } from "react";
import { userApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [phoneKeyword, setPhoneKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    contact: "",
    position: "",
    userType: 0,
    isActive: true,
  });
  const [error, setError] = useState("");
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadUsers();
  }, [page, keyword, phoneKeyword, roleFilter, activeFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userApi.getAll({
        keyword,
        phone: phoneKeyword || undefined,
        userType: roleFilter === "" ? undefined : Number(roleFilter),
        isActive: activeFilter === "" ? undefined : activeFilter === "true",
        page,
        pageSize,
      });
      setUsers(response.data.items || response.data.data || []);
      setTotalPages(response.data.totalPages || 0);
      setTotalCount(response.data.totalCount || 0);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: "",
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        contact: user.contact || "",
        position: user.position || "",
        userType: user.userType || 0,
        isActive: user.isActive,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        name: "",
        email: "",
        phone: "",
        contact: "",
        position: "",
        userType: 0,
        isActive: true,
      });
    }
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editingUser) {
        const updateData = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          contact: formData.contact,
          position: formData.position,
          userType: parseInt(formData.userType),
          isActive: formData.isActive,
        };
        if (formData.password) updateData.password = formData.password;
        await userApi.update(editingUser.id, updateData);
      } else {
        if (!formData.password) {
          setError("Mật khẩu là bắt buộc");
          return;
        }
        await userApi.create({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          contact: formData.contact,
          position: formData.position,
          userType: parseInt(formData.userType),
        });
      }
      closeModal();
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    try {
      await userApi.delete(id);
      loadUsers();
    } catch (err) {
      alert("Xóa thất bại");
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await userApi.update(user.id, { ...user, isActive: !user.isActive });
      loadUsers();
    } catch (err) {
      alert("Cập nhật trạng thái thất bại");
    }
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <li key={i} className={`page-item ${page === i ? "active" : ""}`}>
          <button className="page-link" onClick={() => setPage(i)}>
            {i}
          </button>
        </li>,
      );
    }
    return pages;
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Quản lý Người dùng</h1>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <div className="row">
                <div className="col-md-9">
                  <form onSubmit={handleSearch} className="form-inline">
                    <input
                      type="text"
                      className="form-control mr-2"
                      placeholder="Tìm theo tên, email, SĐT..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-control mr-2"
                      placeholder="Tìm SĐT..."
                      value={phoneKeyword}
                      onChange={(e) => setPhoneKeyword(e.target.value)}
                    />
                    <select
                      className="form-control mr-2"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="">Tất cả vai trò</option>
                      <option value="1">Quản trị</option>
                      <option value="0">Khách hàng</option>
                    </select>
                    <select
                      className="form-control mr-2"
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value)}
                    >
                      <option value="">Tất cả trạng thái</option>
                      <option value="true">Hoạt động</option>
                      <option value="false">Tạm khóa</option>
                    </select>
                    <button type="submit" className="btn btn-primary">
                      <i className="fas fa-search"></i> Tìm
                    </button>
                  </form>
                </div>
                <div className="col-md-3 text-right">
                  <button
                    className="btn btn-success"
                    onClick={() => openModal()}
                  >
                    <i className="fas fa-plus"></i> Thêm Người dùng
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                </div>
              ) : (
                <>
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th>Tên đăng nhập</th>
                        <th>Họ tên</th>
                        <th>Email</th>
                        <th>Điện thoại</th>
                        <th>Ngày tạo</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th style={{ width: "160px" }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            Không tìm thấy người dùng nào
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <strong>{user.username}</strong>
                            </td>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                            <td>{user.phone}</td>
                            <td>
                              <small>
                                {user.created
                                  ? new Date(user.created).toLocaleDateString(
                                      "vi-VN",
                                    )
                                  : "-"}
                              </small>
                            </td>
                            <td>
                              <span
                                className={`badge ${user.userType === 1 ? "badge-danger" : "badge-info"}`}
                              >
                                {user.userType === 1
                                  ? "Quản trị"
                                  : "Khách hàng"}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge ${user.isActive ? "badge-success" : "badge-secondary"}`}
                              >
                                {user.isActive ? "Hoạt động" : "Tạm khóa"}
                              </span>
                            </td>
                            <td>
                              {!user.isActive && (
                                <button
                                  className="btn btn-sm btn-success mr-1"
                                  onClick={() => handleToggleActive(user)}
                                  title="Kích hoạt"
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                              )}
                              {user.isActive && (
                                <button
                                  className="btn btn-sm btn-warning mr-1"
                                  onClick={() => handleToggleActive(user)}
                                  title="Khóa"
                                >
                                  <i className="fas fa-ban"></i>
                                </button>
                              )}
                              <button
                                className="btn btn-sm btn-info mr-1"
                                onClick={() => openModal(user)}
                                title="Sửa"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(user.id)}
                                title="Xóa"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  <div className="d-flex justify-content-between align-items-center">
                    <span>Tổng: {totalCount} người dùng</span>
                    <nav>
                      <ul className="pagination mb-0">
                        <li
                          className={`page-item ${page === 1 ? "disabled" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setPage(page - 1)}
                          >
                            Trước
                          </button>
                        </li>
                        {renderPagination()}
                        <li
                          className={`page-item ${page === totalPages ? "disabled" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setPage(page + 1)}
                          >
                            Sau
                          </button>
                        </li>
                      </ul>
                    </nav>
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
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingUser ? "Sửa Người dùng" : "Thêm Người dùng"}
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
                        <label>Tên đăng nhập</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              username: e.target.value,
                            })
                          }
                          required
                          disabled={!!editingUser}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>
                          Mật khẩu {editingUser && "(để trống để giữ nguyên)"}
                        </label>
                        <input
                          type="password"
                          className="form-control"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          required={!editingUser}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Họ tên</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          className="form-control"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Điện thoại</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Liên hệ (Contact)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.contact}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              contact: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Chức vụ</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.position}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              position: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Vai trò</label>
                        <select
                          className="form-control"
                          value={formData.userType}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              userType: e.target.value,
                            })
                          }
                        >
                          <option value="0">Khách hàng</option>
                          <option value="1">Quản trị viên</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {editingUser && (
                    <div className="form-group">
                      <div className="custom-control custom-switch">
                        <input
                          type="checkbox"
                          className="custom-control-input"
                          id="isActiveUser"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isActive: e.target.checked,
                            })
                          }
                        />
                        <label
                          className="custom-control-label"
                          htmlFor="isActiveUser"
                        >
                          Kích hoạt tài khoản
                        </label>
                      </div>
                    </div>
                  )}
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
                    {editingUser ? "Cập nhật" : "Tạo mới"}
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

export default Users;
