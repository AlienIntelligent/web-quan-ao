import React, { useEffect, useState } from 'react';
import { reviewApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ReviewsAdmin = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [filterApproved, setFilterApproved] = useState('');
    const [filterRating, setFilterRating] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const { isAdmin } = useAuth();

    const loadItems = async (nextPage = page) => {
        setLoading(true);
        try {
            const params = { keyword: keyword || undefined, page: nextPage, pageSize };
            if (filterApproved !== '') params.isApproved = filterApproved === 'true';
            if (filterRating !== '') params.rating = parseInt(filterRating);
            const res = await reviewApi.getAll(params);
            setItems(res.data.items || []);
            setTotalPages(res.data.totalPages || 1);
            setTotalCount(res.data.totalCount || 0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadItems(); }, [page]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setPage(1);
        await loadItems(1);
    };

    const handleApprove = async (id, isApproved) => {
        try {
            await reviewApi.update(id, { isApproved });
            await loadItems();
        } catch (err) {
            alert(err.response?.data?.message || 'Cập nhật thất bại');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
        try {
            await reviewApi.delete(id);
            await loadItems();
        } catch (err) {
            alert(err.response?.data?.message || 'Xóa thất bại');
        }
    };

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, i) => (
            <i key={i} className={`fas fa-star ${i < rating ? 'text-warning' : 'text-muted'}`} style={{ fontSize: '12px' }}></i>
        ));
    };

    const renderPagination = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(i)}>{i}</button>
                </li>
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
                            <h1 className="m-0">Quản lý Đánh giá</h1>
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
                                            placeholder="Tìm theo sản phẩm, nội dung..."
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                        />
                                        <select
                                            className="form-control mr-2"
                                            value={filterApproved}
                                            onChange={(e) => setFilterApproved(e.target.value)}
                                        >
                                            <option value="">Tất cả trạng thái</option>
                                            <option value="true">Đã duyệt</option>
                                            <option value="false">Chờ duyệt</option>
                                        </select>
                                        <select
                                            className="form-control mr-2"
                                            value={filterRating}
                                            onChange={(e) => setFilterRating(e.target.value)}
                                        >
                                            <option value="">Tất cả sao</option>
                                            {[5, 4, 3, 2, 1].map(r => (
                                                <option key={r} value={r}>{r} sao</option>
                                            ))}
                                        </select>
                                        <button type="submit" className="btn btn-primary">
                                            <i className="fas fa-search"></i> Tìm
                                        </button>
                                    </form>
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
                                                <th style={{ width: '60px' }}>ID</th>
                                                <th>Sản phẩm</th>
                                                <th>Khách hàng</th>
                                                <th>Đánh giá</th>
                                                <th>Nội dung</th>
                                                <th>Ngày đăng</th>
                                                <th>Trạng thái</th>
                                                {isAdmin() && <th style={{ width: '140px' }}>Thao tác</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isAdmin() ? 8 : 7} className="text-center py-4">
                                                        Không tìm thấy đánh giá nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                items.map(r => (
                                                    <tr key={r.id}>
                                                        <td>{r.id}</td>
                                                        <td>
                                                            <div>{r.productName || `SP #${r.productId}`}</div>
                                                            <small className="text-muted">#{r.productId}</small>
                                                        </td>
                                                        <td>
                                                            <small>{r.userId?.substring(0, 12)}...</small>
                                                        </td>
                                                        <td>
                                                            <div>{renderStars(r.rating)}</div>
                                                            <small className="text-muted">{r.rating}/5</small>
                                                        </td>
                                                        <td>
                                                            <div style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {r.comment}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <small>{r.reviewDate ? new Date(r.reviewDate).toLocaleDateString('vi-VN') : '-'}</small>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${r.isApproved ? 'badge-success' : 'badge-warning'}`}>
                                                                {r.isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                                                            </span>
                                                        </td>
                                                        {isAdmin() && (
                                                            <td>
                                                                {!r.isApproved ? (
                                                                    <button className="btn btn-sm btn-success mr-1"
                                                                        onClick={() => handleApprove(r.id, true)} title="Duyệt">
                                                                        <i className="fas fa-check"></i>
                                                                    </button>
                                                                ) : (
                                                                    <button className="btn btn-sm btn-warning mr-1"
                                                                        onClick={() => handleApprove(r.id, false)} title="Hủy duyệt">
                                                                        <i className="fas fa-times"></i>
                                                                    </button>
                                                                )}
                                                                <button className="btn btn-sm btn-danger"
                                                                    onClick={() => handleDelete(r.id)} title="Xóa">
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <span>Tổng: {totalCount} đánh giá</span>
                                        <nav>
                                            <ul className="pagination mb-0">
                                                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                                    <button className="page-link" onClick={() => setPage(page - 1)}>Trước</button>
                                                </li>
                                                {renderPagination()}
                                                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                                    <button className="page-link" onClick={() => setPage(page + 1)}>Sau</button>
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
        </div>
    );
};

export default ReviewsAdmin;
