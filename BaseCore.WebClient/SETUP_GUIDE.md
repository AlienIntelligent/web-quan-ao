# 🎨 Hướng Dẫn Nhanh Gọn: Fashi Template → React

## ✅ Hoàn Thành Setup

Bạn đã chuyển đổi template Fashi HTML5 Bootstrap 4 sang React frontend. Dưới đây là những gì đã được tạo:

### 📦 Cấu Trúc Mới

```
src/
├── components/
│   ├── Header.jsx          ← Navigation, search, cart
│   ├── Footer.jsx          ← Footer với links
│   ├── LayoutPublic.jsx    ← Wrapper cho public pages
│   └── ... (existing components)
├── pages/
│   ├── Home.jsx            ← Trang chủ
│   ├── Shop.jsx            ← Danh sách sản phẩm
│   ├── Product.jsx         ← Chi tiết sản phẩm (/:id)
│   ├── ShoppingCart.jsx    ← Giỏ hàng
│   ├── Register.jsx        ← Đăng ký
│   ├── Contact.jsx         ← Liên hệ
│   ├── Checkout.jsx        ← Thanh toán
│   ├── Blog.jsx            ← Danh sách blog
│   ├── BlogDetails.jsx     ← Chi tiết blog (/:id)
│   └── ... (existing pages)
├── assets/
│   └── css/
│       └── fashi-template.css  ← CSS styling
└── App.jsx                 ← Updated routes

public/
└── img/
    ├── products/           ← Product images (to be added)
    └── blog/              ← Blog images (to be added)
```

### 🔗 Routes Có Sẵn

```
/home              → Home page
/shop              → Shop
/product/:id       → Product detail (vd: /product/1)
/shopping-cart     → Shopping cart
/register          → Register
/contact           → Contact
/check-out         → Checkout
/blog              → Blog list
/blog-details/:id  → Blog detail (vd: /blog-details/1)
```

---

## 🚀 Bước Tiếp Theo

### 1️⃣ **Thêm Images (Quan Trọng)**

Images chưa có. Bạn có 3 tùy chọn:

**Option A: Sử dụng Placeholder Service (Nhanh nhất)**

```javascript
// Mọi <img src="/img/..." /> sẽ tự động xử lý
// Hoặc sử dụng: https://via.placeholder.com/400x300
```

**Option B: Copy images từ template gốc**

```bash
# Nếu bạn có images từ template gốc:
# Copy vào: public/img/
```

**Option C: Upload images lên CDN**

```bash
# Sử dụng service như Cloudinary, AWS S3, v.v.
# Update URLs trong pages
```

---

### 2️⃣ **Tích Hợp Backend API**

Cập nhật các pages để fetch data thực tế:

**Ví dụ: Shop.jsx**

```javascript
import { useEffect, useState } from "react";
import api from "../services/api";

const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  api
    .get("/products")
    .then((res) => setProducts(res.data))
    .catch((err) => console.error(err))
    .finally(() => setLoading(false));
}, []);
```

**Ví dụ: Product.jsx**

```javascript
const { id } = useParams();
const [product, setProduct] = useState(null);

useEffect(() => {
  api.get(`/products/${id}`).then((res) => setProduct(res.data));
}, [id]);
```

---

### 3️⃣ **Thêm Chức Năng**

#### Shopping Cart

```javascript
// Tạo Context hoặc State cho cart
// Thêm add/remove/update logic
// Sync với localStorage hoặc backend
```

#### Forms (Register, Contact, Checkout)

```javascript
// Thêm validation
// Submit tới API
// Handle success/error states
```

#### Blog

```javascript
// Fetch blog list từ API
// Fetch single blog by ID
// Add comments functionality
```

---

### 4️⃣ **CSS Customization**

Sửa màu sắc trong `src/assets/css/fashi-template.css`:

```css
:root {
    --primary-color: #c1666b;      ← Màu chính
    --secondary-color: #d4a574;    ← Màu phụ
    --dark-color: #272829;         ← Màu tối
    --light-color: #f5f5f5;        ← Màu sáng
}
```

---

### 5️⃣ **Thêm Libraries (Nếu Cần)**

```bash
# Carousel/Slider
npm install swiper react-swiper

# Toast notifications
npm install react-hot-toast

# Form handling
npm install react-hook-form

# Date picker
npm install react-datepicker

# Loading spinner
npm install react-spinner-loader
```

---

### 6️⃣ **Deploy**

```bash
# Build project
npm run build

# Output: dist/ folder
# Deploy dist/ folder tới hosting (Vercel, Netlify, v.v.)
```

---

## 📋 Checklist

- [ ] Thêm images vào `public/img/`
- [ ] Kết nối API endpoints
- [ ] Implement shopping cart logic
- [ ] Thêm form validation
- [ ] Test tất cả routes
- [ ] Customize CSS/colors
- [ ] Setup authentication flow
- [ ] Test responsive design
- [ ] Build & deploy

---

## 🐛 Troubleshooting

**Images không hiển thị?**

```
→ Kiểm tra đường dẫn trong <img src="/img/..." />
→ Đảm bảo files nằm trong public/img/ folder
```

**Routes không hoạt động?**

```
→ Kiểm tra Link to="/path" trong components
→ Verify routes trong App.jsx
```

**CSS không áp dụng?**

```
→ Kiểm tra import trong main.jsx
→ Hard refresh browser (Ctrl+Shift+R)
```

---

## 💡 Tips

1. **Reusable Components**: Tạo thêm components cho ProductCard, BlogCard, etc.
2. **State Management**: Sử dụng Context API hoặc Redux cho state phức tạp
3. **Performance**: Lazy load images, code splitting
4. **SEO**: Thêm meta tags, Open Graph

---

## 📞 Support

Cần giúp thêm tính năng? Hãy:

1. Tạo component mới theo cấu trúc hiện tại
2. Update routing trong App.jsx
3. Import & sử dụng trong LayoutPublic

---

**Happy Coding! 🎉**
