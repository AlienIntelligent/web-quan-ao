# Cập Nhật Luồng Tạo Vận Chuyển - Mã Vận Đơn & Phí Động

## 📋 Tóm Tắt Thay Đổi

### 1. Mã Vận Đơn Tự Động

**Pattern**: `SHIP-{orderId}`

- Ví dụ: `SHIP-123`, `SHIP-456`
- Tự động sinh khi mở modal tạo vận chuyển từ **Quản lý Đơn hàng**
- Không thể sửa khi tạo từ đơn hàng (disabled input)
- Có thể sửa sau khi đã tạo ở **Quản lý Vận chuyển**

### 2. Đơn Vị Vận Chuyển - SelectBox

**Thay đổi**: Input text → Dropdown select
**Danh sách có sẵn**:

- VNPost
- GHN
- Grab
- Viettel Post
- J&T
- FedEx
- DHL
- UPS

**Lợi ích**:
✓ Tính nhất quán dữ liệu
✓ Dễ filter/tìm kiếm
✓ Giảm lỗi nhập liệu

### 3. Phí Vận Chuyển Động (Dựa Trên Mã Giảm Giá)

**Logic**:

```javascript
if (order.discountAmount > 0) {
  // Nếu có mã giảm giá vận chuyển → Giảm 50% phí
  calculatedFee = Math.max(0, baseFee * 0.5);
} else {
  // Không có mã giảm giá → Phí mặc định
  calculatedFee = baseFee;
}
```

**Ví dụ**:

- Phí vận chuyển gốc: 30,000 VND
- Có mã giảm giá vận chuyển: 30,000 → 15,000 VND ✓
- Không có mã: 30,000 VND

## 🔄 Luồng Công Việc Cập Nhật

### Từ Quản Lý Đơn Hàng:

```
1. Tìm đơn hàng Status = CONFIRMED
   ↓
2. Bấp nút 🚚 "Tạo vận chuyển"
   ↓
3. Modal tạo vận chuyển mở:
   ✓ Mã vận đơn: SHIP-{orderId} [DISABLED - chỉ hiển thị]
   ✓ Đơn vị: [SelectBox - chọn từ danh sách]
   ✓ Phí: [Tính tự động từ discount]
   ✓ Phương thức: [SelectBox - Standard/Express]

4. Admin có thể sửa:
   - Phí vận chuyển (nếu cần)
   - Phương thức vận chuyển
   - Ngày dự kiến
   - Ghi chú

5. Bấm "Tạo vận chuyển" → Xuất hiện ở Quản lý Vận chuyển
```

### Từ Quản Lý Vận Chuyển (Manual):

```
1. Bấp nút "+ Thêm vận chuyển"
   ↓
2. Modal form mở:
   ✓ Mã vận đơn: [Editable text input]
   ✓ Đơn vị: [SelectBox - chọn từ danh sách]
   ✓ Phí: [Manual input]
   ✓ Các field khác

3. Có thể nhập tự do hoặc copy mã từ email/tin nhắn
```

## 📝 Các Tệp Đã Sửa

### OrdersAdmin.jsx

**Thêm:**

- `CARRIER_OPTIONS`: Danh sách đơn vị vận chuyển
- Logic tính phí dựa trên `order.discountAmount`
- Auto-generate `trackingCode` = `SHIP-${order.id}`
- Đổi input carrier thành selectbox
- Disable input mã vận đơn (chỉ hiển thị)

**Chi tiết thay đổi**:

```javascript
const openShippingModal = (order) => {
  // Tính phí vận chuyển
  let calculatedFee = order.shippingFee || 0;
  if (order.discountAmount > 0) {
    calculatedFee = Math.max(0, calculatedFee * 0.5);
  }

  // Tự động generate mã vận đơn
  setShippingForm({
    ...
    trackingCode: `SHIP-${order.id}`, // Auto
    shippingFee: calculatedFee, // Auto calculated
    ...
  });
};
```

