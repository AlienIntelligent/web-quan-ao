import React, { useEffect, useMemo, useState } from "react";
import { productApi, reviewApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const ReviewsAdmin = () => {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [filterRating, setFilterRating] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const { isAdmin } = useAuth();

  const getCustomerName = (review) => {
    const name = review.userName || review.user?.name || review.user?.userName;
    if (!name || name === review.userId) return "Khách hàng";
    return name;
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const productsRes = await productApi.getAll({ page: 1, pageSize: 1000 });
      const products =
        productsRes.data?.items || productsRes.data?.data || productsRes.data || [];

      const reviewGroups = await Promise.all(
        products.map(async (product) => {
          try {
            const res = await reviewApi.getByProductId(product.id, {
              page: 1,
              pageSize: 1000,
            });
            const reviews = res.data?.items || [];
            return reviews.map((review) => ({
              ...review,
              productName: product.name,
            }));
          } catch {
            return [];
          }
        })
      );

      setAllItems(reviewGroups.flat());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return allItems.filter((item) => {
      const matchesKeyword =
        !normalizedKeyword ||
        `${item.productName || ""} ${item.comment || ""} ${item.userName || ""}`
          .toLowerCase()
          .includes(normalizedKeyword);

      const matchesRating =
        filterRating === "" || item.rating === Number(filterRating);

      return matchesKeyword && matchesRating;
    });
  }, [allItems, keyword, filterRating]);

  const totalCount = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const visibleItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      await reviewApi.delete(id);
      await loadItems();
    } catch (err) {
      alert(err.response?.data?.message || "Xóa thất bại");
    }
  };

  const openDetailModal = (review) => {
    setSelectedReview(review);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedReview(null);
  };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`fas fa-star ${i < rating ? "text-warning" : "text-muted"}`}
        style={{ fontSize: "12px" }}
      ></i>
    ));

  const renderPagination = () =>
    Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
      <li
        key={pageNumber}
        className={`page-item ${page === pageNumber ? "active" : ""}`}
      >
        <button className="page-link" onClick={() => setPage(pageNumber)}>
          {pageNumber}
        </button>
      </li>
    ));

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <div className="row mb-2">
            <div className="col-sm-6">
              <h1 className="m-0">Quản lý Đánh giá</h1>
            </div>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <form onSubmit={handleSearch} className="form-inline">
                <input
                  type="text"
                  className="form-control mr-2"
                  placeholder="Tìm theo sản phẩm, khách hàng, nội dung..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <select
                  className="form-control mr-2"
                  value={filterRating}
                  onChange={(e) => {
                    setFilterRating(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">Tất cả sao</option>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating} sao
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-search"></i> Tìm
                </button>
              </form>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                </div>
              ) : (
                <>
                  <table className="table table-bordered table-striped">
                    <thead>
                      <tr>
                        <th style={{ width: "60px" }}>ID</th>
                        <th>Sản phẩm</th>
                        <th>Khách hàng</th>
                        <th>Đánh giá</th>
                        <th>Nội dung</th>
                        <th>Ngày đăng</th>
                        {isAdmin() && <th style={{ width: "100px" }}>Thao tác</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleItems.length === 0 ? (
                        <tr>
                          <td colSpan={isAdmin() ? 7 : 6} className="text-center py-4">
                            Không tìm thấy đánh giá nào
                          </td>
                        </tr>
                      ) : (
                        visibleItems.map((review) => (
                          <tr key={review.id}>
                            <td>{review.id}</td>
                            <td>
                              <div>{review.productName || `SP #${review.productId}`}</div>
                              <small className="text-muted">#{review.productId}</small>
                            </td>
                            <td>{getCustomerName(review)}</td>
                            <td>
                              <div>{renderStars(review.rating)}</div>
                              <small className="text-muted">{review.rating}/5</small>
                            </td>
                            <td>
                              <div
                                style={{
                                  maxWidth: "280px",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                                title={review.comment || ""}
                              >
                                {review.comment || "-"}
                              </div>
                            </td>
                            <td>
                              <small>
                                {review.createdAt
                                  ? new Date(review.createdAt).toLocaleDateString("vi-VN")
                                  : "-"}
                              </small>
                            </td>
                            {isAdmin() && (
                              <td>
                                <button
                                  className="btn btn-sm btn-info mr-1"
                                  onClick={() => openDetailModal(review)}
                                  title="Xem chi tiết"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(review.id)}
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

                  <div className="admin-table-footer d-flex justify-content-between align-items-center mt-3 mx-2 pb-3">
                    <span>Tổng: {totalCount} đánh giá</span>
                    <nav>
                      <ul className="pagination mb-0">
                        <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => setPage((current) => Math.max(1, current - 1))}
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
                            onClick={() =>
                              setPage((current) => Math.min(totalPages, current + 1))
                            }
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

      {showDetailModal && selectedReview && (
        <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chi tiết đánh giá #{selectedReview.id}</h5>
                <button type="button" className="close" onClick={closeDetailModal}>
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Sản phẩm:</strong>
                    <div>{selectedReview.productName || `SP #${selectedReview.productId}`}</div>
                    <small className="text-muted">ID sản phẩm: {selectedReview.productId}</small>
                  </div>
                  <div className="col-md-6">
                    <strong>Khách hàng:</strong>
                    <div>{getCustomerName(selectedReview)}</div>
                    <small className="text-muted">{selectedReview.userId}</small>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Điểm đánh giá:</strong>
                    <div className="mt-1">
                      {renderStars(selectedReview.rating)}
                      <span className="ml-2 text-muted">{selectedReview.rating}/5</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <strong>Ngày đăng:</strong>
                    <div>
                      {selectedReview.createdAt
                        ? new Date(selectedReview.createdAt).toLocaleString("vi-VN")
                        : "-"}
                    </div>
                  </div>
                </div>
                <div className="form-group mb-0">
                  <label className="font-weight-bold">Nội dung đánh giá</label>
                  <textarea className="form-control" rows="5" value={selectedReview.comment || ""} readOnly />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeDetailModal}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showDetailModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default ReviewsAdmin;
