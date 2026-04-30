import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [error, setError] = useState("");

  const loadData = async (filters) => {
    const response = await productApi.search({
      keyword: filters.keyword || undefined,
      categoryId: filters.categoryId || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      page: filters.page,
      pageSize: 9,
    });
    setItems(response.data.items || []);
    setTotalPages(response.data.totalPages || 1);
  };

  useEffect(() => {
    categoryApi.getAll().then((res) => setCategories(res.data || []));
  }, []);

  useEffect(() => {
    const queryPage = Number(searchParams.get("page") || 1);
    const nextFilters = {
      keyword: searchParams.get("keyword") || "",
      categoryId: searchParams.get("categoryId") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      page: Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1,
    };

    setKeyword(nextFilters.keyword);
    setCategoryId(nextFilters.categoryId);
    setMinPrice(nextFilters.minPrice);
    setMaxPrice(nextFilters.maxPrice);
    setPage(nextFilters.page);
    setError("");
    loadData(nextFilters).catch(() => {
      setItems([]);
      setTotalPages(1);
      setError("Không thể tải danh sách sản phẩm.");
    });
  }, [searchParams]);

  const buildSearchParams = (nextPage = 1) => {
    const params = new URLSearchParams();
    const normalizedKeyword = keyword.trim();
    const normalizedMinPrice = minPrice.trim();
    const normalizedMaxPrice = maxPrice.trim();

    if (normalizedKeyword) params.set("keyword", normalizedKeyword);
    if (categoryId) params.set("categoryId", categoryId);
    if (normalizedMinPrice) params.set("minPrice", normalizedMinPrice);
    if (normalizedMaxPrice) params.set("maxPrice", normalizedMaxPrice);
    if (nextPage > 1) params.set("page", String(nextPage));

    return params;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    if (min !== null && max !== null && min > max) {
      setError("Giá từ không được lớn hơn giá đến.");
      return;
    }

    setSearchParams(buildSearchParams(1));
  };

  const handlePageChange = (nextPage) => {
    setSearchParams(buildSearchParams(nextPage));
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
  const formatMoney = (value) =>
    Number(value || 0).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

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
                  {error && <p className="text-danger mt-2 mb-0">{error}</p>}
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
                          {formatMoney(item.price)}
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
                  onClick={() => handlePageChange(page - 1)}
                >
                  Trước
                </button>
                <button
                  className="primary-btn"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
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
