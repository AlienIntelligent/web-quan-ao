import React, { useEffect, useMemo, useState } from "react";
import { productApi, productVariantApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const ProductVariantsAdmin = () => {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [variants, setVariants] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    productId: "",
    size: "",
    color: "",
    stock: 0,
    price: 0,
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.search({
        keyword: "",
        categoryId: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        page: 1,
        pageSize: 200,
      });

      const payload = res?.data || {};
      const items = payload?.items || [];
      setProducts(items);

      if (!selectedProductId && items.length > 0) {
        setSelectedProductId(String(items[0].id));
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async (pid) => {
    if (!pid) return;
    setLoading(true);
    try {
      const res = await productVariantApi.getAll({ productId: pid });
      setVariants(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Failed to load variants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedProductId) loadVariants(selectedProductId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductId]);

  const selectedProduct = useMemo(() => {
    return products.find((p) => String(p.id) === String(selectedProductId)) || null;
  }, [products, selectedProductId]);

  const openModal = (v = null) => {
    setError("");
    setEditing(v);
    if (v) {
      setFormData({
        productId: String(v.productId),
        size: v.size || "",
        color: v.color || "",
        stock: v.stock ?? 0,
        price: v.price ?? 0,
      });
    } else {
      setFormData({
        productId: selectedProductId || "",
        size: "",
        color: "",
        stock: 0,
        price: 0,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.productId) {
      setError("ProductId is required");
      return;
    }
    if (!formData.size?.trim()) {
      setError("Size is required");
      return;
    }
    try {
      const payload = {
        productId: parseInt(formData.productId, 10),
        size: formData.size.trim(),
        color: formData.color?.trim() ? formData.color.trim() : null,
        stock: parseInt(formData.stock, 10) || 0,
        price: parseFloat(formData.price) || 0,
      };

      if (editing) {
        await productVariantApi.update(editing.id, payload);
      } else {
        await productVariantApi.create(payload);
      }

      closeModal();
      await loadVariants(selectedProductId);
    } catch (e2) {
      console.error(e2);
      setError(e2?.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this variant?")) return;
    try {
      await productVariantApi.delete(id);
      await loadVariants(selectedProductId);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="content-wrapper">
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0">Product Variants Management</h1>
          <div className="mt-2">
            <small>
              {selectedProduct ? `Product: ${selectedProduct.name}` : "Select a product"}
            </small>
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="card">
            <div className="card-header">
              <div className="row">
                <div className="col-md-6">
                  <label>Product</label>
                  <select
                    className="form-control"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 text-right d-flex align-items-end justify-content-end">
                  {isAdmin() && (
                    <button
                      className="btn btn-success"
                      onClick={() => openModal(null)}
                      disabled={!selectedProductId}
                    >
                      <i className="fas fa-plus"></i> Add Variant
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" />
                </div>
              ) : (
                <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Size</th>
                      <th>Color</th>
                      <th>Stock</th>
                      <th>Price</th>
                      {isAdmin() && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {variants.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin() ? 7 : 6} className="text-center">
                          No data
                        </td>
                      </tr>
                    ) : (
                      variants.map((v) => (
                        <tr key={v.id}>
                          <td>{v.id}</td>
                          <td>{v.size}</td>
                          <td>{v.color ?? ""}</td>
                          <td>{v.stock}</td>
                          <td>{Number(v.price).toLocaleString()} VND</td>
                          {isAdmin() && (
                            <td>
                              <button
                                className="btn btn-sm btn-info mr-1"
                                onClick={() => openModal(v)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDelete(v.id)}
                              >
                                Delete
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
        <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editing ? "Edit Variant" : "Add Variant"}</h5>
                <button type="button" className="close" onClick={closeModal}>
                  <span>&times;</span>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="form-group">
                    <label>ProductId</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.productId}
                      onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Size</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.size}
                      onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Price</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editing ? "Update" : "Create"}
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

export default ProductVariantsAdmin;

