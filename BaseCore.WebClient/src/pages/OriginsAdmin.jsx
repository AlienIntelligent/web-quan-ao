import React, { useEffect, useState } from 'react';
import { originApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const OriginsAdmin = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [error, setError] = useState('');
    const { isAdmin } = useAuth();

    const loadItems = async (nextPage = page) => {
        setLoading(true);
        try {
            const res = await originApi.getAll({ keyword: keyword || undefined, page: nextPage, pageSize });
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

    const openModal = (origin = null) => {
        if (origin) {
            setEditing(origin);
            setFormData({ name: origin.name || '', description: origin.description || '' });
        } else {
            setEditing(null);
            setFormData({ name: '', description: '' });
        }
        setError('');
        setShowModal(true);
    };

    const closeModal = () => { setShowModal(false); setEditing(null); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const payload = { ...formData, isActive: true };
            if (editing) await originApi.update(editing.id, payload);
            else await originApi.create(payload);
            closeModal();
            await loadItems(1);
            setPage(1);
        } catch (err) {
            setError(err.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa xuất xứ này?')) return;
        try {
            await originApi.delete(id);
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
                            <h1 className="m-0">Quản lý Xuất xứ</h1>
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
                                            placeholder="Tìm theo tên..."
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
                                            <i className="fas fa-plus"></i> Thêm Xuất xứ
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
                                                <th style={{ width: '80px' }}>ID</th>
                                                <th>Tên xuất xứ</th>
                                                <th>Mô tả</th>
                                                <th>Ngày tạo</th>
                                                {isAdmin() && <th style={{ width: '120px' }}>Thao tác</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isAdmin() ? 5 : 4} className="text-center py-4">
                                                        Không tìm thấy dữ liệu nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                items.map(o => (
                                                    <tr key={o.id}>
                                                        <td>{o.id}</td>
                                                        <td><strong>{o.name}</strong></td>
                                                        <td>{o.description}</td>
                                                        <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                                                        {isAdmin() && (
                                                            <td>
                                                                <button className="btn btn-sm btn-info mr-1" onClick={() => openModal(o)} title="Sửa">
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(o.id)} title="Xóa">
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>

                                    <div className="d-flex justify-content-between align-items-center mt-3 mx-2 pb-3">
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
                                <h5 className="modal-title">{editing ? 'Sửa Xuất xứ' : 'Thêm Xuất xứ'}</h5>
                                <button type="button" className="close" onClick={closeModal}><span>&times;</span></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger">{error}</div>}
                                    <div className="form-group">
                                        <label>Tên xuất xứ</label>
                                        <input type="text" className="form-control" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required placeholder="VD: Việt Nam, Nhật Bản..." />
                                    </div>
                                    <div className="form-group">
                                        <label>Mô tả</label>
                                        <textarea className="form-control" value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows="3" placeholder="Nhập mô tả..." />
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

export default OriginsAdmin;
