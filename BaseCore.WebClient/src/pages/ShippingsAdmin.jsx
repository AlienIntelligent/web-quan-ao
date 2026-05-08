import React, { useEffect, useState } from 'react';
import { shippingApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ShippingsAdmin = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [filterActive, setFilterActive] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        name: '', description: '', baseFee: 0, feePerKm: 0,
        estimatedDays: '', maxWeightKg: '', isActive: true,
    });
    const [error, setError] = useState('');
    const { isAdmin } = useAuth();

    const loadItems = async (nextPage = page) => {
        setLoading(true);
        try {
            const params = { keyword: keyword || undefined, page: nextPage, pageSize };
            if (filterActive !== '') params.isActive = filterActive === 'true';
            const res = await shippingApi.getAll(params);
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

    const openModal = (s = null) => {
        if (s) {
            setEditing(s);
            setFormData({
                name: s.name || '', description: s.description || '',
                baseFee: s.baseFee ?? 0, feePerKm: s.feePerKm ?? 0,
                estimatedDays: s.estimatedDays ?? '', maxWeightKg: s.maxWeightKg ?? '',
                isActive: !!s.isActive,
            });
        } else {
            setEditing(null);
            setFormData({ name: '', description: '', baseFee: 0, feePerKm: 0, estimatedDays: '', maxWeightKg: '', isActive: true });
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
                name: formData.name, description: formData.description || null,
                baseFee: parseFloat(formData.baseFee) || 0,
                feePerKm: parseFloat(formData.feePerKm) || 0,
                estimatedDays: formData.estimatedDays === '' ? null : parseInt(formData.estimatedDays),
                maxWeightKg: formData.maxWeightKg === '' ? null : parseFloat(formData.maxWeightKg),
                isActive: formData.isActive,
            };
            if (editing) await shippingApi.update(editing.id, payload);
            else await shippingApi.create(payload);
            closeModal();
            await loadItems(1);
            setPage(1);
        } catch (err) {
            setError(err.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa phương thức vận chuyển này?')) return;
        try {
            await shippingApi.delete(id);
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
                            <h1 className="m-0">Quản lý Vận chuyển</h1>
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
                                        <select
                                            className="form-control mr-2"
                                            value={filterActive}
                                            onChange={(e) => setFilterActive(e.target.value)}
                                        >
                                            <option value="">Tất cả</option>
                                            <option value="true">Đang hoạt động</option>
                                            <option value="false">Tạm ngưng</option>
                                        </select>
                                        <button type="submit" className="btn btn-primary">
                                            <i className="fas fa-search"></i> Tìm
                                        </button>
                                    </form>
                                </div>
                                <div className="col-md-4 text-right">
                                    {isAdmin() && (
                                        <button className="btn btn-success" onClick={() => openModal()}>
                                            <i className="fas fa-plus"></i> Thêm Vận chuyển
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
                                                <th>Tên phương thức</th>
                                                <th>Mô tả</th>
                                                <th>Phí cơ bản</th>
                                                <th>Phí/km</th>
                                                <th>Thời gian (ngày)</th>
                                                <th>Cân nặng tối đa</th>
                                                <th>Trạng thái</th>
                                                {isAdmin() && <th style={{ width: '120px' }}>Thao tác</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isAdmin() ? 9 : 8} className="text-center py-4">
                                                        Không tìm thấy dữ liệu nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                items.map(s => (
                                                    <tr key={s.id}>
                                                        <td>{s.id}</td>
                                                        <td><strong>{s.name}</strong></td>
                                                        <td>{s.description}</td>
                                                        <td><strong className="text-primary">{Number(s.baseFee).toLocaleString()} đ</strong></td>
                                                        <td>{s.feePerKm > 0 ? `${Number(s.feePerKm).toLocaleString()} đ` : '-'}</td>
                                                        <td>{s.estimatedDays != null ? `${s.estimatedDays} ngày` : '-'}</td>
                                                        <td>{s.maxWeightKg != null ? `${s.maxWeightKg} kg` : '-'}</td>
                                                        <td>
                                                            <span className={`badge ${s.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                                                {s.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                                                            </span>
                                                        </td>
                                                        {isAdmin() && (
                                                            <td>
                                                                <button className="btn btn-sm btn-info mr-1" onClick={() => openModal(s)} title="Sửa">
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)} title="Xóa">
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
                                <h5 className="modal-title">{editing ? 'Sửa Vận chuyển' : 'Thêm Vận chuyển'}</h5>
                                <button type="button" className="close" onClick={closeModal}><span>&times;</span></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger">{error}</div>}
                                    <div className="form-group">
                                        <label>Tên phương thức</label>
                                        <input type="text" className="form-control" value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required placeholder="VD: Giao hàng tiêu chuẩn..." />
                                    </div>
                                    <div className="form-group">
                                        <label>Mô tả</label>
                                        <textarea className="form-control" value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows="2" />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Phí cơ bản (đ)</label>
                                                <input type="number" className="form-control" value={formData.baseFee}
                                                    onChange={(e) => setFormData({ ...formData, baseFee: e.target.value })} min="0" />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Phí mỗi km (đ)</label>
                                                <input type="number" className="form-control" value={formData.feePerKm}
                                                    onChange={(e) => setFormData({ ...formData, feePerKm: e.target.value })} min="0" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Thời gian giao (ngày)</label>
                                                <input type="number" className="form-control" value={formData.estimatedDays}
                                                    onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                                                    placeholder="Không giới hạn" min="0" />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Cân nặng tối đa (kg)</label>
                                                <input type="number" className="form-control" value={formData.maxWeightKg}
                                                    onChange={(e) => setFormData({ ...formData, maxWeightKg: e.target.value })}
                                                    placeholder="Không giới hạn" min="0" step="0.1" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <div className="custom-control custom-switch">
                                            <input type="checkbox" className="custom-control-input" id="shipIsActive"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                                            <label className="custom-control-label" htmlFor="shipIsActive">Kích hoạt</label>
                                        </div>
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

export default ShippingsAdmin;
