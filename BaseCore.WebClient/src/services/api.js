import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authApi = {
    login: (username, password) => api.post('/auth/login', { username, password }),
    register: (data) => api.post('/auth/register', data),
};

// User API
export const userApi = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
};

// Product API
export const productApi = {
    getAll: (params) => api.get('/products', { params }),
    search: (params) => api.get('/products', { params }),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
};

// Product-Variant API (size/color/stock/price)
export const productVariantApi = {
    getAll: (params) => api.get('/product-variants', { params }),
    getById: (id) => api.get(`/product-variants/${id}`),
    create: (data) => api.post('/product-variants', data),
    update: (id, data) => api.put(`/product-variants/${id}`, data),
    delete: (id) => api.delete(`/product-variants/${id}`),
};

// Metadata API (Sizes/Colors)
export const metadataApi = {
    getSizes: () => api.get('/sizes'),
    getColors: () => api.get('/colors'),
};

// Review API (rating/comment)
export const reviewApi = {
    getByProductId: (productId, params = {}) =>
        api.get('/reviews', { params: { productId, ...params } }),
    getById: (id) => api.get(`/reviews/${id}`),
    create: (data) => api.post('/reviews', data),
    update: (id, data) => api.put(`/reviews/${id}`, data),
    delete: (id) => api.delete(`/reviews/${id}`),
};

// Category API
export const categoryApi = {
    getAll: () => api.get('/categories'),
    getById: (id) => api.get(`/categories/${id}`),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

// Order API
export const orderApi = {
    create: (data) => api.post('/orders', data),
    checkout: (data) => api.post('/orders/checkout', data),
    userCancel: (id) => api.put(`/orders/${id}/user-cancel`),
    getMyOrders: () => api.get('/orders'),
    getById: (id) => api.get(`/orders/${id}`),
    getAll: (params) => api.get('/orders/all', { params }),
    updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
    cancel: (id) => api.put(`/orders/${id}/cancel`),
};

// Cart API
export const cartApi = {
    get: () => api.get('/cart'),
    add: (data) => api.post('/cart/add', data),
    update: (data) => api.put('/cart/update', data),
    remove: (productId, variantId) => api.delete('/cart/remove', { params: { productId, variantId } }),
    clear: () => api.delete('/cart/clear'),
};

// Wishlist API
export const wishlistApi = {
    get: () => api.get('/wishlist'),
    add: (productId, variantId) => api.post('/wishlist/add', { productId, variantId }),
    remove: (productId, variantId) => api.delete('/wishlist/remove', { params: { productId, variantId } }),
    check: (productId, variantId) => api.get('/wishlist/check', { params: { productId, variantId } }),
    clear: () => api.delete('/wishlist/clear'),
};

// Analytics API
export const analyticsApi = {
    getStats: () => api.get('/analytics/stats'),
    getRevenue: (start, end) => api.get('/analytics/revenue', { params: { start, end } }),
    getBestSellers: (top = 5) => api.get('/analytics/best-sellers', { params: { top } }),
};

// Origin API
export const originApi = {
    getAll: (params) => api.get('/origins', { params }),
    getById: (id) => api.get(`/origins/${id}`),
    create: (data) => api.post('/origins', data),
    update: (id, data) => api.put(`/origins/${id}`, data),
    delete: (id) => api.delete(`/origins/${id}`),
};

// Promotion API
export const promotionApi = {
    getAll: (params) => api.get('/promotions', { params }),
    getById: (id) => api.get(`/promotions/${id}`),
    validate: (data) => api.post('/promotions/validate', data),
    create: (data) => api.post('/promotions', data),
    update: (id, data) => api.put(`/promotions/${id}`, data),
    delete: (id) => api.delete(`/promotions/${id}`),
};

// Shipping API
export const shippingApi = {
    getAll: (params) => api.get('/shippings', { params }),
    getById: (id) => api.get(`/shippings/${id}`),
    create: (data) => api.post('/shippings', data),
    update: (id, data) => api.put(`/shippings/${id}`, data),
    delete: (id) => api.delete(`/shippings/${id}`),
};

// Product-Origin API
export const productOriginApi = {
    getAll: (params) => api.get('/product-origins', { params }),
    getById: (id) => api.get(`/product-origins/${id}`),
    create: (data) => api.post('/product-origins', data),
    update: (id, data) => api.put(`/product-origins/${id}`, data),
    delete: (id) => api.delete(`/product-origins/${id}`),
};

// Order-Detail API
export const orderDetailApi = {
    getAll: (params) => api.get('/order-details', { params }),
    getById: (id) => api.get(`/order-details/${id}`),
    create: (data) => api.post('/order-details', data),
    update: (id, data) => api.put(`/order-details/${id}`, data),
    delete: (id) => api.delete(`/order-details/${id}`),
};

const CART_KEY = 'fashi_cart';
const CART_EVENT = 'fashi-cart-updated';
const COUPON_KEY = 'fashi_coupon';
const COUPON_EVENT = 'fashi-coupon-updated';

const readCart = () => {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const writeCart = (items) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CART_EVENT));
};

export const cartStorage = {
    eventName: CART_EVENT,
    getItems: () => readCart(),
    addItem: (product, quantity = 1) => {
        const items = readCart();
        const variantId = product.variantId || 0;
        const existing = items.find((x) => x.productId === product.id && (x.variantId || 0) === variantId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            items.push({
                productId: product.id,
                variantId: variantId,
                name: product.name,
                price: product.price,
                size: product.size,
                color: product.color,
                imageUrl: product.imageUrl || '/img/products/product-1.jpg',
                quantity,
            });
        }
        writeCart(items);
    },
    updateQuantity: (productId, variantId, quantity) => {
        const items = readCart().map((x) =>
            (x.productId === productId && (x.variantId || 0) === (variantId || 0)) 
                ? { ...x, quantity: Math.max(1, quantity) } 
                : x
        );
        writeCart(items);
    },
    removeItem: (productId, variantId) => {
        writeCart(readCart().filter((x) => !(x.productId === productId && (x.variantId || 0) === (variantId || 0))));
    },
    clear: () => writeCart([]),
    getSummary: () => {
        const items = readCart();
        const count = items.reduce((sum, x) => sum + x.quantity, 0);
        const total = items.reduce((sum, x) => sum + x.quantity * x.price, 0);
        return { count, total, items };
    },
};

const readCoupon = () => {
    try {
        const raw = localStorage.getItem(COUPON_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const writeCoupon = (coupon) => {
    if (coupon) {
        localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
    } else {
        localStorage.removeItem(COUPON_KEY);
    }
    window.dispatchEvent(new Event(COUPON_EVENT));
};

export const couponStorage = {
    eventName: COUPON_EVENT,
    get: () => readCoupon(),
    set: (coupon) => writeCoupon(coupon),
    clear: () => writeCoupon(null),
};

const CHECKOUT_KEY = 'fashi_checkout_items';
export const checkoutStorage = {
    set: (items) => localStorage.setItem(CHECKOUT_KEY, JSON.stringify(items)),
    get: () => {
        try {
            const raw = localStorage.getItem(CHECKOUT_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    },
    clear: () => localStorage.removeItem(CHECKOUT_KEY),
};

export default api;
