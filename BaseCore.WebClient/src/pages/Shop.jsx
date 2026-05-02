import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { cartStorage, categoryApi, productApi } from "../services/api";
import { alertSuccess } from "../services/swal";

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
  const [sortBy, setSortBy] = useState("newest");

  const loadData = async (filters) => {
    const response = await productApi.search({
      keyword: filters.keyword || undefined,
      categoryId: filters.categoryId || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      page: filters.page,
      pageSize: 40,
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
    if (e) e.preventDefault();
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
    window.scrollTo(0, 0);
  };

  const addToCart = (product) => {
    cartStorage.addItem(product, 1);
    alertSuccess("Đã thêm!", `${product.name} đã được thêm vào giỏ hàng.`);
  };

  const resolveProductImage = (item) => {
    const raw = item?.imageUrl;
    if (!raw || !String(raw).trim()) return "/img/products/product-1.jpg";
    if (
      String(raw).startsWith("http://") ||
      String(raw).startsWith("https://") ||
      String(raw).startsWith("/")
    ) {
      return raw;
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
      <div className="shop-page-wrapper bg-light py-4">
        <div className="container-fluid px-lg-5">
          <div className="row">
            {/* Sidebar Filters */}
            <div className="col-lg-2 col-md-3">
              <div className="shopee-sidebar">
                <div className="filter-group mb-4">
                  <h5 className="filter-title">
                    <i className="fa fa-list mr-2"></i>TẤT CẢ DANH MỤC
                  </h5>
                  <ul className="filter-list mt-3">
                    <li
                      className={!categoryId ? "active" : ""}
                      onClick={() => {
                        setCategoryId("");
                        setSearchParams(buildSearchParams(1));
                      }}
                    >
                      Tất cả sản phẩm
                    </li>
                    {categories.map((c) => (
                      <li
                        key={c.id}
                        className={categoryId == c.id ? "active" : ""}
                        onClick={() => {
                          setCategoryId(c.id);
                          setSearchParams(buildSearchParams(1));
                        }}
                      >
                        {c.name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="filter-group mb-4">
                  <h5 className="filter-title">
                    <i className="fa fa-filter mr-2"></i>BỘ LỌC TÌM KIẾM
                  </h5>
                  <div className="filter-content mt-3">
                    <p
                      className="mb-2 font-weight-bold"
                      style={{ fontSize: "14px" }}
                    >
                      Khoảng giá
                    </p>
                    <div className="d-flex align-items-center mb-2">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="₫ TỪ"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />
                      <span className="mx-2">-</span>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        placeholder="₫ ĐẾN"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </div>
                    <button
                      className="btn btn-warning btn-sm btn-block text-white font-weight-bold"
                      onClick={handleSearch}
                    >
                      ÁP DỤNG
                    </button>
                    {error && (
                      <small className="text-danger mt-1 d-block">
                        {error}
                      </small>
                    )}
                  </div>
                </div>

                <div className="filter-group">
                  <button
                    className="btn btn-outline-warning btn-sm btn-block mt-2 font-weight-bold"
                    onClick={() => {
                      setKeyword("");
                      setCategoryId("");
                      setMinPrice("");
                      setMaxPrice("");
                      setSearchParams(new URLSearchParams());
                    }}
                  >
                    XÓA TẤT CẢ
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="col-lg-10 col-md-9">
              {/* Sort Bar */}
              <div className="shopee-sort-bar d-flex align-items-center p-3 mb-3 bg-white shadow-sm rounded">
                <span className="mr-3" style={{ fontSize: "14px" }}>
                  Sắp xếp theo
                </span>
                <div className="btn-group mr-3">
                  <button
                    className={`btn btn-sm px-4 ${sortBy === "popular" ? "btn-warning text-white" : "btn-light"}`}
                    onClick={() => setSortBy("popular")}
                  >
                    Phổ biến
                  </button>
                  <button
                    className={`btn btn-sm px-4 ${sortBy === "newest" ? "btn-warning text-white" : "btn-light"}`}
                    onClick={() => setSortBy("newest")}
                  >
                    Mới nhất
                  </button>
                  <button
                    className={`btn btn-sm px-4 ${sortBy === "sales" ? "btn-warning text-white" : "btn-light"}`}
                    onClick={() => setSortBy("sales")}
                  >
                    Bán chạy
                  </button>
                </div>
                <select
                  className="form-control form-control-sm w-auto mr-auto"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="">Giá</option>
                  <option value="lowToHigh">Giá: Thấp đến Cao</option>
                  <option value="highToLow">Giá: Cao đến Thấp</option>
                </select>
                <div className="pagination-info" style={{ fontSize: "14px" }}>
                  <span className="text-warning font-weight-bold">{page}</span>/
                  {totalPages}
                  <button
                    className="btn btn-sm btn-light ml-2 border"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    <i className="fa fa-chevron-left"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-light ml-1 border"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    <i className="fa fa-chevron-right"></i>
                  </button>
                </div>
              </div>

              {/* Product Grid */}
              <div className="shopee-product-grid">
                {items.map((item) => (
                  <div className="shopee-product-column" key={item.id}>
                    <div className="product-item bg-white">
                      <div className="pi-pic product-square">
                        <img src={resolveProductImage(item)} alt={item.name} />
                        {item.originalPrice > item.price && (
                          <div className="sale">
                            -{Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}%
                          </div>
                        )}
                        <ul>
                          <li className="w-icon">
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                addToCart(item);
                              }}
                            >
                              <i className="icon_bag_alt"></i>
                              <span className="tooltip-text">Thêm vào giỏ</span>
                            </a>
                          </li>
                          <li className="w-icon">
                            <Link to={`/product/${item.id}`}>
                              <i className="fa fa-eye"></i>
                              <span className="tooltip-text">Chi tiết</span>
                            </Link>
                          </li>
                          <li className="w-icon">
                            <Link to={`/shop?categoryId=${item.categoryId}`}>
                              <i className="fa fa-random"></i>
                              <span className="tooltip-text">Tương tự</span>
                            </Link>
                          </li>
                        </ul>
                      </div>
                      <div className="pi-text p-2">
                        <Link to={`/product/${item.id}`}>
                          <h5
                            className="product-name-limit mb-2 text-dark"
                            style={{ fontSize: "12px", height: "34px" }}
                          >
                            {item.name}
                          </h5>
                        </Link>
                        <div className="mt-auto">
                          {item.originalPrice > item.price && (
                            <div
                              className="old-price small text-muted text-decoration-line-through mb-0"
                              style={{ fontSize: "11px", textAlign: "left" }}
                            >
                              {formatMoney(item.originalPrice)}
                            </div>
                          )}
                          <div className="d-flex align-items-center justify-content-between">
                            <div
                              className="product-price text-warning font-weight-bold"
                              style={{ fontSize: "14px", textAlign: "left" }}
                            >
                              {formatMoney(item.price)}
                            </div>
                            <div
                              className="sold-count text-muted"
                              style={{ fontSize: "10px" }}
                            >
                              Đã bán {Math.floor(Math.random() * 100)}+
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <div className="w-100 text-center py-5 bg-white shadow-sm">
                    <i
                      className="fa fa-search text-muted mb-3"
                      style={{ fontSize: "48px" }}
                    ></i>
                    <p className="text-muted">
                      Không tìm thấy sản phẩm nào khớp với lựa chọn của bạn.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Pagination */}
              <div className="d-flex justify-content-center mt-5">
                <nav>
                  <ul className="pagination shopee-pagination">
                    <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page - 1)}
                      >
                        <i className="fa fa-angle-left"></i>
                      </button>
                    </li>
                    {[...Array(totalPages)]
                      .map((_, i) => (
                        <li
                          key={i}
                          className={`page-item ${page === i + 1 ? "active" : ""}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(i + 1)}
                          >
                            {i + 1}
                          </button>
                        </li>
                      ))
                      .slice(
                        Math.max(0, page - 3),
                        Math.min(totalPages, page + 2),
                      )}
                    <li
                      className={`page-item ${page >= totalPages ? "disabled" : ""}`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page + 1)}
                      >
                        <i className="fa fa-angle-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutPublic>
  );
};

export default Shop;
