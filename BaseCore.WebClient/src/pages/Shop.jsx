import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import LayoutPublic from "../components/LayoutPublic";
import { cartStorage, categoryApi, productApi, metadataApi, wishlistApi } from "../services/api";
import { alertSuccess, alertError } from "../services/swal";

const Shop = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sizes, setSizes] = useState([]);
    const [colors, setColors] = useState([]);

    const [keyword, setKeyword] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sizeId, setSizeId] = useState("");
    const [colorId, setColorId] = useState("");

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchParams, setSearchParams] = useSearchParams();
    const [error, setError] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [wishlist, setWishlist] = useState([]);
    const navigate = useNavigate();

    const loadData = async (filters) => {
        const response = await productApi.search({
            keyword: filters.keyword || undefined,
            categoryId: filters.categoryId || undefined,
            minPrice: filters.minPrice || undefined,
            maxPrice: filters.maxPrice || undefined,
            sizeId: filters.sizeId || undefined,
            colorId: filters.colorId || undefined,
            sortBy: filters.sortBy || "newest",
            page: filters.page,
            pageSize: 40,
        });
        setItems(response.data.items || []);
        setTotalPages(response.data.totalPages || 1);
    };

    const loadMetadata = async () => {
        try {
            const [catRes, sizeRes, colorRes] = await Promise.all([
                categoryApi.getAll(),
                metadataApi.getSizes(),
                metadataApi.getColors()
            ]);
            setCategories(catRes.data || []);
            setSizes(sizeRes.data || []);
            setColors(colorRes.data || []);
        } catch (err) {
            console.error("Failed to load metadata", err);
        }
    };

    const loadWishlist = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            if (token) {
                const res = await wishlistApi.get();
                setWishlist(res.data || []);
            } else {
                setWishlist([]);
            }
        } catch (err) {
            console.error("Failed to load wishlist", err);
        }
    };

    useEffect(() => {
        loadMetadata();
        loadWishlist();
    }, []);

    useEffect(() => {
        const queryPage = Number(searchParams.get("page") || 1);
        const nextFilters = {
            keyword: searchParams.get("keyword") || "",
            categoryId: searchParams.get("categoryId") || "",
            minPrice: searchParams.get("minPrice") || "",
            maxPrice: searchParams.get("maxPrice") || "",
            sizeId: searchParams.get("sizeId") || "",
            colorId: searchParams.get("colorId") || "",
            sortBy: searchParams.get("sortBy") || "newest",
            page: Number.isFinite(queryPage) && queryPage > 0 ? queryPage : 1,
        };

        setKeyword(nextFilters.keyword);
        setCategoryId(nextFilters.categoryId);
        setMinPrice(nextFilters.minPrice);
        setMaxPrice(nextFilters.maxPrice);
        setSizeId(nextFilters.sizeId);
        setColorId(nextFilters.colorId);
        setSortBy(nextFilters.sortBy);
        setPage(nextFilters.page);
        setError("");

        loadData(nextFilters).catch(() => {
            setItems([]);
            setTotalPages(1);
            setError("Không thể tải danh sách sản phẩm.");
        });
    }, [searchParams]);

    const buildSearchParams = (nextPage = 1, overrides = {}) => {
        const nextFilters = {
            keyword,
            categoryId,
            minPrice,
            maxPrice,
            sizeId,
            colorId,
            sortBy,
            ...overrides,
        };
        const params = new URLSearchParams();
        const normalizedKeyword = String(nextFilters.keyword || "").trim();
        const normalizedMinPrice = String(nextFilters.minPrice ?? "").trim();
        const normalizedMaxPrice = String(nextFilters.maxPrice ?? "").trim();

        if (normalizedKeyword) params.set("keyword", normalizedKeyword);
        if (nextFilters.categoryId) params.set("categoryId", nextFilters.categoryId);
        if (normalizedMinPrice) params.set("minPrice", normalizedMinPrice);
        if (normalizedMaxPrice) params.set("maxPrice", normalizedMaxPrice);
        if (nextFilters.sizeId) params.set("sizeId", nextFilters.sizeId);
        if (nextFilters.colorId) params.set("colorId", nextFilters.colorId);
        if (nextFilters.sortBy && nextFilters.sortBy !== "newest") {
            params.set("sortBy", nextFilters.sortBy);
        }
        if (nextPage > 1) params.set("page", String(nextPage));

        return params;
    };

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        const min = minPrice === "" ? null : Number(minPrice);
        const max = maxPrice === "" ? null : Number(maxPrice);

        if ((min !== null && (!Number.isFinite(min) || min < 0)) ||
            (max !== null && (!Number.isFinite(max) || max < 0))) {
            setError("Khoảng giá phải là số không âm.");
            return;
        }

        if (min !== null && max !== null && min > max) {
            setError("Giá từ không được lớn hơn giá đến.");
            return;
        }

        setError("");
        setSearchParams(buildSearchParams(1));
    };

    const handlePageChange = (nextPage) => {
        setSearchParams(buildSearchParams(nextPage));
        window.scrollTo(0, 0);
    };

    const handleSortChange = (nextSort) => {
        setSortBy(nextSort);
        setSearchParams(buildSearchParams(1, { sortBy: nextSort }));
    };

    const addToCart = (product) => {
        cartStorage.addItem(product, 1);
        alertSuccess("Đã thêm!", `${product.name} đã được thêm vào giỏ hàng.`);
    };

    const toggleWishlist = async (productId, variantId = null) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            alertError("Lỗi", "Vui lòng đăng nhập để sử dụng tính năng này.");
            return;
        }

        try {
            const isInWishlist = wishlist.some(
                x => x.productId === productId && (x.variantId || null) === (variantId || null)
            );
            if (isInWishlist) {
                await wishlistApi.remove(productId, variantId);
                alertSuccess("Đã xóa!", "Sản phẩm đã được xóa khỏi danh sách yêu thích.");
            } else {
                await wishlistApi.add(productId, variantId);
                alertSuccess("Đã thêm!", "Sản phẩm đã được thêm vào danh sách yêu thích.");
            }
            await loadWishlist();
        } catch (err) {
            const message = err?.response?.data?.message
                || "Không thể cập nhật danh sách yêu thích.";
            alertError("Lỗi", message);
        }
    };

    const buyNow = (product) => {
        cartStorage.addItem(product, 1);
        navigate("/shopping-cart");
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
                                {/* Categories */}
                                <div className="filter-group mb-4">
                                    <h5 className="filter-title">
                                        <i className="fa fa-list mr-2"></i>DANH MỤC
                                    </h5>
                                    <ul className="filter-list mt-3">
                                        <li
                                            className={!categoryId ? "active" : ""}
                                            onClick={() => {
                                                setCategoryId("");
                                                setSearchParams(buildSearchParams(1, { categoryId: "" }));
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
                                                    setSearchParams(buildSearchParams(1, { categoryId: c.id }));
                                                }}
                                            >
                                                {c.name}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Price Range */}
                                <div className="filter-group mb-4 border-top pt-3">
                                    <h5 className="filter-title">
                                        <i className="fa fa-filter mr-2"></i>KHOẢNG GIÁ
                                    </h5>
                                    <div className="filter-content mt-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <input
                                                 type="number"
                                                 min="0"
                                                className="form-control form-control-sm"
                                                placeholder="₫ TỪ"
                                                value={minPrice}
                                                onChange={(e) => setMinPrice(e.target.value)}
                                            />
                                            <span className="mx-2">-</span>
                                            <input
                                                 type="number"
                                                 min="0"
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
                                    </div>
                                </div>

                                {/* Sizes Filter */}
                                <div className="filter-group mb-4 border-top pt-3">
                                    <h5 className="filter-title">KÍCH THƯỚC</h5>
                                    <div className="filter-content mt-2 d-flex flex-wrap">
                                        {sizes.map(s => (
                                            <div
                                                key={s.id}
                                                className={`filter-tag ${sizeId == s.id ? 'active' : ''}`}
                                                onClick={() => {
                                                    const nextSize = sizeId == s.id ? "" : s.id;
                                                    setSizeId(nextSize);
                                                    setSearchParams(buildSearchParams(1, { sizeId: nextSize }));
                                                }}
                                            >
                                                {s.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Colors Filter */}
                                <div className="filter-group mb-4 border-top pt-3">
                                    <h5 className="filter-title">MÀU SẮC</h5>
                                    <div className="filter-content mt-2 d-flex flex-wrap">
                                        {colors.map(c => (
                                            <div
                                                key={c.id}
                                                className={`filter-tag color-tag ${colorId == c.id ? 'active' : ''}`}
                                                onClick={() => {
                                                    const nextColor = colorId == c.id ? "" : c.id;
                                                    setColorId(nextColor);
                                                    setSearchParams(buildSearchParams(1, { colorId: nextColor }));
                                                }}
                                            >
                                                {c.name}
                                            </div>
                                        ))}
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
                                            setSizeId("");
                                            setColorId("");
                                            setSearchParams(new URLSearchParams());
                                        }}
                                    >
                                        XÓA TẤT CẢ
                                    </button>
                                    {error && (
                                        <small className="text-danger mt-2 d-block text-center">
                                            {error}
                                        </small>
                                    )}
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
                                        onClick={() => handleSortChange("popular")}
                                    >
                                        Phổ biến
                                    </button>
                                    <button
                                        className={`btn btn-sm px-4 ${sortBy === "newest" ? "btn-warning text-white" : "btn-light"}`}
                                        onClick={() => handleSortChange("newest")}
                                    >
                                        Mới nhất
                                    </button>
                                    <button
                                        className={`btn btn-sm px-4 ${sortBy === "sales" ? "btn-warning text-white" : "btn-light"}`}
                                        onClick={() => handleSortChange("sales")}
                                    >
                                        Bán chạy
                                    </button>
                                </div>
                                <select
                                    className="form-control form-control-sm w-auto mr-auto"
                                    value={["price-asc", "price-desc"].includes(sortBy) ? sortBy : ""}
                                    onChange={(e) => handleSortChange(e.target.value || "newest")}
                                >
                                    <option value="">Giá</option>
                                    <option value="price-asc">Giá: Thấp đến Cao</option>
                                    <option value="price-desc">Giá: Cao đến Thấp</option>
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
                                                        <a
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                toggleWishlist(item.id, null);
                                                            }}
                                                            className={wishlist.some(x => x.productId === item.id && (x.variantId || null) === null) ? "text-warning" : ""}
                                                        >
                                                            <i className={wishlist.some(x => x.productId === item.id && (x.variantId || null) === null) ? "fa fa-heart" : "fa fa-heart-o"}></i>
                                                            <span className="tooltip-text">Yêu thích</span>
                                                        </a>
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
                                                            Đã bán {item.soldCount || 0}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-warning text-white mt-2 w-100"
                                                        onClick={() => buyNow(item)}
                                                    >
                                                        Mua ngay
                                                    </button>
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
