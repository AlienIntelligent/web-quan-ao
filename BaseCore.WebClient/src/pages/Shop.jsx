import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { cartStorage, categoryApi, productApi } from "../services/api";

const Shop = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = async () => {
    const response = await productApi.search({
      keyword: keyword || undefined,
      categoryId: categoryId || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      page,
      pageSize: 9,
    });
    setItems(response.data.items || []);
    setTotalPages(response.data.totalPages || 1);
  };

  useEffect(() => {
    categoryApi.getAll().then((res) => setCategories(res.data || []));
  }, []);

  useEffect(() => {
    loadData();
  }, [page]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setPage(1);
    await loadData();
  };

  const addToCart = (product) => {
    cartStorage.addItem(product, 1);
    alert("Da them vao gio hang");
  };

  const resolveProductImage = (item) => {
    const raw = item?.imageUrl;
    if (!raw || !String(raw).trim()) return "/img/products/product-1.jpg";
    if (String(raw).startsWith("http://") || String(raw).startsWith("https://") || String(raw).startsWith("/")) {
      return raw;
    }
    if (String(raw).includes("/")) {
      return `/img/${raw}`;
    }
    return `/img/products/${raw}`;
  };

  return (
    <LayoutPublic>
      {/* Breadcrumb Section Begin */}
      <section className="breadcrumb-section set-bg" data-setbg="/img/breadcrumb.jpg">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2>Cửa hàng</h2>
            </div>
          </div>
        </div>
      </section>
      {/* Breadcrumb Section End */}

      {/* Shop Section Begin */}
      <section className="product-shop spad">
        <div className="container">
          <div className="row">
            <div className="col-lg-3">
              <div className="blog-sidebar">
                <form className="search-form" onSubmit={handleSearch}>
                  <h4>Tìm sản phẩm</h4>
                  <input
                    className="mb-2"
                    placeholder="Tên sản phẩm"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                  <select
                    className="mb-2"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Tất cả danh mục</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <input
                    className="mb-2"
                    type="number"
                    min="0"
                    placeholder="Giá từ"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <input
                    className="mb-3"
                    type="number"
                    min="0"
                    placeholder="Giá đến"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                  <button type="submit" className="primary-btn">
                    Tìm kiếm
                  </button>
                </form>
              </div>
            </div>
            <div className="col-lg-9">
              <div className="product-show-option">
                <div className="row">
                  <div className="col-lg-7 col-md-7">
                    <div className="select-option">
                      <p>
                        Page {page} / {totalPages}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="row">
                {items.map((item) => (
                  <div className="col-lg-4 col-md-6" key={item.id}>
                    <div className="product-item">
                      <div className="pi-pic">
                        <img src={resolveProductImage(item)} alt={item.name} />
                        <div className="icon">
                          <i className="icon_heart_alt"></i>
                        </div>
                        <ul>
                          <li className="w-icon active">
                            <a href="#" onClick={(e) => { e.preventDefault(); addToCart(item); }}>
                              <i className="icon_bag_alt"></i>
                            </a>
                          </li>
                          <li className="quick-view">
                            <Link to={`/product/${item.id}`}>+ Xem nhanh</Link>
                          </li>
                        </ul>
                      </div>
                      <div className="pi-text">
                        <div className="catagory-name">{item.category?.name || "Danh mục"}</div>
                        <h5>{item.name}</h5>
                        <div className="product-price">
                          ${Number(item.price || 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <p className="ml-3">Không có sản phẩm phù hợp.</p>}
              </div>
              <div className="loading-more">
                <button
                  className="primary-btn mr-2"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trước
                </button>
                <button
                  className="primary-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Shop Section End */}
    </LayoutPublic>
  );
};

export default Shop;
