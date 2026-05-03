import React, { useState, useEffect } from 'react';
import { productApi, categoryApi, productVariantApi, productOriginApi, originApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [allOrigins, setAllOrigins] = useState([]); // List of all origins for selection
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [activeTab, setActiveTab] = useState('general'); // 'general', 'variants', 'origins'
    
    const [formData, setFormData] = useState({
        name: '',
        price: 0,
        stock: 0,
        description: '',
        imageUrl: '',
        categoryId: '',
    });

    // Related data states
    const [variants, setVariants] = useState([]);
    const [productOrigins, setProductOrigins] = useState([]);
    const [subLoading, setSubLoading] = useState(false);

    const [error, setError] = useState('');
    const { isAdmin } = useAuth();

    useEffect(() => {
        loadCategories();
        loadAllOrigins();
    }, []);

    useEffect(() => {
        loadProducts();
    }, [page, keyword, categoryId, minPrice, maxPrice]);

    const loadCategories = async () => {
        try {
            const response = await categoryApi.getAll();
            setCategories(response.data || []);
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    };

    const loadAllOrigins = async () => {
        try {
            const res = await originApi.getAll({ pageSize: 100 });
            setAllOrigins(res.data.items || []);
        } catch (e) { console.error(e); }
    };

    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await productApi.search({
                keyword,
                categoryId: categoryId || undefined,
                minPrice: minPrice || undefined,
                maxPrice: maxPrice || undefined,
                page,
                pageSize,
            });
            const payload = response?.data;
            const items = payload?.items ?? [];

            setProducts(items);
            setTotalPages(payload?.totalPages ?? 0);
            setTotalCount(payload?.totalCount ?? 0);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRelatedData = async (productId) => {
        setSubLoading(true);
        try {
            const [varRes, oriRes] = await Promise.all([
                productVariantApi.getAll({ keyword: String(productId), pageSize: 100 }),
                productOriginApi.getAll({ keyword: String(productId), pageSize: 100 })
            ]);
            setVariants((varRes.data.items || []).filter(v => v.productId === productId));
            setProductOrigins((oriRes.data.items || []).filter(o => o.productId === productId));
        } catch (e) {
            console.error("Lỗi tải dữ liệu liên quan:", e);
        } finally {
            setSubLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        loadProducts();
    };

    const openModal = (product = null) => {
        setError('');
        setActiveTab('general');
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                price: product.price,
                stock: product.stock,
                description: product.description || '',
                imageUrl: product.imageUrl || '',
                categoryId: product.categoryId,
            });
            loadRelatedData(product.id);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                price: 0,
                stock: 0,
                description: '',
                imageUrl: '',
                categoryId: categories[0]?.id || '',
            });
            setVariants([]);
            setProductOrigins([]);
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const data = {
                ...formData,
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                categoryId: parseInt(formData.categoryId),
            };

            if (editingProduct) {
                await productApi.update(editingProduct.id, { id: editingProduct.id, ...data });
            } else {
                await productApi.create(data);
            }

            closeModal();
            loadProducts();
        } catch (error) {
            setError(error.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
        try {
            await productApi.delete(id);
            loadProducts();
        } catch (error) {
            alert('Lỗi khi xóa sản phẩm');
        }
    };

    // Variant Management Actions
    const addVariant = async () => {
        const size = prompt("Nhập Size (VD: M, L, XL):");
        const color = prompt("Nhập Màu (VD: Đen, Trắng):");
        if (!size || !color) return;
        try {
            await productVariantApi.create({
                productId: editingProduct.id,
                size,
                color,
                stock: 0,
                price: editingProduct.price
            });
            loadRelatedData(editingProduct.id);
        } catch (e) { alert("Lỗi thêm biến thể"); }
    };

    const deleteVariant = async (id) => {
        if (!window.confirm("Xóa biến thể này?")) return;
        await productVariantApi.delete(id);
        loadRelatedData(editingProduct.id);
    };

    // Origin Management Actions
    const addOrigin = async () => {
        const originId = prompt("Nhập ID Xuất xứ (hoặc chọn từ danh sách):");
        if (!originId) return;
        try {
            await productOriginApi.create({
                productId: editingProduct.id,
                originId: parseInt(originId)
            });
            loadRelatedData(editingProduct.id);
        } catch (e) { alert("Lỗi thêm xuất xứ"); }
    };

    const deleteProductOrigin = async (id) => {
        if (!window.confirm("Xóa liên kết xuất xứ này?")) return;
        await productOriginApi.delete(id);
        loadRelatedData(editingProduct.id);
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
                    <h1 className="m-0 text-dark">Quản lý Sản phẩm</h1>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="card">
                        <div className="card-header border-0 bg-white">
                            <div className="row align-items-center">
                                <div className="col-md-9">
                                    <form onSubmit={handleSearch} className="form-inline">
                                        <div className="input-group mr-2">
                                            <div className="input-group-prepend">
                                                <span className="input-group-text bg-white border-right-0"><i className="fas fa-search text-muted"></i></span>
                                            </div>
                                            <input
                                                type="text"
                                                className="form-control border-left-0"
                                                placeholder="Tìm tên sản phẩm..."
                                                value={keyword}
                                                onChange={(e) => setKeyword(e.target.value)}
                                            />
                                        </div>
                                        <select
                                            className="form-control mr-2"
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(e.target.value)}
                                        >
                                            <option value="">Tất cả danh mục</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <button type="submit" className="btn btn-primary shadow-sm">
                                            Lọc dữ liệu
                                        </button>
                                    </form>
                                </div>
                                <div className="col-md-3 text-right">
                                    {isAdmin() && (
                                        <button className="btn btn-success shadow-sm" onClick={() => openModal()}>
                                            <i className="fas fa-plus mr-1"></i> Thêm mới
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="card-body p-0">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary"></div>
                                    <div className="mt-2 text-muted">Đang tải danh sách sản phẩm...</div>
                                </div>
                            ) : (
                                <>
                                    <table className="table table-hover table-valign-middle mb-0">
                                        <thead className="thead-light">
                                            <tr>
                                                <th style={{ width: '80px' }}>ID</th>
                                                <th>Hình ảnh</th>
                                                <th>Tên sản phẩm</th>
                                                <th>Danh mục</th>
                                                <th>Giá bán</th>
                                                <th>Kho</th>
                                                {isAdmin() && <th className="text-right">Hành động</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.length === 0 ? (
                                                <tr>
                                                    <td colSpan={isAdmin() ? 7 : 6} className="text-center py-5">
                                                        <i className="fas fa-box-open fa-3x text-muted mb-3 d-block"></i>
                                                        Chưa có sản phẩm nào
                                                    </td>
                                                </tr>
                                            ) : (
                                                products.map(product => (
                                                    <tr key={product.id}>
                                                        <td>{product.id}</td>
                                                        <td>
                                                            <img 
                                                                src={product.imageUrl || '/img/no-image.png'} 
                                                                alt="" 
                                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }} 
                                                                className="rounded shadow-sm"
                                                            />
                                                        </td>
                                                        <td className="font-weight-bold">{product.name}</td>
                                                        <td>
                                                          <span className="badge badge-outline-primary">
                                                            {product.category?.name}
                                                          </span>
                                                        </td>
                                                        <td>
                                                            <span className="text-danger font-weight-bold">
                                                                {product.price?.toLocaleString()} đ
                                                            </span>
                                                        </td>
                                                        <td>{product.stock}</td>
                                                        {isAdmin() && (
                                                            <td className="text-right">
                                                                <button
                                                                    className="btn btn-sm btn-outline-info mr-1"
                                                                    onClick={() => openModal(product)}
                                                                    title="Chỉnh sửa & Kết nối"
                                                                >
                                                                    <i className="fas fa-cog"></i> Quản lý
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={() => handleDelete(product.id)}
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

                                    <div className="card-footer bg-white clearfix">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-muted small">Tổng cộng: <strong>{totalCount}</strong> sản phẩm</span>
                                            <nav>
                                                <ul className="pagination pagination-sm mb-0">
                                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                                        <button className="page-link" onClick={() => setPage(page - 1)}>
                                                            <i className="fas fa-chevron-left"></i>
                                                        </button>
                                                    </li>
                                                    {renderPagination()}
                                                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                                        <button className="page-link" onClick={() => setPage(page + 1)}>
                                                            <i className="fas fa-chevron-right"></i>
                                                        </button>
                                                    </li>
                                                </ul>
                                            </nav>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal Quản lý Sản phẩm (Tabbed Interface) */}
            {showModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-dark text-white p-2 px-3">
                                <h6 className="modal-title font-weight-bold">
                                    {editingProduct ? `Cấu hình Sản phẩm: ${editingProduct.name}` : 'Thêm Sản phẩm mới'}
                                </h6>
                                <button type="button" className="close text-white" onClick={closeModal}>
                                    <span>&times;</span>
                                </button>
                            </div>
                            
                            {/* TABS Navigation */}
                            <ul className="nav nav-tabs px-3 bg-light pt-2">
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === 'general' ? 'active font-weight-bold' : ''}`}
                                        onClick={() => setActiveTab('general')}
                                    >
                                        <i className="fas fa-info-circle mr-1"></i> Thông tin chung
                                    </button>
                                </li>
                                {editingProduct && (
                                    <>
                                        <li className="nav-item">
                                            <button 
                                                className={`nav-link ${activeTab === 'variants' ? 'active font-weight-bold' : ''}`}
                                                onClick={() => setActiveTab('variants')}
                                            >
                                                <i className="fas fa-layer-group mr-1"></i> Biến thể (Size/Màu)
                                            </button>
                                        </li>
                                        <li className="nav-item">
                                            <button 
                                                className={`nav-link ${activeTab === 'origins' ? 'active font-weight-bold' : ''}`}
                                                onClick={() => setActiveTab('origins')}
                                            >
                                                <i className="fas fa-globe mr-1"></i> Xuất xứ
                                            </button>
                                        </li>
                                    </>
                                )}
                            </ul>

                            <div className="modal-body p-4">
                                {activeTab === 'general' && (
                                    <form onSubmit={handleSubmit} id="productForm">
                                        {error && <div className="alert alert-danger py-2">{error}</div>}
                                        <div className="row">
                                            <div className="col-md-8">
                                                <div className="form-group">
                                                    <label className="small font-weight-bold text-uppercase">Tên sản phẩm</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-4">
                                                <div className="form-group">
                                                    <label className="small font-weight-bold text-uppercase">Danh mục</label>
                                                    <select
                                                        className="form-control"
                                                        value={formData.categoryId}
                                                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                                        required
                                                    >
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="small font-weight-bold text-uppercase">Giá bán chính (đ)</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={formData.price}
                                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="form-group">
                                                    <label className="small font-weight-bold text-uppercase">Tổng kho mặc định</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={formData.stock}
                                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group">
                                            <label className="small font-weight-bold text-uppercase">Ảnh đại diện (URL)</label>
                                            <input
                                                type="text"
                                                className="form-control font-italic"
                                                value={formData.imageUrl}
                                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group mb-0">
                                            <label className="small font-weight-bold text-uppercase">Mô tả chi tiết</label>
                                            <textarea
                                                className="form-control"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows="3"
                                            />
                                        </div>
                                    </form>
                                )}

                                {activeTab === 'variants' && (
                                    <div className="variant-manager">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="font-weight-bold mb-0">Danh sách biến thể màu sắc & kích thước</h6>
                                            <button className="btn btn-sm btn-success shadow-sm" onClick={addVariant}>
                                                <i className="fas fa-plus"></i> Thêm biến thể
                                            </button>
                                        </div>
                                        <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                            <table className="table table-sm table-bordered table-striped">
                                                <thead className="bg-light">
                                                    <tr>
                                                        <th>Size</th>
                                                        <th>Màu</th>
                                                        <th>Kho</th>
                                                        <th>Giá (nếu khác)</th>
                                                        <th className="text-center">Xóa</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {variants.map(v => (
                                                        <tr key={v.id}>
                                                            <td className="font-weight-bold">{v.size}</td>
                                                            <td>{v.color}</td>
                                                            <td>{v.stock}</td>
                                                            <td>{v.price?.toLocaleString()} đ</td>
                                                            <td className="text-center">
                                                                <button className="btn btn-link text-danger p-0" onClick={() => deleteVariant(v.id)}>
                                                                    <i className="fas fa-times-circle"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {variants.length === 0 && (
                                                        <tr><td colSpan="5" className="text-center py-3 text-muted">Chưa có biến thể nào</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'origins' && (
                                    <div className="origin-manager">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="font-weight-bold mb-0">Liên kết quốc gia xuất xứ</h6>
                                            <button className="btn btn-sm btn-success shadow-sm" onClick={addOrigin}>
                                                <i className="fas fa-link"></i> Ghép xuất xứ
                                            </button>
                                        </div>
                                        <div className="row">
                                            {productOrigins.map(po => (
                                                <div className="col-md-6 mb-2" key={po.id}>
                                                    <div className="p-2 border rounded d-flex justify-content-between align-items-center bg-white shadow-sm">
                                                        <span className="font-weight-bold">
                                                            <i className="fas fa-map-marker-alt text-primary mr-2"></i>
                                                            {allOrigins.find(o => o.id === po.originId)?.name || `ID: ${po.originId}`}
                                                        </span>
                                                        <button className="btn btn-sm text-danger" onClick={() => deleteProductOrigin(po.id)}>
                                                            <i className="fas fa-unlink"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {productOrigins.length === 0 && (
                                                <div className="col-12 text-center py-4 text-muted">Sản phẩm này chưa được gán xuất xứ</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Đóng
                                </button>
                                {activeTab === 'general' && (
                                    <button type="submit" form="productForm" className="btn btn-primary">
                                        {editingProduct ? 'Cập nhật thay đổi' : 'Tạo sản phẩm ngay'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showModal && <div className="modal-backdrop fade show"></div>}
        </div>
    );
};

export default Products;
