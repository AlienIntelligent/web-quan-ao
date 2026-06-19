import React, { useState, useEffect } from "react";
import {
  productApi,
  categoryApi,
  productVariantApi,
  productOriginApi,
  originApi,
  uploadApi,
  metadataApi,
} from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const ImageDropzone = ({
  value,
  onChange,
  folder = "products",
  compact = false,
}) => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn file ảnh");
      return;
    }

    setUploading(true);

    try {
      const res = await uploadApi.image(file, folder);
      onChange(res.data.imageUrl);
    } catch (error) {
      alert(error.response?.data?.message || "Upload ảnh thất bại");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div
        className="border rounded text-center p-3"
        style={{
          cursor: "pointer",
          borderStyle: "dashed",
          background: "#fafafa",
          minHeight: compact ? "74px" : "auto",
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          uploadFile(e.dataTransfer.files?.[0]);
        }}
      >
        {value ? (
          <img
            src={value}
            alt="Ảnh đã chọn"
            style={{
              maxHeight: compact ? "54px" : "140px",
              maxWidth: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div className="text-muted">
            {compact ? "Kéo thả" : "Kéo thả ảnh vào đây"}
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        className={compact ? "form-control-file mt-2" : "form-control mt-2"}
        onChange={(e) => uploadFile(e.target.files?.[0])}
      />

      {uploading && (
        <small className="text-muted d-block mt-1">Đang upload ảnh...</small>
      )}

      {value && !compact && (
        <small className="text-muted d-block mt-1">{value}</small>
      )}
    </div>
  );
};

const getEmptyVariantForm = (price = 0) => ({
  sizeId: "",
  size: "",
  colorId: "",
  color: "",
  stock: 0,
  price,
  imageUrl: "",
});

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allOrigins, setAllOrigins] = useState([]); // List of all origins for selection
  const [allSizes, setAllSizes] = useState([]);
  const [allColors, setAllColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("general"); // 'general', 'variants', 'origins'

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    stock: 0,
    description: "",
    imageUrl: "",
    categoryId: "",
    originalPrice: 0,
  });

  // Related data states
  const [variants, setVariants] = useState([]);
  const [productOrigins, setProductOrigins] = useState([]);
  const [subLoading, setSubLoading] = useState(false);
  const [variantForm, setVariantForm] = useState(getEmptyVariantForm());
  const [variantFormError, setVariantFormError] = useState("");
  const [variantSaving, setVariantSaving] = useState(false);
  const [originIdToAdd, setOriginIdToAdd] = useState("");
  const [originFormError, setOriginFormError] = useState("");
  const [originSaving, setOriginSaving] = useState(false);

  const [error, setError] = useState("");
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadCategories();
    loadAllOrigins();
    loadMetadata();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [page, keyword, categoryId, minPrice, maxPrice]);

  const loadCategories = async () => {
    try {
      const response = await categoryApi.getAll();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadAllOrigins = async () => {
    try {
      const res = await originApi.getAll({ pageSize: 100 });
      setAllOrigins(res.data.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMetadata = async () => {
    try {
      const [sizesRes, colorsRes] = await Promise.all([
        metadataApi.getSizes(),
        metadataApi.getColors(),
      ]);

      setAllSizes(
        (sizesRes.data || []).sort(
          (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
        ),
      );
      setAllColors(colorsRes.data || []);
    } catch (e) {
      console.error("Khong the tai size/mau:", e);
    }
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
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async (productId) => {
    setSubLoading(true);
    try {
      const [varRes, oriRes] = await Promise.all([
        productVariantApi.getAll({ keyword: String(productId), pageSize: 100 }),
        productOriginApi.getAll({ keyword: String(productId), pageSize: 100 }),
      ]);
      const currentVariants = (varRes.data.items || []).filter(
        (v) => v.productId === productId,
      );
      const currentOrigins = (oriRes.data.items || []).filter(
        (o) => o.productId === productId,
      );

      setVariants(currentVariants);
      setProductOrigins(currentOrigins);
      setOriginIdToAdd(
        currentOrigins[0]?.originId ? String(currentOrigins[0].originId) : "",
      );
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
    setError("");
    setVariantFormError("");
    setOriginFormError("");
    setOriginIdToAdd("");
    setActiveTab("general");
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        price: product.price,
        stock: product.stock,
        description: product.description || "",
        imageUrl: product.imageUrl || "",
        categoryId: product.categoryId,
        originalPrice: product.originalPrice || 0,
      });
      setVariantForm(getEmptyVariantForm(product.price || 0));
      loadRelatedData(product.id);
    } else {
      setEditingProduct(null);
      setFormData({
        name: "",
        price: 0,
        stock: 0,
        description: "",
        imageUrl: "",
        categoryId: categories[0]?.id || "",
        originalPrice: 0,
      });
      setVariants([]);
      setProductOrigins([]);
      setVariantForm(getEmptyVariantForm());
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (Number(formData.stock) < 0) {
        setError("Số lượng kho không được âm");
        return;
      }

      const data = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        categoryId: parseInt(formData.categoryId),
        originalPrice: parseFloat(formData.originalPrice),
      };

      if (editingProduct) {
        await productApi.update(editingProduct.id, {
          id: editingProduct.id,
          ...data,
        });
      } else {
        await productApi.create(data);
      }

      closeModal();
      loadProducts();
    } catch (error) {
      setError(error.response?.data?.message || "Thao tác thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await productApi.delete(id);
      loadProducts();
    } catch (error) {
      alert("Lỗi khi xóa sản phẩm");
    }
  };

  // Variant Management Actions
  const addVariant = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setVariantFormError("");
    const sizeId = Number(variantForm.sizeId) || null;
    const colorId = Number(variantForm.colorId) || null;
    const selectedSize = allSizes.find((item) => item.id === sizeId);
    const selectedColor = allColors.find((item) => item.id === colorId);
    const size = (selectedSize?.name || variantForm.size || "").trim();
    const color = (selectedColor?.name || variantForm.color || "").trim();
    const stock = Number(variantForm.stock);
    const price = Number(variantForm.price || editingProduct.price || 0);

    if (!size) {
      setVariantFormError("Vui lòng nhập size biến thể");
      return;
    }

    if (
      !Number.isFinite(stock) ||
      !Number.isFinite(price) ||
      stock < 0 ||
      price < 0
    ) {
      setVariantFormError("Kho và giá phải là số không âm");
      return;
    }

    setVariantSaving(true);
    try {
      await productVariantApi.create({
        productId: editingProduct.id,
        sizeId,
        size,
        colorId,
        color,
        stock,
        price,
        imageUrl: variantForm.imageUrl,
      });
      setVariantForm(getEmptyVariantForm(editingProduct.price || 0));
      await loadRelatedData(editingProduct.id);
    } catch (e) {
      setVariantFormError(e.response?.data?.message || "Lỗi thêm biến thể");
    } finally {
      setVariantSaving(false);
    }
  };

  const deleteVariant = async (id) => {
    if (!window.confirm("Xóa biến thể này?")) return;
    await productVariantApi.delete(id);
    loadRelatedData(editingProduct.id);
  };

  // Origin Management Actions
  const addOrigin = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setOriginFormError("");
    const originId = Number(originIdToAdd);
    if (!originId) {
      setOriginFormError("Vui lòng chọn xuất xứ");
      return;
    }

    setOriginSaving(true);
    try {
      const payload = {
        productId: editingProduct.id,
        originId,
      };

      if (productOrigins[0]?.id) {
        await productOriginApi.update(productOrigins[0].id, payload);
      } else {
        await productOriginApi.create(payload);
      }

      await loadRelatedData(editingProduct.id);
    } catch (e) {
      setOriginFormError(e.response?.data?.message || "Lỗi lưu xuất xứ");
    } finally {
      setOriginSaving(false);
    }
  };

  const deleteProductOrigin = async (id) => {
    if (!window.confirm("Xóa liên kết xuất xứ này?")) return;
    await productOriginApi.delete(id);
    loadRelatedData(editingProduct.id);
  };

  const getOriginName = (product) =>
    product.originName ||
    product.productOrigin?.originName ||
    product.productOrigin?.origin?.name ||
    "-";

  const renderStock = (product) => {
    const variantCount = Number(product.variantCount || 0);
    const totalStock = Number(product.totalStock ?? product.stock ?? 0);
    if (variantCount > 0) {
      return (
        <>
          <strong>{totalStock}</strong>
          <small className="text-muted d-block">{variantCount} biến thể</small>
        </>
      );
    }

    return totalStock;
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
              <h1 className="m-0">Quản lý Sản phẩm</h1>
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
                      placeholder="Tìm tên sản phẩm..."
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                    <select
                      className="form-control mr-2"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      <option value="">Tất cả danh mục</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="form-control mr-2"
                      placeholder="Giá bán từ..."
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      min="0"
                    />
                    <input
                      type="number"
                      className="form-control mr-2"
                      placeholder="Giá bán đến..."
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      min="0"
                    />
                    <button type="submit" className="btn btn-primary">
                      <i className="fas fa-search"></i> Tìm
                    </button>
                  </form>
                </div>
                <div className="col-md-3 text-right">
                  {isAdmin() && (
                    <button
                      className="btn btn-success"
                      onClick={() => openModal()}
                    >
                      <i className="fas fa-plus"></i> Thêm Sản phẩm
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                  <div className="mt-2 text-muted">
                    Đang tải danh sách sản phẩm...
                  </div>
                </div>
              ) : (
                <>
                  <table className="table table-bordered table-striped table-hover table-valign-middle mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: "60px" }}>ID</th>
                        <th style={{ width: "60px" }}>Hình</th>
                        <th>Tên sản phẩm</th>
                        <th>Danh mục</th>
                        <th>Xuất xứ</th>
                        <th>Giá bán</th>
                        <th>Kho</th>
                        {isAdmin() && (
                          <th style={{ width: "120px" }}>Thao tác</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td
                            colSpan={isAdmin() ? 8 : 7}
                            className="text-center py-4"
                          >
                            Chưa có sản phẩm nào
                          </td>
                        </tr>
                      ) : (
                        products.map((product) => (
                          <tr key={product.id}>
                            <td>{product.id}</td>
                            <td>
                              <img
                                src={product.imageUrl || "/img/no-image.png"}
                                alt=""
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  objectFit: "cover",
                                }}
                                className="rounded"
                              />
                            </td>
                            <td>
                              <strong>{product.name}</strong>
                            </td>
                            <td>{product.category?.name}</td>
                            <td>{getOriginName(product)}</td>
                            <td>
                              <strong className="text-danger">
                                {product.price?.toLocaleString()} đ
                              </strong>
                            </td>
                            <td>{renderStock(product)}</td>
                            {isAdmin() && (
                              <td>
                                <button
                                  className="btn btn-sm btn-info mr-1"
                                  onClick={() => openModal(product)}
                                  title="Sửa"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
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

                  <div className="d-flex justify-content-between align-items-center mt-3 mx-2 pb-3">
                    <span>Tổng: {totalCount} bản ghi</span>
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

      {/* Modal Quản lý Sản phẩm (Tabbed Interface) */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block", overflowY: "auto" }}
          tabIndex="-1"
        >
          <div
            className="modal-dialog modal-lg"
            style={{ marginTop: "1rem", marginBottom: "1rem" }}
          >
            <div
              className="modal-content border-0 shadow-lg"
              style={{
                maxHeight: "calc(100vh - 2rem)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="modal-header bg-dark text-white p-2 px-3">
                <h6 className="modal-title font-weight-bold">
                  {editingProduct
                    ? `Cấu hình Sản phẩm: ${editingProduct.name}`
                    : "Thêm Sản phẩm mới"}
                </h6>
                <button
                  type="button"
                  className="close text-white"
                  onClick={closeModal}
                >
                  <span>&times;</span>
                </button>
              </div>

              {/* TABS Navigation */}
              <ul className="nav nav-tabs px-3 product-config-tabs pt-2">
                <li className="nav-item">
                  <button
                    className={`nav-link product-config-tabs ${activeTab === "general" ? "active font-weight-bold" : ""}`}
                    onClick={() => setActiveTab("general")}
                  >
                    <i className="fas fa-info-circle mr-1"></i> Thông tin chung
                  </button>
                </li>
                {editingProduct && (
                  <>
                    <li className="nav-item">
                      <button
                        className={`nav-link product-config-tabs ${activeTab === "variants" ? "active font-weight-bold" : ""}`}
                        onClick={() => setActiveTab("variants")}
                      >
                        <i className="fas fa-layer-group mr-1"></i> Biến thể
                        (Size/Màu)
                      </button>
                    </li>
                    <li className="nav-item">
                      <button
                        className={`nav-link product-config-tabs ${activeTab === "origins" ? "active font-weight-bold" : ""}`}
                        onClick={() => setActiveTab("origins")}
                      >
                        <i className="fas fa-globe mr-1"></i> Xuất xứ
                      </button>
                    </li>
                  </>
                )}
              </ul>

              <div className="modal-body p-4" style={{ overflowY: "auto" }}>
                {activeTab === "general" && (
                  <form onSubmit={handleSubmit} id="productForm">
                    {error && (
                      <div className="alert alert-danger py-2">{error}</div>
                    )}
                    <div className="row">
                      <div className="col-md-8">
                        <div className="form-group">
                          <label className="small font-weight-bold text-uppercase">
                            Tên sản phẩm
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.name}
                            onChange={(e) =>
                              setFormData({ ...formData, name: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="small font-weight-bold text-uppercase">
                            Danh mục
                          </label>
                          <select
                            className="form-control"
                            value={formData.categoryId}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                categoryId: e.target.value,
                              })
                            }
                            required
                          >
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="small font-weight-bold text-uppercase">
                            Giá gốc (đ)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.originalPrice}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                originalPrice: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="small font-weight-bold text-uppercase">
                            Giá bán (đ)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.price}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                price: e.target.value,
                              })
                            }
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label className="small font-weight-bold text-uppercase">
                            Tổng kho
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.stock}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                stock: e.target.value,
                              })
                            }
                            min="0"
                            required
                          />
                          {editingProduct && variants.length > 0 && (
                            <small className="text-muted">
                              Bảng sản phẩm hiển thị tổng kho của các biến thể.
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="small font-weight-bold text-uppercase">
                        Ảnh đại diện
                      </label>

                      <ImageDropzone
                        value={formData.imageUrl}
                        folder="products"
                        onChange={(imageUrl) =>
                          setFormData({ ...formData, imageUrl })
                        }
                      />
                    </div>
                    <div className="form-group mb-0">
                      <label className="small font-weight-bold text-uppercase">
                        Mô tả chi tiết
                      </label>
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
                      />
                    </div>
                  </form>
                )}

                {activeTab === "variants" && (
                  <div className="variant-manager">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="font-weight-bold mb-0">
                        Danh sách biến thể màu sắc & kích thước
                      </h6>
                    </div>

                    <form
                      onSubmit={addVariant}
                      className="border rounded bg-light p-3 mb-3"
                    >
                      {variantFormError && (
                        <div className="alert alert-danger py-2 mb-3">
                          {variantFormError}
                        </div>
                      )}
                      <div className="form-row">
                        <div className="form-group col-md-2">
                          <label className="small font-weight-bold text-uppercase">
                            Size
                          </label>
                          {allSizes.length > 0 ? (
                            <select
                              className="form-control"
                              value={variantForm.sizeId}
                              onChange={(e) => {
                                const size = allSizes.find(
                                  (item) => item.id === Number(e.target.value),
                                );
                                setVariantForm({
                                  ...variantForm,
                                  sizeId: e.target.value,
                                  size: size?.name || "",
                                });
                              }}
                              required
                            >
                              <option value="">Chọn size</option>
                              {allSizes.map((size) => (
                                <option key={size.id} value={size.id}>
                                  {size.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              className="form-control"
                              value={variantForm.size}
                              onChange={(e) =>
                                setVariantForm({
                                  ...variantForm,
                                  size: e.target.value,
                                })
                              }
                              placeholder="M, L, XL"
                              required
                            />
                          )}
                        </div>
                        <div className="form-group col-md-2">
                          <label className="small font-weight-bold text-uppercase">
                            Màu
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={variantForm.color}
                            list={
                              allColors.length > 0
                                ? "variant-color-options"
                                : undefined
                            }
                            onChange={(e) =>
                              setVariantForm({
                                ...variantForm,
                                color: e.target.value,
                              })
                            }
                            placeholder="Đen, Trắng"
                          />
                          {allColors.length > 0 && (
                            <datalist id="variant-color-options">
                              {allColors.map((color) => (
                                <option key={color.id} value={color.name} />
                              ))}
                            </datalist>
                          )}
                        </div>
                        <div className="form-group col-md-2">
                          <label className="small font-weight-bold text-uppercase">
                            Kho
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={variantForm.stock}
                            min="0"
                            onChange={(e) =>
                              setVariantForm({
                                ...variantForm,
                                stock: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="form-group col-md-2">
                          <label className="small font-weight-bold text-uppercase">
                            Giá
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={variantForm.price}
                            min="0"
                            onChange={(e) =>
                              setVariantForm({
                                ...variantForm,
                                price: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="form-group col-md-4">
                          <label className="small font-weight-bold text-uppercase">
                            Ảnh biến thể
                          </label>
                          <ImageDropzone
                            value={variantForm.imageUrl}
                            folder="variants"
                            compact
                            onChange={(imageUrl) =>
                              setVariantForm({ ...variantForm, imageUrl })
                            }
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="btn btn-sm btn-success shadow-sm"
                        disabled={variantSaving}
                      >
                        <i className="fas fa-plus"></i>{" "}
                        {variantSaving ? "Đang thêm..." : "Thêm biến thể"}
                      </button>
                    </form>

                    <div
                      className="table-responsive"
                      style={{ maxHeight: "300px" }}
                    >
                      <table className="table table-sm table-bordered table-striped">
                        <thead className="bg-light">
                          <tr>
                            <th>Size</th>
                            <th>Màu</th>
                            <th>Kho</th>
                            <th>Giá (nếu khác)</th>
                            <th style={{ width: "170px" }}>Ảnh</th>
                            <th className="text-center">Xóa</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.map((v) => (
                            <tr key={v.id}>
                              <td className="font-weight-bold">{v.size}</td>
                              <td>
                                {v.colorHexCode && (
                                  <span
                                    className="d-inline-block mr-2 border"
                                    style={{
                                      width: "14px",
                                      height: "14px",
                                      backgroundColor: v.colorHexCode,
                                      verticalAlign: "middle",
                                    }}
                                  ></span>
                                )}
                                {v.color}
                              </td>
                              <td>{v.stock}</td>
                              <td>{v.price?.toLocaleString()} đ</td>
                              <td>
                                <ImageDropzone
                                  value={v.imageUrl || ""}
                                  folder="variants"
                                  compact
                                  onChange={async (imageUrl) => {
                                    await productVariantApi.update(v.id, {
                                      imageUrl,
                                    });
                                    await loadRelatedData(editingProduct.id);
                                  }}
                                />
                              </td>
                              <td className="text-center">
                                <button
                                  className="btn btn-link text-danger p-0"
                                  onClick={() => deleteVariant(v.id)}
                                >
                                  <i className="fas fa-times-circle"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                          {variants.length === 0 && (
                            <tr>
                              <td
                                colSpan="6"
                                className="text-center py-3 text-muted"
                              >
                                Chưa có biến thể nào
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "origins" && (
                  <div className="origin-manager">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="font-weight-bold mb-0">
                        Liên kết quốc gia xuất xứ
                      </h6>
                    </div>

                    <form
                      onSubmit={addOrigin}
                      className="border rounded bg-light p-3 mb-3"
                    >
                      {originFormError && (
                        <div className="alert alert-danger py-2 mb-3">
                          {originFormError}
                        </div>
                      )}
                      <div className="form-row align-items-end">
                        <div className="form-group col-md-8 mb-md-0">
                          <label className="small font-weight-bold text-uppercase">
                            Chọn xuất xứ
                          </label>
                          <select
                            className="form-control"
                            value={originIdToAdd}
                            onChange={(e) => setOriginIdToAdd(e.target.value)}
                            required
                          >
                            <option value="">Chọn xuất xứ</option>
                            {allOrigins.map((origin) => (
                              <option key={origin.id} value={origin.id}>
                                {origin.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group col-md-4 mb-0">
                          <button
                            type="submit"
                            className="btn btn-success btn-block shadow-sm"
                            disabled={originSaving || allOrigins.length === 0}
                          >
                            <i className="fas fa-link"></i>{" "}
                            {originSaving
                              ? "Đang lưu..."
                              : productOrigins.length > 0
                                ? "Cập nhật xuất xứ"
                                : "Ghép xuất xứ"}
                          </button>
                        </div>
                      </div>
                    </form>

                    <div className="row">
                      {productOrigins.map((po) => (
                        <div className="col-md-6 mb-2" key={po.id}>
                          <div className="p-2 border rounded d-flex justify-content-between align-items-center bg-white shadow-sm">
                            <span className="font-weight-bold">
                              <i className="fas fa-map-marker-alt text-primary mr-2"></i>
                              {allOrigins.find((o) => o.id === po.originId)
                                ?.name || `ID: ${po.originId}`}
                            </span>
                            <button
                              className="btn btn-sm text-danger"
                              onClick={() => deleteProductOrigin(po.id)}
                            >
                              <i className="fas fa-unlink"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                      {productOrigins.length === 0 && (
                        <div className="col-12 text-center py-4 text-muted">
                          Sản phẩm này chưa được gán xuất xứ
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Đóng
                </button>
                {activeTab === "general" && (
                  <button
                    type="submit"
                    form="productForm"
                    className="btn btn-primary"
                  >
                    {editingProduct ? "Cập nhật thay đổi" : "Tạo sản phẩm ngay"}
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
