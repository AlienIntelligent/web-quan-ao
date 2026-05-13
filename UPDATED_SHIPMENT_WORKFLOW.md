# Updated Shipment Workflow - Tạo Vận Chuyển Từ Quản Lý Đơn Hàng

## 📋 Overview

Cập nhật luồng công việc vận chuyển: Khi đơn hàng được xác nhận (CONFIRMED), admin có thể tạo vận chuyển trực tiếp từ trang Quản lý Đơn hàng.

## 🔄 Complete Workflow

```
1. [Quản lý Đơn hàng]
   Order Status: PENDING
        ↓
   Admin chuyển trạng thái → CONFIRMED
        ↓
   Nút "Tạo vận chuyển" (🚚) xuất hiện

2. [Tạo Vận Chuyển Modal]
   Admin nhập thông tin:
   - Phương thức vận chuyển (Tiêu chuẩn/Nhanh)
   - Đơn vị vận chuyển (VNPost, GHN, Grab, ...)
   - Mã vận đơn (tùy chọn)
   - Phí vận chuyển
   - Ngày dự kiến giao hàng (tùy chọn)
   - Ghi chú (tùy chọn)
        ↓
   Bấm "Tạo vận chuyển"

3. [Quản lý Vận chuyển]
   Vận chuyển mới được tạo với:
   - Status: WAITING (Chờ xử lý)
   - Chứa tất cả thông tin từ form
        ↓
   Admin bấp nút "Xác nhận chuyển đơn" (✓)
        ↓
   Shipping Status: PICKED_UP (Đã lấy hàng)
   Order Status: SHIPPED (Đã chuyển) [tự động]
```

## 📝 Changes Made

### Frontend - OrdersAdmin.jsx

**New Features:**

- ✅ Import `shippingApi` từ services
- ✅ State cho shipping modal: `showShippingModal`, `orderForShipping`, `shippingForm`, `shippingError`, `shippingLoading`
- ✅ Hàm `openShippingModal()`: Mở modal với dữ liệu từ đơn hàng
- ✅ Hàm `closeShippingModal()`: Đóng modal và reset form
- ✅ Hàm `handleCreateShipping()`: Gửi dữ liệu vận chuyển đến backend
- ✅ Nút "Tạo vận chuyển" 🚚: Hiện thị khi `order.status === 'CONFIRMED'`
- ✅ Modal form: Nhập thông tin vận chuyển

**New Button in Actions Column:**

```javascript
{
  order.status === "CONFIRMED" && (
    <button
      className="btn btn-sm btn-success"
      onClick={() => openShippingModal(order)}
    >
      <i className="fas fa-truck"></i> // 🚚 icon
    </button>
  );
}
```

### Shipping Information Pre-filled from Order:

```javascript
{
    orderId: orderForShipping.id,
    receiverName: getCustomerName(orderForShipping),
    receiverPhone: orderForShipping.user?.phoneNumber || '',
    shippingAddress: orderForShipping.shippingAddress,
    shippingStatus: 'WAITING', // Always WAITING when created
    shippingFee: orderForShipping.shippingFee // Default from order
}
```

## 👥 User Workflow - Admin

### Step 1: Xem Danh Sách Đơn Hàng

1. Navigate to "Quản lý Đơn hàng"
2. Tìm đơn hàng cần xử lý (filter by status, search by keyword)

### Step 2: Xác Nhận Đơn Hàng

1. Ở cột "Đổi TT", chọn trạng thái "Đã xác nhận" (CONFIRMED)
2. Hệ thống cập nhật, nút 🚚 "Tạo vận chuyển" sẽ xuất hiện

### Step 3: Tạo Vận Chuyển

1. Nhấp vào nút 🚚 "Tạo vận chuyển"
2. Modal mở ra với thông tin tự động từ đơn hàng:
   - ✓ Khách hàng: Tự động lấy từ đơn
   - ✓ Địa chỉ giao: Tự động lấy từ đơn
   - ✓ Phí vận chuyển: Tự động lấy từ đơn
3. Nhập thông tin vận chuyển:
   - **Phương thức\*** (bắt buộc): Tiêu chuẩn hoặc Nhanh
   - **Đơn vị vận chuyển\*** (bắt buộc): VNPost, GHN, Grab, FedEx, v.v.
   - Mã vận đơn: Mã tracking từ đơn vị (tùy chọn)
   - Phí vận chuyển: Có thể sửa nếu cần (mặc định = phí trong đơn)
   - Ngày dự kiến: Khi nào dự kiến giao đến (tùy chọn)
   - Ghi chú: Thêm ghi chú nếu cần (tùy chọn)
4. Bấm "Tạo vận chuyển"
5. Vận chuyển được tạo và xuất hiện trong "Quản lý Vận chuyển"

### Step 4: Quản Lý Vận Chuyển

