# Bao cao nghiep vu he thong quan ao

Ngay cap nhat: 2026-06-18

Nguon chuan de phan tich: `SQLscript/script_qa_utf8.sql`. Database duoc xem la nguon chan ly, vi vay cac luong nghiep vu ben duoi bam theo bang, khoa ngoai, rang buoc va du lieu seed trong script nay.

## 1. Tong quan he thong

He thong la website ban quan ao gom 2 nhom nguoi dung chinh:

- Khach hang: xem san pham, loc theo danh muc, kich co, mau sac, them gio hang, yeu thich san pham, ap ma giam gia, dat hang, theo doi don, huy don khi con duoc phep, xem va gui danh gia.
- Admin: quan ly danh muc, san pham, bien the, nguon goc, nguoi dung, don hang, van chuyen, khuyen mai va danh gia.

Kien truc hien tai:

- Backend API: `BaseCore.APIService/Controllers`.
- Lop nghiep vu: `BaseCore.Services`.
- Lop truy cap du lieu: `BaseCore.Repository`.
- Entity theo database: `BaseCore.Entities`.
- Frontend public va admin: `BaseCore.WebClient/src/pages`.
- Goi API frontend: `BaseCore.WebClient/src/services/api.js`.

## 2. Y nghia cac bang database

| Bang | Y do thiet ke | Nghiep vu hien tai |
| --- | --- | --- |
| `Users` | Tai khoan khach hang/admin, trang thai hoat dong, thong tin lien he | Dang ky, dang nhap, phan quyen admin, quan ly nguoi dung |
| `Categories` | Danh muc san pham | Quan ly danh muc, gan san pham vao danh muc, loc san pham |
| `Products` | San pham goc, gia, gia goc, ton tong, hinh dai dien | Quan ly san pham, hien thi shop, chi tiet san pham, dashboard |
| `ProductVariants` | Bien the san pham theo size, mau, gia rieng, ton rieng | Chon bien the khi mua, quan ly size/mau/ton/gia trong admin |
| `Sizes` | Tu dien kich co co thu tu sap xep | Loc shop theo size, chon size chuan khi tao bien the |
| `Colors` | Tu dien mau sac va ma mau | Loc shop theo mau, chon mau chuan khi tao bien the, hien swatch mau |
| `ProductVariantImages` | Anh rieng cho tung bien the | Anh bien the duoc luu/lay qua API va hien theo bien the duoc chon |
| `Origins` | Tu dien xuat xu/nguon goc | Admin quan ly nguon goc |
| `ProductOrigins` | Gan moi san pham voi 1 nguon goc | San pham co thong tin nguon goc de quan ly/tra cuu |
| `CartDetails` | Gio hang theo user, san pham, bien the, so luong, don gia | Them/sua/xoa gio hang, gom dong theo user-product-variant |
| `WishlistItems` | Danh sach yeu thich theo user, san pham, bien the | Them/xoa/kiem tra san pham yeu thich |
| `Orders` | Don hang, dia chi, thanh toan, phi ship, giam gia, tong tien, huy don | Tao don, theo doi trang thai, admin cap nhat/huy |
| `OrderDetails` | Dong san pham trong don, bien the, so luong, don gia | Luu chi tiet don va tru/hoan ton kho |
| `Promotions` | Ma khuyen mai, loai giam, han dung, gioi han, so lan da dung | Quan ly ma giam gia, validate ma, ap vao don |
| `PromotionProducts` | Pham vi san pham duoc ap ma | Admin chon san pham ap dung, validate chi giam tren san pham hop le |
| `OrderPromotions` | Lich su ma da ap cho don | Luu ma da ap, so tien giam, tang `UsedCount` |
| `Shippings` | Ho so van chuyen cua don | Tao/cap nhat van chuyen, dong bo trang thai don |
| `Reviews` | Danh gia san pham theo user | Khach xem/gui danh gia, admin xem chi tiet chi doc va xoa |

## 3. Cac nghiep vu da bo sung de khai thac het y do database

1. Khuyen mai theo san pham

