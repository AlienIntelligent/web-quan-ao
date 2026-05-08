import React, { useEffect, useState } from 'react';
import { cartDetailApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CartDetailsAdmin = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        userId: '', productId: '', quantity: 1, unitPrice: 0, updatedAt: '',
    });
    const [error, setError] = useState('');
    const { isAdmin } = useAuth();

    const loadItems = async (nextPage = page) => {
        setLoading(true);
        try {
            const res = await cartDetailApi.getAll({ keyword: keyword || undefined, page: nextPage, pageSize });
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

    const openModal = (cd = null) => {
        if (cd) {
            setEditing(cd);
            setFormData({
                userId: cd.userId ?? '', productId: cd.productId ?? '',
                quantity: cd.quantity ?? 1, unitPrice: cd.unitPrice ?? 0,
                updatedAt: cd.updatedAt ? new Date(cd.updatedAt).toISOString().slice(0, 10) : '',
            });
        } else {
            setEditing(null);
            setFormData({ userId: '', productId: '', quantity: 1, unitPrice: 0, updatedAt: '' });
        }
        setError('');
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditing(null); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
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
            setError(err.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa mục giỏ hàng này?')) return;
        try {
            await cartDetailApi.delete(id);
            await loadItems();
        } catch (err) {
            alert(err.response?.data?.message || 'Xóa thất bại');
        }
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
                            <h1 className="m-0">Quản lý Giỏ hàng</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header">
                            <div className="row">
                                <div className="col-md-8">
                                    <form onSubmit={handleSearch} className="form-inline">
                                        <input
                                            type="text"
                                            className="form-control mr-2"
                                            placeholder="Tìm theo User ID hoặc Sản phẩm..."
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                        />
                                        <button type="submit" className="btn btn-primary">
                                            <i className="fas fa-search"></i> Tìm
                                        </button>
                                    </form>
                                </div>
                                <div className="col-md-4 text-right">
                                    {isAdmin() && (
                                        <button className="btn btn-success" onClick={() => openModal()}>
                                            <i className="fas fa-plus"></i> Thêm mới
                                        </button>
                                    )}
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
                                                <th>Khách hàng (User ID)</th>
                                                <th>Sản phẩm</th>
                                                <th className="text-center">Số lượng</th>
                                                <th className="text-right">Đơn giá</th>
                                                <th className="text-right">Thành tiền</th>
                                                <th>Cập nhật</th>
                                                {isAdmin() && <th style={{ width: '120px' }}>Thao tác</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isAdmin() ? 8 : 7} className="text-center py-4">
                                                        Không có dữ liệu giỏ hàng nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                items.map(cd => (
                                                    <tr key={cd.id}>
                                                        <td>{cd.id}</td>
                                                        <td>
                                                            <code>{cd.userId}</code>
                                                        </td>
                                                        <td>
                                                            <div>{cd.productName || `SP #${cd.productId}`}</div>
                                                            <small className="text-muted">Mã: {cd.productId}</small>
                                                        </td>
                                                        <td className="text-center">
                                                            <span className="badge badge-secondary">{cd.quantity}</span>
                                                        </td>
                                                        <td className="text-right">{Number(cd.unitPrice).toLocaleString()} đ</td>
                                                        <td className="text-right">
                                                            <strong className="text-danger">
                                                                {(cd.quantity * cd.unitPrice).toLocaleString()} đ
                                                            </strong>
                                                        </td>
                                                        <td>
                                                            <small>{cd.createdAt ? new Date(cd.createdAt).toLocaleDateString('vi-VN') : '-'}</small>
                                                        </td>
                                                        {isAdmin() && (
                                                            <td>
                                                                <button className="btn btn-sm btn-info mr-1" onClick={() => openModal(cd)} title="Sửa">
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(cd.id)} title="Xóa">
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
                                        <span>Tổng: {totalCount} bản ghi</span>
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

            {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{editing ? 'Sửa Giỏ hàng' : 'Thêm Giỏ hàng'}</h5>
                                <button type="button" className="close" onClick={closeModal}><span>&times;</span></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger">{error}</div>}
                                    <div className="form-group">
                                        <label>Mã người dùng (User ID)</label>
                                        <input type="text" className="form-control" value={formData.userId}
                                            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                            required placeholder="VD: user123..." />
                                    </div>
                                    <div className="form-group">
                                        <label>Mã sản phẩm (Product ID)</label>
                                        <input type="number" className="form-control" value={formData.productId}
                                            onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                                            required />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Số lượng</label>
                                                <input type="number" className="form-control" value={formData.quantity}
                                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                                    required min="1" />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Đơn giá (đ)</label>
                                                <input type="number" className="form-control" value={formData.unitPrice}
                                                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                                                    required min="0" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Ngày cập nhật</label>
                                        <input type="date" className="form-control" value={formData.updatedAt}
                                            onChange={(e) => setFormData({ ...formData, updatedAt: e.target.value })} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                                    <button type="submit" className="btn btn-primary">{editing ? 'Cập nhật' : 'Tạo mới'}</button>
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