### ShippingsAdmin.jsx

**Thêm:**

- `CARRIER_OPTIONS`: Danh sách đơn vị vận chuyển
- Đổi input carrier thành selectbox
- Thêm placeholder cho mã vận đơn

**Chi tiết**:

```javascript
const CARRIER_OPTIONS = [
  { value: "VNPost", label: "VNPost" },
  { value: "GHN", label: "GHN" },
  // ... etc
];
```

## 🎯 Quy Trình Kiểm Thử

### Test Auto-Generate Mã Vận Đơn:

1. ✓ Tạo đơn hàng mới (ID = 123)
2. ✓ Xác nhận đơn (CONFIRMED)
3. ✓ Bấp nút 🚚 "Tạo vận chuyển"
4. ✓ Kiểm tra mã vận đơn = "SHIP-123"
5. ✓ Mã vận đơn không thể sửa (disabled)

### Test Phí Vận Chuyển Động:

**Trường hợp 1: Có mã giảm giá**

1. ✓ Tạo đơn với mã giảm giá
   - Phí gốc: 30,000 VND
   - Discount Amount > 0
2. ✓ Bấp tạo vận chuyển
3. ✓ Phí tự động = 15,000 VND (50%)

**Trường hợp 2: Không có mã giảm giá**

1. ✓ Tạo đơn không dùng mã giảm giá
   - Phí gốc: 30,000 VND
   - Discount Amount = 0
2. ✓ Bấp tạo vận chuyển
3. ✓ Phí tự động = 30,000 VND (100%)

### Test SelectBox Đơn Vị Vận Chuyển:

1. ✓ Mở modal tạo vận chuyển
2. ✓ Nhấp vào dropdown "Đơn vị vận chuyển"
3. ✓ Danh sách 8 đơn vị hiển thị (VNPost, GHN, ...)
4. ✓ Chọn 1 đơn vị → value được lưu đúng
5. ✓ Edit vận chuyển → dropdown hiển thị lại đúng

### Test Manual Create ở Quản Lý Vận Chuyển:

1. ✓ Mở Quản lý Vận chuyển
2. ✓ Bấp "+ Thêm vận chuyển"
3. ✓ Mã vận đơn: Có thể nhập tự do (VD: ABC123...)
4. ✓ Đơn vị: SelectBox hoạt động
5. ✓ Phí: Có thể nhập tự do
6. ✓ Lưu thành công

## 💡 Lợi Ích

### Tự động hóa:

✓ Giảm lỗi nhập liệu mã vận đơn
✓ Tiết kiệm thời gian admin
✓ Tracking code có format chuẩn

### Quản lý phí thông minh:

✓ Áp dụng chính sách giảm phí có mã giảm giá
✓ Không cần admin sửa thủ công từng đơn
✓ Tính toán tự động & chính xác

### Chuẩn hóa dữ liệu:

✓ Đơn vị vận chuyển không lỗi chính tả
✓ Dễ filter, tìm kiếm, báo cáo
✓ Tích hợp API vận chuyển trong tương lai

## 🔮 Mở Rộng Tương Lai

1. **API Vận Chuyển Thực**
   - Lấy phí từ API VNPost/GHN
   - Auto-calculate dựa trên trọng lượng/khoảng cách

2. **Phí Vận Chuyển Theo Nhóm**
   - Không chỉ 50%, có thể config % khác
   - Hoặc giảm cố định (vd: -5,000 VND)

3. **Multi-Carriers**
   - Select 2 đơn vị cùng lúc (redundancy)
   - Auto-fail-over nếu đơn vị 1 lỗi

4. **Promo Shipping**
   - Miễn phí vận chuyển cho order > 1M
   - "Mua X tặng Y + free shipping"

5. **Bulk Operations**
   - Tạo 100 đơn vận chuyển 1 lúc
   - Import CSV