- Bang lien quan: `Promotions`, `PromotionProducts`, `OrderPromotions`, `Orders`, `OrderDetails`.
- Bo sung admin quan ly danh sach san pham ap dung cho tung ma khuyen mai.
- Neu ma khuyen mai khong chon san pham nao thi ap dung toan don.
- Neu co chon san pham, discount chi tinh tren tong tien cac dong san pham hop le.
- Gio hang, checkout va tao don deu gui danh sach dong san pham de backend validate dung theo `PromotionProducts`.

2. Size/mau theo tu dien database

- Bang lien quan: `ProductVariants`, `Sizes`, `Colors`.
- Admin tao bien the su dung `SizeId` va `ColorId` khi co metadata.
- Backend van luu ca ten size/mau de tuong thich du lieu cu, dong thoi gan FK size/mau de shop loc chinh xac.
- Mau sac co swatch theo `Colors.HexCode`.

3. Anh rieng cho bien the

- Bang lien quan: `ProductVariantImages`, `ProductVariants`.
- API bien the tra ve anh mac dinh cua bien the.
- Trang chi tiet san pham doi anh theo bien the duoc chon.

4. Quan ly danh gia dung theo yeu cau admin

- Bang lien quan: `Reviews`.
- Admin co nut xem chi tiet bang icon mat.
- Modal chi tiet chi doc, khong co chuc nang sua danh gia.
- Admin van co quyen xoa danh gia khi can dieu hanh noi dung.

5. Dong bo giao dien admin

- Cac trang quan ly duoc can lai theo mau `orders` va `products`: bang nam trong `card-body p-0`, footer phan trang dung `admin-table-footer`, nut cung chuc nang dung icon thong nhat.
- Nut them: `fa-plus`; tim kiem: `fa-search`; sua: `fa-edit`; xoa: `fa-trash`; xem chi tiet: `fa-eye`; xac nhan: `fa-check`; pham vi san pham khuyen mai: `fa-boxes`.

## 4. Luong nghiep vu chi tiet

### 4.1 Tai khoan va phan quyen

Luong xu ly:

1. Khach dang ky/dang nhap, backend xac thuc user tu bang `Users`.
2. Frontend luu token/thong tin user trong context.
3. Cac trang admin di qua `ProtectedRoute` va kiem tra role admin.
4. Admin quan ly danh sach user, trang thai hoat dong va thong tin co ban.

File backend:

- `BaseCore.AuthService`
- `BaseCore.Services/Authen/UserService.cs`
- `BaseCore.Repository/EFCore/UserRepository.cs`
- `BaseCore.APIService/Controllers` cho auth/user neu duoc khai bao trong API service

File frontend:

- `BaseCore.WebClient/src/contexts/AuthContext.jsx`
- `BaseCore.WebClient/src/components/ProtectedRoute.jsx`
- `BaseCore.WebClient/src/pages/Login.jsx`
- `BaseCore.WebClient/src/pages/Register.jsx`
- `BaseCore.WebClient/src/pages/Profile.jsx`
- `BaseCore.WebClient/src/pages/Users.jsx`

### 4.2 Quan ly danh muc, san pham, bien the va nguon goc

Luong xu ly:

1. Admin tao danh muc trong `Categories`.
2. Admin tao san pham trong `Products`, gan `CategoryId`, anh dai dien, gia, ton kho.
3. Admin tao bien the trong `ProductVariants`, chon size tu `Sizes`, mau tu `Colors`, nhap ton va gia rieng.
4. Neu bien the co anh rieng, backend luu vao `ProductVariantImages`.
5. Admin quan ly `Origins` va gan nguon goc cho san pham thong qua `ProductOrigins`.
6. Trang shop lay san pham, loc theo danh muc, gia, size, mau.
7. Trang chi tiet lay bien the, hien anh bien the duoc chon va dung bien the do khi them gio hang.

File backend:

