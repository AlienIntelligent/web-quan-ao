import React, { useEffect, useState } from 'react';
import { productApi, promotionApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const PromotionsAdmin = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [filterActive, setFilterActive] = useState('');
    const [filterDiscountType, setFilterDiscountType] = useState('');
    const [discountValueKeyword, setDiscountValueKeyword] = useState('');
    const [minimumOrderAmountKeyword, setMinimumOrderAmountKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [formData, setFormData] = useState({
        code: '', name: '', description: '', discountType: 'PERCENT',
        discountValue: 0, minimumOrderAmount: 0, maximumDiscountAmount: '',
        startDate: '', endDate: '', usageLimit: '', isActive: true,
    });
    const [error, setError] = useState('');
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [scopePromotion, setScopePromotion] = useState(null);
    const [scopeProducts, setScopeProducts] = useState([]);
    const [scopeProductIds, setScopeProductIds] = useState([]);
    const [scopeKeyword, setScopeKeyword] = useState('');
    const [scopeLoading, setScopeLoading] = useState(false);
    const [scopeSaving, setScopeSaving] = useState(false);
    const [scopeError, setScopeError] = useState('');
    const { isAdmin } = useAuth();

    const loadItems = async (nextPage = page) => {
        setLoading(true);
        try {
            const params = { keyword: keyword || undefined, page: nextPage, pageSize };
            if (filterActive !== '') params.isActive = filterActive === 'true';
            if (filterDiscountType !== '') params.discountType = filterDiscountType;
            if (discountValueKeyword !== '') params.discountValue = discountValueKeyword;
            if (minimumOrderAmountKeyword !== '') params.minimumOrderAmount = minimumOrderAmountKeyword;
            const res = await promotionApi.getAll(params);
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

    const openModal = (p = null) => {
        if (p) {
            setEditing(p);
            setFormData({
                code: p.code || '', name: p.name || '', description: p.description || '',
                discountType: p.discountType || 'PERCENT', discountValue: p.discountValue || 0,
                minimumOrderAmount: p.minimumOrderAmount || 0,
                maximumDiscountAmount: p.maximumDiscountAmount ?? '',
                startDate: p.startDate ? new Date(p.startDate).toISOString().slice(0, 10) : '',
                endDate: p.endDate ? new Date(p.endDate).toISOString().slice(0, 10) : '',
                usageLimit: p.usageLimit ?? '', isActive: !!p.isActive,
            });
        } else {
            setEditing(null);
            setFormData({
                code: '', name: '', description: '', discountType: 'PERCENT',
                discountValue: 0, minimumOrderAmount: 0, maximumDiscountAmount: '',
                startDate: '', endDate: '', usageLimit: '', isActive: true,
            });
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
                code: formData.code, name: formData.name, description: formData.description || null,
                discountType: formData.discountType, discountValue: parseFloat(formData.discountValue) || 0,
                minimumOrderAmount: parseFloat(formData.minimumOrderAmount) || 0,
                maximumDiscountAmount: formData.maximumDiscountAmount === '' ? null : parseFloat(formData.maximumDiscountAmount),
                startDate: formData.startDate || null, endDate: formData.endDate || null,
                usageLimit: formData.usageLimit === '' ? null : parseInt(formData.usageLimit),
                isActive: formData.isActive,
            };
            if (editing) await promotionApi.update(editing.id, payload);
            else await promotionApi.create(payload);
            closeModal();
            await loadItems(1);
            setPage(1);
        } catch (err) {
            setError(err.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa khuyến mãi này?')) return;
        try {
            await promotionApi.delete(id);
            await loadItems();
        } catch (err) {
            alert(err.response?.data?.message || 'Xóa thất bại');
        }
    };

    const openProductsModal = async (promotion) => {
        setScopePromotion(promotion);
        setShowProductsModal(true);
        setScopeError('');
        setScopeKeyword('');
        setScopeLoading(true);
        try {
            const [productsRes, scopeRes] = await Promise.all([
                productApi.search({ page: 1, pageSize: 1000 }),
                promotionApi.getProducts(promotion.id),
            ]);

            setScopeProducts(productsRes.data.items || []);
            setScopeProductIds(scopeRes.data.productIds || []);
        } catch (err) {
            setScopeError(err.response?.data?.message || 'Khong tai duoc danh sach san pham ap dung');
        } finally {
            setScopeLoading(false);
        }
    };

    const closeProductsModal = () => {
        setShowProductsModal(false);
        setScopePromotion(null);
        setScopeProducts([]);
        setScopeProductIds([]);
        setScopeKeyword('');
        setScopeError('');
    };

    const toggleScopeProduct = (productId) => {
        setScopeProductIds((current) =>
            current.includes(productId)
                ? current.filter((id) => id !== productId)
                : [...current, productId]
        );
    };

    const saveProductScope = async () => {
        if (!scopePromotion) return;
        setScopeSaving(true);
        setScopeError('');
        try {
            await promotionApi.updateProducts(scopePromotion.id, scopeProductIds);
            await loadItems(page);
            closeProductsModal();
        } catch (err) {
            setScopeError(err.response?.data?.message || 'Luu danh sach san pham ap dung that bai');
        } finally {
            setScopeSaving(false);
        }
    };

    const filteredScopeProducts = scopeProducts.filter((product) => {
        const value = scopeKeyword.trim().toLowerCase();
        if (!value) return true;
        return `${product.id} ${product.name} ${product.category?.name || ''}`
            .toLowerCase()
            .includes(value);
    });

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
                            <h1 className="m-0">Quản lý Khuyến mãi</h1>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header">
                            <div className="row">
                                <div className="col-md-10">
                                    <form onSubmit={handleSearch} className="form-inline">
                                        <input
                                            type="text"
                                            className="form-control mr-2"
                                            placeholder="Tìm theo mã hoặc tên..."
                                            value={keyword}
                                            onChange={(e) => setKeyword(e.target.value)}
                                        />
                                        <select
                                            className="form-control mr-2"
                                            value={filterActive}
                                            onChange={(e) => setFilterActive(e.target.value)}
                                        >
                                            <option value="">Tất cả trạng thái</option>
                                            <option value="true">Đang kích hoạt</option>
                                            <option value="false">Tạm dừng</option>
                                        </select>
                                        <select
                                            className="form-control mr-2"
                                            value={filterDiscountType}
                                            onChange={(e) => setFilterDiscountType(e.target.value)}
                                        >
                                            <option value="">Tất cả loại giảm</option>
                                            <option value="PERCENT">Phần trăm</option>
                                            <option value="AMOUNT">Số tiền</option>
                                            <option value="FREESHIP">Miễn phí vận chuyển</option>
                                        </select>
                                        <input
                                            type="number"
                                            className="form-control mr-2"
                                            placeholder="Tìm mức giảm..."
                                            value={discountValueKeyword}
                                            onChange={(e) => setDiscountValueKeyword(e.target.value)}
                                            min="0"
                                        />
                                        <input
                                            type="number"
                                            className="form-control mr-2"
                                            placeholder="Tìm đơn tối thiểu..."
                                            value={minimumOrderAmountKeyword}
                                            onChange={(e) => setMinimumOrderAmountKeyword(e.target.value)}
                                            min="0"
                                        />
                                        <button type="submit" className="btn btn-primary">
                                            <i className="fas fa-search"></i> Tìm
                                        </button>
                                    </form>
                                </div>
                                <div className="col-md-2 text-right">
                                    {isAdmin() && (
                                        <button className="btn btn-success" onClick={() => openModal()}>
                                            <i className="fas fa-plus"></i> Thêm Khuyến mãi
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
                                <>
                                    <table className="table table-bordered table-striped">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '60px' }}>ID</th>
                                                <th>Mã KM</th>
                                                <th>Tên chương trình</th>
                                                <th>Loại giảm</th>
                                                <th>Mức giảm</th>
                                                <th>Đơn tối thiểu</th>
                                                <th>SL dùng</th>
                                                <th>Bắt đầu</th>
                                                <th>Kết thúc</th>
                                                <th>Trạng thái</th>
                                                <th>Phạm vi</th>
                                                {isAdmin() && <th style={{ width: '150px' }}>Thao tác</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isAdmin() ? 12 : 11} className="text-center py-4">
                                                        Không tìm thấy khuyến mãi nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                items.map(p => (
                                                    <tr key={p.id}>
                                                        <td>{p.id}</td>
                                                        <td><span className="badge badge-primary">{p.code}</span></td>
                                                        <td><strong>{p.name}</strong></td>
                                                        <td>{p.discountType === 'PERCENT' ? 'Phần trăm' : 'Số tiền'}</td>
                                                        <td>
                                                            <strong className="text-danger">
                                                                {p.discountType === 'PERCENT' ? `${p.discountValue}%` : `${Number(p.discountValue).toLocaleString()} đ`}
                                                            </strong>
                                                        </td>
                                                        <td>{Number(p.minimumOrderAmount).toLocaleString()} đ</td>
                                                        <td>{p.usedCount}/{p.usageLimit ?? '∞'}</td>
                                                        <td>{p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '-'}</td>
                                                        <td>{p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '-'}</td>
                                                        <td>
                                                            <span className={`badge ${p.productScopeCount > 0 ? 'badge-info' : 'badge-light'}`}>
                                                                {p.productScopeCount > 0 ? `${p.productScopeCount} SP` : 'Toàn đơn'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${p.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                                                {p.isActive ? 'Đang chạy' : 'Tạm dừng'}
                                                            </span>
                                                        </td>
                                                        {isAdmin() && (
                                                            <td>
                                                                <button className="btn btn-sm btn-info mr-1" onClick={() => openModal(p)} title="Sửa">
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button className="btn btn-sm btn-secondary mr-1" onClick={() => openProductsModal(p)} title="Sản phẩm áp dụng">
                                                                    <i className="fas fa-boxes"></i>
                                                                </button>
                                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)} title="Xóa">
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
                                        <span>Tổng: {totalCount} chương trình</span>
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

            {showProductsModal && scopePromotion && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    Sản phẩm áp dụng - {scopePromotion.code}
                                </h5>
                                <button type="button" className="close" onClick={closeProductsModal}><span>&times;</span></button>
                            </div>
                            <div className="modal-body">
                                {scopeError && <div className="alert alert-danger">{scopeError}</div>}
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <strong>{scopeProductIds.length}</strong> sản phẩm được chọn
                                        <small className="text-muted d-block">
                                            Không chọn sản phẩm nào nghĩa là mã áp dụng cho toàn đơn.
                                        </small>
                                    </div>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ maxWidth: '320px' }}
                                        placeholder="Tìm sản phẩm..."
                                        value={scopeKeyword}
                                        onChange={(e) => setScopeKeyword(e.target.value)}
                                    />
                                </div>
                                {scopeLoading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary"></div>
                                    </div>
                                ) : (
                                    <div className="table-responsive" style={{ maxHeight: '420px' }}>
                                        <table className="table table-bordered table-striped table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: '50px' }}></th>
                                                    <th style={{ width: '70px' }}>ID</th>
                                                    <th>Sản phẩm</th>
                                                    <th>Danh mục</th>
                                                    <th>Giá bán</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredScopeProducts.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="text-center py-4">
                                                            Không tìm thấy sản phẩm nào
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredScopeProducts.map((product) => (
                                                        <tr key={product.id}>
                                                            <td className="text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={scopeProductIds.includes(product.id)}
                                                                    onChange={() => toggleScopeProduct(product.id)}
                                                                />
                                                            </td>
                                                            <td>{product.id}</td>
                                                            <td>
                                                                <strong>{product.name}</strong>
                                                            </td>
                                                            <td>{product.category?.name || '-'}</td>
                                                            <td>{Number(product.price || 0).toLocaleString()} đ</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeProductsModal}>Đóng</button>
                                <button type="button" className="btn btn-primary" onClick={saveProductScope} disabled={scopeSaving}>
                                    {scopeSaving ? 'Đang lưu...' : 'Lưu phạm vi áp dụng'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showProductsModal && <div className="modal-backdrop fade show"></div>}

            {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{editing ? 'Sửa Khuyến mãi' : 'Thêm Khuyến mãi'}</h5>
                                <button type="button" className="close" onClick={closeModal}><span>&times;</span></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-danger">{error}</div>}
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Mã khuyến mãi (Code)</label>
                                                <input type="text" className="form-control" value={formData.code}
                                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                                    required placeholder="VD: GIAM20, TET2024..." />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Tên chương trình</label>
                                                <input type="text" className="form-control" value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    required placeholder="VD: Khuyến mãi Tết..." />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Mô tả</label>
                                        <textarea className="form-control" value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            rows="2" placeholder="Mô tả chi tiết..." />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Loại giảm giá</label>
                                                <select className="form-control" value={formData.discountType}
                                                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}>
                                                    <option value="PERCENT">Phần trăm (%)</option>
                                                    <option value="AMOUNT">Số tiền cố định (đ)</option>
                                                    <option value="FREESHIP">Miễn phí vận chuyển</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Giá trị giảm</label>
                                                <input type="number" className="form-control" value={formData.discountValue}
                                                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                                    placeholder="VD: 20 hoặc 50000" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Đơn tối thiểu</label>
                                                <input type="number" className="form-control" value={formData.minimumOrderAmount}
                                                    onChange={(e) => setFormData({ ...formData, minimumOrderAmount: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="form-group">
                                                <label>Giảm tối đa (để trống = không giới hạn)</label>
                                                <input type="number" className="form-control" value={formData.maximumDiscountAmount}
                                                    onChange={(e) => setFormData({ ...formData, maximumDiscountAmount: e.target.value })}
                                                    placeholder="Không giới hạn" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="form-group">
                                                <label>Ngày bắt đầu</label>
                                                <input type="date" className="form-control" value={formData.startDate}
                                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="form-group">
                                                <label>Ngày kết thúc</label>
                                                <input type="date" className="form-control" value={formData.endDate}
                                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="form-group">
                                                <label>Giới hạn sử dụng</label>
                                                <input type="number" className="form-control" value={formData.usageLimit}
                                                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                                    placeholder="Không giới hạn" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <div className="custom-control custom-switch">
                                            <input type="checkbox" className="custom-control-input" id="promoIsActive"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                                            <label className="custom-control-label" htmlFor="promoIsActive">Kích hoạt chương trình</label>
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

export default PromotionsAdmin;
