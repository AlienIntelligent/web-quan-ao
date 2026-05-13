# Shipment Confirmation Workflow Implementation

## Overview

Implemented a complete shipment confirmation workflow for the BaseCore e-commerce system. When an order is in "WAITING" (Chờ xử lý) state, admins can select a shipping provider and confirm shipment, which automatically updates the order status.

## Business Logic Flow

```
Order Status: PENDING
    ↓
Admin fills shipping details (carrier, address, method, fee, etc.)
    ↓
Shipping Status: WAITING
    ↓
Admin clicks "Xác nhận chuyển đơn" (Confirm Shipment) button
    ↓
Shipping Status: PICKED_UP (changes automatically)
    ↓
Order Status: SHIPPED (synced automatically)
    ↓
Customer can track order through shipping updates
```

## Changes Made

### 1. Backend - Service Layer

**File**: `BaseCore.Services/IShippingService.cs`

- Added new method: `Task<Shipping> ConfirmShipmentAsync(int shippingId);`

**File**: `BaseCore.Services/ShippingService.cs`

- Implemented `ConfirmShipmentAsync()` method with following logic:
  - Validates shipping ID
  - Checks if shipping status is "WAITING" (only confirm waiting shipments)
  - Requires carrier name to be set
  - Automatically sets `ShippedDate` to current date
  - Changes shipping status to "PICKED_UP"
  - Syncs order status to "SHIPPED" via `SyncOrderDeliveryStatusAsync()`
  - Uses database transaction for data consistency

### 2. Backend - API Controller

**File**: `BaseCore.APIService/Controllers/ShippingsController.cs`

- Added new endpoint: `POST /api/shippings/{id}/confirm`
- Requires Admin role authorization
- Returns success message and updated shipping DTO
- Error handling for:
  - Invalid shipping ID
  - Non-WAITING shipments
  - Missing carrier information

### 3. Frontend - API Service

**File**: `BaseCore.WebClient/src/services/api.js`

- Added to `shippingApi`: `confirm: (id) => api.post(`/shippings/${id}/confirm`)`

### 4. Frontend - Admin UI Component

**File**: `BaseCore.WebClient/src/pages/ShippingsAdmin.jsx`

#### State Management

- Added `success` state for success notifications
- Clears success message on each data refresh

#### New Handler Function

```javascript
handleConfirmShipment(id) {
  - Shows confirmation dialog
  - Calls shippingApi.confirm(id)
  - Refreshes shipment list on success
  - Shows success notification
  - Handles errors gracefully
}
```

#### UI Enhancements

- **Conditional Action Buttons**:
  - When shipping status is "WAITING":
    - Shows green checkmark button "Xác nhận chuyển đơn" (Confirm Shipment)
    - Edit button remains available
    - Delete button remains available
  - When shipping status is anything else:
    - Only shows Edit and Delete buttons
    - No confirm button

- **Success Notification**:
  - Displays dismissible alert when shipment confirmed successfully
  - Message: "Xác nhận chuyển đơn thành công! Đơn hàng đã được cập nhật sang trạng thái 'Đã chuyển'."

## Workflow Usage

### For Admin Users:

1. **Navigate** to "Quản lý Vận chuyển" (Shipping Management)

2. **Find** an order with shipping status "Chờ xử lý" (WAITING)
   - Filter by status or search for specific orders

3. **Select Shipping Provider** (if not already filled):
   - Click edit button (pencil icon)
   - Fill in:
     - Order ID
     - Receiver name and phone
     - Shipping address
     - Shipping method (Standard/Express)
     - Carrier name (required for confirmation)
     - Tracking code (optional)
     - Fees and dates as needed
   - Click "Cập nhật" to save

4. **Confirm Shipment**:
   - Click the green checkmark button "Xác nhận chuyển đơn"
   - Confirm the dialog prompt
   - System automatically:
     - Changes shipping status to "Đã lấy hàng" (PICKED_UP)
     - Updates order status to "Đã chuyển" (SHIPPED)
     - Records pickup date
     - Shows success message

5. **Track Order**:
   - Order now shows as "SHIPPED" in order management
   - Can update shipping status as package progresses through delivery

## System Integration

### Order Status Mapping

```
Shipping Status     →  Order Status
WAITING            →  (No change - admin phase)
PICKED_UP          →  SHIPPED
SHIPPING           →  DELIVERING
DELIVERED          →  DELIVERED (also sets PaymentStatus = PAID)
FAILED             →  RETURNED
```

### Validations

✓ Shipping must exist and have WAITING status
✓ Carrier name is required
✓ Order must exist and not be CANCELLED
✓ Auto-timestamps: Sets ShippedDate when confirming

### Transaction Safety

- Uses database transactions to ensure atomicity
- Rollback on any error to prevent data inconsistency
- Both shipping and order updates happen together

## Error Handling

| Error               | HTTP Status | Message                                              |
| ------------------- | ----------- | ---------------------------------------------------- |
| Invalid shipping ID | 400         | Invalid shipping ID                                  |
| Shipping not found  | 400         | Shipping with ID {id} not found                      |
| Status not WAITING  | 400         | Only shipping with 'WAITING' status can be confirmed |
| No carrier name     | 400         | Carrier name is required to confirm shipment         |
| Cancelled order     | 400         | Cannot update delivery status for a cancelled order  |

## Testing Checklist

- [ ] Admin can view shipments with WAITING status
- [ ] Confirm button shows only for WAITING shipments
- [ ] Clicking confirm shows confirmation dialog
- [ ] Confirming updates shipping status to PICKED_UP
- [ ] Order status changes to SHIPPED automatically
- [ ] ShippedDate is set to current date
- [ ] Success notification displays correctly
- [ ] Can still edit/delete confirmed shipments if needed
- [ ] Dismissing success notification works
- [ ] Refresh shows updated status
- [ ] Non-admin users cannot see these controls

## Future Enhancements

1. **Bulk Confirmation**: Allow confirming multiple shipments at once
2. **Integration with Carriers**: Auto-generate tracking codes via carrier APIs
3. **Notifications**: Send email/SMS to customer when shipment confirmed
4. **Audit Trail**: Log who confirmed shipment and when
5. **Custom Status Rules**: Allow different workflows for different carrier types