- `BaseCore.APIService/Controllers/ProductsController.cs`
- `BaseCore.APIService/Controllers/ProductVariantsController.cs`
- `BaseCore.APIService/Controllers/CategoriesController.cs`
- `BaseCore.APIService/Controllers/SizesController.cs`
- `BaseCore.APIService/Controllers/ColorsController.cs`
- `BaseCore.APIService/Controllers/OriginsController.cs`
- `BaseCore.APIService/Controllers/ProductOriginsController.cs`
- `BaseCore.APIService/Controllers/UploadController.cs`
- `BaseCore.Services/ProductService.cs`
- `BaseCore.Services/CategoryService.cs`
- `BaseCore.Services/OriginService.cs`
- `BaseCore.Services/ProductOriginService.cs`
- `BaseCore.Repository/EFCore/ProductRepository.cs`
- `BaseCore.Repository/EFCore/ProductVariantRepository.cs`
- `BaseCore.Repository/AppDbContext.cs`

File frontend:

- `BaseCore.WebClient/src/pages/Products.jsx`
- `BaseCore.WebClient/src/pages/Categories.jsx`
- `BaseCore.WebClient/src/pages/OriginsAdmin.jsx`
- `BaseCore.WebClient/src/pages/Shop.jsx`
- `BaseCore.WebClient/src/pages/Product.jsx`
- `BaseCore.WebClient/src/services/api.js`

### 4.3 Gio hang

Luong xu ly:

1. Khach chon san pham/bien the va them vao gio.
2. Backend gio hang ghi `CartDetails` theo `UserId`, `ProductId`, `VariantId`, `Quantity`, `UnitPrice`.
3. Neu dong gio hang da ton tai theo user-product-variant thi tang so luong.
4. Khach co the doi so luong, xoa dong, xoa toan bo gio.
5. Khi checkout, gio hang duoc chuyen thanh `Orders` va `OrderDetails`.

File backend:

- `BaseCore.APIService/Controllers/CartController.cs`
- `BaseCore.APIService/Controllers/CartDetailsController.cs`
- `BaseCore.Services/CartService.cs`
- `BaseCore.Repository/EFCore/CartDetailRepository.cs`

File frontend:

- `BaseCore.WebClient/src/pages/Product.jsx`
- `BaseCore.WebClient/src/pages/Shop.jsx`
- `BaseCore.WebClient/src/pages/ShoppingCart.jsx`
- `BaseCore.WebClient/src/pages/Checkout.jsx`
- `BaseCore.WebClient/src/components/Header.jsx`
- `BaseCore.WebClient/src/services/api.js`

### 4.4 Yeu thich san pham

Luong xu ly:

1. Khach bam yeu thich tren san pham.
2. Backend ghi `WishlistItems` theo user, product va variant neu co.
3. Rang buoc unique trong DB ngan trung lap.
4. Khach xem danh sach wishlist, xoa tung item hoac xoa tat ca.

File backend:

- `BaseCore.APIService/Controllers/WishlistController.cs`
- `BaseCore.Services/WishlistService.cs`
- `BaseCore.Repository/EFCore/WishlistItemRepository.cs`

File frontend:

- `BaseCore.WebClient/src/pages/Wishlist.jsx`
- `BaseCore.WebClient/src/pages/Shop.jsx`
- `BaseCore.WebClient/src/pages/Product.jsx`
- `BaseCore.WebClient/src/services/api.js`

### 4.5 Khuyen mai va ap ma

Luong xu ly:

1. Admin tao ma trong `Promotions`: code, ten, loai giam, gia tri, don toi thieu, muc giam toi da, ngay hieu luc, gioi han su dung.
2. Admin co the mo modal pham vi san pham va ghi `PromotionProducts`.
3. Khach nhap ma trong gio hang hoac checkout.
4. Frontend gui `code`, `orderSubtotal`, `shippingFee` va cac dong `{ productId, subtotal }`.
5. Backend kiem tra ma ton tai, dang active, trong han, chua vuot `UsageLimit`, dat `MinimumOrderAmount`.
6. Neu co `PromotionProducts`, backend chi tinh discount tren `EligibleSubtotal` cua cac san pham duoc ap dung.
7. Khi tao don thanh cong, backend ghi `OrderPromotions`, cap nhat `Orders.DiscountAmount`, `Orders.FinalAmount`, tang `Promotions.UsedCount`.