1. Navigate to "Quản lý Vận chuyển"
2. Tìm vận chuyển vừa tạo (filter by carrier, search by tracking code)
3. Nút ✓ "Xác nhận chuyển đơn" hiển thị
4. Bấm ✓ để xác nhận → trạng thái tự động chuyển:
   - Shipping: WAITING → PICKED_UP
   - Order: CONFIRMED → SHIPPED
5. Từ đây, có thể cập nhật trạng thái thành SHIPPING, DELIVERED, v.v.

## ⚙️ Backend API

### Create Shipping Endpoint

```
POST /api/shippings
Content-Type: application/json
Authorization: Bearer {admin_token}

{
    "orderId": 123,
    "receiverName": "Nguyễn Văn A",
    "receiverPhone": "0912345678",
    "shippingAddress": "123 Nguyễn Hữu Cảnh, Q.1, HCM",
    "shippingMethod": "STANDARD",
    "shippingStatus": "WAITING",
    "shippingFee": 30000,
    "trackingCode": "VNP1234567890",
    "carrierName": "VNPost",
    "estimatedDeliveryDate": "2026-05-15",
    "note": "Gọi trước khi giao"
}
```

### Confirm Shipment Endpoint

```
POST /api/shippings/{id}/confirm
Authorization: Bearer {admin_token}

Response: {
    "message": "Xác nhận chuyển đơn thành công...",
    "shipping": {
        "id": 456,
        "status": "PICKED_UP",
        "shippedDate": "2026-05-13T10:30:00"
    }
}
```

## 🔐 Authorization

- ✅ Only Admin users can create shipping
- ✅ Only Admin users can confirm shipment
- ✅ All endpoints require Bearer token authentication

## 📊 Database Changes

- Shipping.ShippingStatus: "WAITING" on creation
- Shipping.ShippedDate: Set to NOW when status becomes "PICKED_UP"
- Order.Status: Updated from "CONFIRMED" → "SHIPPED" when shipping confirmed
- All changes wrapped in database transactions

## ✅ Validation Rules

| Field            | Requirement                 | Error                      |
| ---------------- | --------------------------- | -------------------------- |
| Order ID         | Must exist and be CONFIRMED | "Invalid order"            |
| Receiver Name    | Auto-filled from customer   | -                          |
| Shipping Address | Auto-filled from order      | -                          |
| Shipping Method  | STANDARD or EXPRESS         | "Invalid method"           |
| Carrier Name     | Required (not empty)        | "Carrier name is required" |
| Shipping Fee     | Numeric, >= 0               | "Invalid fee"              |
| Estimated Date   | Optional, valid date format | "Invalid date"             |

## 🚨 Error Handling

| Scenario                | Error                         | Resolution                 |
| ----------------------- | ----------------------------- | -------------------------- |
| Order not found         | 400 - Order not found         | Verify order ID            |
| Order not CONFIRMED     | 400 - Order must be CONFIRMED | Change order status first  |
| Missing carrier name    | 400 - Carrier name required   | Fill in carrier name       |
| Invalid shipping method | 400 - Invalid method          | Choose STANDARD or EXPRESS |
| Unauthorized            | 401 - Not admin               | Login as admin             |
| Network error           | Connection failed             | Retry or check connection  |

## 🔄 Status Transitions Summary

**Order Status Flow:**

```
PENDING → CONFIRMED → SHIPPED → DELIVERING → DELIVERED
                          ↑
                   (when shipment confirmed)
```

**Shipping Status Flow:**

```
WAITING → PICKED_UP → SHIPPING → DELIVERED
          (confirm)
```

## 📱 UI/UX Improvements

### OrdersAdmin Table

- New truck icon 🚚 button appears when order is CONFIRMED
- Button color: Success (green/btn-success)
- Tooltip: "Tạo vận chuyển"

### Shipping Modal

- Auto-populated fields reduce manual entry
- Clear form validation messages
- Loading state during submission
- Success/error notifications
- All required fields marked with \*

### ShippingsAdmin Table

- Shows all shipments including WAITING status
- Can filter by carrier, status, or search by tracking code
- Green checkmark button for WAITING shipments only

## 🎯 Next Steps (Optional Enhancements)

1. **Auto-generate Tracking Codes**: Integrate with carrier APIs
2. **Email Notifications**: Send shipment details to customer
3. **Bulk Actions**: Create multiple shipments at once
4. **Carrier Integration**: Real-time tracking sync
5. **Audit Log**: Track who created/confirmed shipments
6. **SMS Notifications**: Notify customer of shipment status

## 📝 Testing Checklist

- [ ] Create new order → Status = PENDING
- [ ] Change order status to CONFIRMED
- [ ] Verify truck icon 🚚 appears
- [ ] Click truck icon → Modal opens
- [ ] Verify customer name and address pre-filled
- [ ] Enter carrier name and other details
- [ ] Click "Tạo vận chuyển"
- [ ] Shipment appears in Quản lý Vận chuyển
- [ ] Shipment has WAITING status
- [ ] Can see confirm button ✓
- [ ] Click confirm → Status changes to PICKED_UP
- [ ] Check order status changed to SHIPPED
- [ ] Verify no errors in console