File backend:

- `BaseCore.APIService/Controllers/PromotionsController.cs`
- `BaseCore.APIService/Controllers/OrderPromotionsController.cs`
- `BaseCore.Services/PromotionService.cs`
- `BaseCore.Services/IPromotionService.cs`
- `BaseCore.Services/OrderService.cs`
- `BaseCore.Repository/EFCore/PromotionRepository.cs`
- `BaseCore.Repository/AppDbContext.cs`

File frontend:

- `BaseCore.WebClient/src/pages/PromotionsAdmin.jsx`
- `BaseCore.WebClient/src/pages/ShoppingCart.jsx`
- `BaseCore.WebClient/src/pages/Checkout.jsx`
- `BaseCore.WebClient/src/services/api.js`

### 4.6 Dat hang, thanh toan va huy don

Luong xu ly:

1. Checkout nhan danh sach item, dia chi, phuong thuc thanh toan, phi ship, ma khuyen mai neu co.
2. Backend tao `Orders` voi `TotalAmount`, `ShippingFee`, `DiscountAmount`, `FinalAmount`, `PaymentMethod`, `PaymentStatus`, `Status`.
3. Backend tao `OrderDetails` cho tung dong, co `VariantId` neu mua theo bien the.
4. Backend tru ton kho san pham/bien the.
5. Khach xem `MyOrders` hoac `OrderTracking`.
6. Khach co the yeu cau huy khi don o trang thai cho phep.
7. Admin duyet huy/cap nhat trang thai; khi huy duoc duyet, backend hoan ton kho va ghi ly do/thoi diem huy.

File backend:

- `BaseCore.APIService/Controllers/OrdersController.cs`
- `BaseCore.APIService/Controllers/OrderDetailsController.cs`
- `BaseCore.Services/OrderService.cs`
- `BaseCore.Repository/EFCore/OrderRepository.cs`
- `BaseCore.Repository/AppDbContext.cs`

File frontend:

- `BaseCore.WebClient/src/pages/Checkout.jsx`
- `BaseCore.WebClient/src/pages/MyOrders.jsx`
- `BaseCore.WebClient/src/pages/OrderTracking.jsx`
- `BaseCore.WebClient/src/pages/OrdersAdmin.jsx`
- `BaseCore.WebClient/src/services/api.js`

### 4.7 Van chuyen

Luong xu ly:

1. Admin tao ho so van chuyen trong `Shippings` cho don hang.
2. Moi don chi co mot shipping theo rang buoc unique `OrderId`.
3. Shipping co nguoi nhan, so dien thoai, dia chi, phuong thuc `STANDARD` hoac `EXPRESS`, phi ship, carrier, tracking code.
4. Trang thai shipping gom `WAITING`, `PICKED_UP`, `SHIPPING`, `DELIVERED`, `FAILED`, `CANCELLED`.
5. Khi cap nhat shipping, service dong bo trang thai don hang tu trang thai giao hang.

File backend:

- `BaseCore.APIService/Controllers/ShippingsController.cs`
- `BaseCore.Services/ShippingService.cs`
- `BaseCore.Repository/EFCore/ShippingRepository.cs`
- `BaseCore.Repository/AppDbContext.cs`

File frontend:

- `BaseCore.WebClient/src/pages/ShippingsAdmin.jsx`
- `BaseCore.WebClient/src/pages/OrdersAdmin.jsx`
- `BaseCore.WebClient/src/pages/MyOrders.jsx`
- `BaseCore.WebClient/src/pages/OrderTracking.jsx`
- `BaseCore.WebClient/src/services/api.js`

### 4.8 Danh gia san pham

Luong xu ly:

1. Trang chi tiet san pham lay danh sach review theo `ProductId`, co phan trang va diem trung binh.
2. Khach gui danh gia voi `Rating` tu 1 den 5 va `Comment`.
3. Backend ghi `Reviews` voi `ProductId`, `UserId`, `Rating`, `Comment`, `CreatedAt`.
4. Admin xem danh sach review, loc/tim kiem, bam icon mat de xem chi tiet.
5. Modal chi tiet danh gia chi doc, khong cho sua.
6. Admin co the xoa review neu noi dung khong phu hop.

File backend:

- `BaseCore.APIService/Controllers/ReviewsController.cs`
- `BaseCore.Repository/EFCore/ReviewRepository.cs`
- `BaseCore.Repository/AppDbContext.cs`

File frontend:

- `BaseCore.WebClient/src/pages/Product.jsx`
- `BaseCore.WebClient/src/pages/ReviewsAdmin.jsx`
- `BaseCore.WebClient/src/services/api.js`

### 4.9 Thong ke dashboard

Luong xu ly:

1. Dashboard lay doanh thu, so don, so san pham, so user va du lieu thong ke theo ngay/thang.
2. Backend tinh tren `Orders`, `OrderDetails`, `Products`, `Users`.
3. Don da huy khong tinh vao doanh thu.

File backend:

- `BaseCore.APIService/Controllers/AnalyticsController.cs`
- `BaseCore.Services/AnalyticsService.cs`
- `BaseCore.Repository/AppDbContext.cs`

File frontend:

- `BaseCore.WebClient/src/pages/Dashboard.jsx`
- `BaseCore.WebClient/src/services/api.js`

## 5. Giao dien admin hien tai

Trang admin quan ly:

- Dashboard: `BaseCore.WebClient/src/pages/Dashboard.jsx`
- San pham: `BaseCore.WebClient/src/pages/Products.jsx`
- Danh muc: `BaseCore.WebClient/src/pages/Categories.jsx`
- Nguoi dung: `BaseCore.WebClient/src/pages/Users.jsx`
- Don hang: `BaseCore.WebClient/src/pages/OrdersAdmin.jsx`
- Nguon goc: `BaseCore.WebClient/src/pages/OriginsAdmin.jsx`
- Khuyen mai: `BaseCore.WebClient/src/pages/PromotionsAdmin.jsx`
- Van chuyen: `BaseCore.WebClient/src/pages/ShippingsAdmin.jsx`
- Danh gia: `BaseCore.WebClient/src/pages/ReviewsAdmin.jsx`

CSS va layout admin lien quan:

- `BaseCore.WebClient/src/assets/css/admin-custom.css`
- `BaseCore.WebClient/src/components/MainLayout.jsx`

Cac trang quan ly da duoc dong bo cach hien thi bang, footer phan trang va icon chuc nang theo mau san pham/don hang.

## 6. API chinh theo nghiep vu

| Nghiep vu | Controller/API |
| --- | --- |
| San pham | `ProductsController`, `ProductVariantsController` |
| Metadata size/mau | `SizesController`, `ColorsController` |
| Danh muc | `CategoriesController` |
| Nguon goc | `OriginsController`, `ProductOriginsController` |
| Gio hang | `CartController`, `CartDetailsController` |
| Wishlist | `WishlistController` |
| Don hang | `OrdersController`, `OrderDetailsController` |
| Khuyen mai | `PromotionsController`, `OrderPromotionsController` |
| Van chuyen | `ShippingsController` |
| Danh gia | `ReviewsController` |
| Upload anh | `UploadController` |
| Dashboard | `AnalyticsController` |

## 7. Ghi chu kiem tra

- Backend da build thanh cong voi `dotnet build BaseCore.sln --nologo -v:minimal -m:1 --disable-build-servers`.
- Frontend da build thanh cong voi `npm run build -- --logLevel error` trong `BaseCore.WebClient`.
- Cac bang co y do thiet ke nhung truoc do chua duoc khai thac du: `PromotionProducts`, `Sizes`, `Colors`, `ProductVariantImages`, `Reviews` o man admin chi tiet. Cac phan nay da duoc noi vao nghiep vu tu backend den admin/public frontend.
