USE BaseCoreSales
GO

BEGIN TRY
BEGIN TRANSACTION

/* =========================
   1. CLEAN DATA
========================= */

DELETE FROM CartDetails;

DELETE FROM OrderPromotions;
DELETE FROM OrderDetails;
DELETE FROM Shippings;
DELETE FROM Orders;

DELETE FROM PromotionProducts;
DELETE FROM Promotions;

DELETE FROM ProductOrigins;
DELETE FROM Products;

DELETE FROM Origins;
DELETE FROM Categories;


/* =========================
   2. RESET IDENTITY
========================= */

DBCC CHECKIDENT ('Categories', RESEED, 0);
DBCC CHECKIDENT ('Products', RESEED, 0);
DBCC CHECKIDENT ('Origins', RESEED, 0);
DBCC CHECKIDENT ('Promotions', RESEED, 0);
DBCC CHECKIDENT ('Orders', RESEED, 0);
DBCC CHECKIDENT ('OrderDetails', RESEED, 0);


/* =========================
   3. CATEGORIES
========================= */

INSERT INTO Categories (Name, Description) VALUES
(N'Áo nam', N''),(N'Quần nam', N''),
(N'Áo nữ', N''),(N'Váy nữ', N''),
(N'Đồ bộ', N''),(N'Trẻ em', N'');


/* =========================
   4. ORIGINS (20)
========================= */

DECLARE @i INT = 1
WHILE @i <= 20
BEGIN
    INSERT INTO Origins (Name, Description)
    VALUES (N'Origin ' + CAST(@i AS NVARCHAR), N'Mô tả ' + CAST(@i AS NVARCHAR))
    SET @i = @i + 1
END


/* =========================
   5. PRODUCTS (100)
========================= */

SET @i = 1
WHILE @i <= 100
BEGIN
    DECLARE @cat INT = (ABS(CHECKSUM(NEWID())) % 6) + 1
    DECLARE @price DECIMAL(18,2) = (ABS(CHECKSUM(NEWID())) % 500 + 50) * 1000
    DECLARE @stock INT = (ABS(CHECKSUM(NEWID())) % 200) + 10

    INSERT INTO Products (Name, Price, Stock, ImageUrl, Description, CategoryId)
    VALUES (
        N'Sản phẩm ' + CAST(@i AS NVARCHAR),
        @price,
        @stock,
        'img' + CAST(@i AS NVARCHAR) + '.jpg',
        N'Mô tả ' + CAST(@i AS NVARCHAR),
        @cat
    )

    SET @i = @i + 1
END


/* =========================
   6. PRODUCT ORIGINS
========================= */

DECLARE @p INT = 1
WHILE @p <= 100
BEGIN
    INSERT INTO ProductOrigins (ProductId, OriginId)
    VALUES (@p, ((@p - 1) % 20) + 1)
    SET @p = @p + 1
END


/* =========================
   7. PROMOTIONS (20)
========================= */

SET @i = 1
WHILE @i <= 20
BEGIN
    INSERT INTO Promotions
    (Code, Name, Description, DiscountType, DiscountValue, MinimumOrderAmount, MaximumDiscountAmount, StartDate, EndDate)
    VALUES (
        'CODE' + CAST(@i AS NVARCHAR),
        N'KM ' + CAST(@i AS NVARCHAR),
        N'Mô tả',
        CASE 
            WHEN @i % 3 = 0 THEN 'FREESHIP'
            WHEN @i % 3 = 1 THEN 'AMOUNT'
            ELSE 'PERCENT'
        END,
        CASE 
            WHEN @i % 3 = 0 THEN 0
            ELSE (@i * 5)
        END,
        100000,
        50000,
        GETDATE(),
        DATEADD(DAY, 30, GETDATE())
    )

    SET @i = @i + 1
END


/* =========================
   8. PROMOTION PRODUCTS
========================= */

SET @i = 1
WHILE @i <= 20
BEGIN
    INSERT INTO PromotionProducts (PromotionId, ProductId)
    VALUES (@i, @i)
    SET @i = @i + 1
END


/* =========================
   9. ORDERS (RANDOM USER)
========================= */

DECLARE @uid NVARCHAR(450)

SET @i = 1
WHILE @i <= 20
BEGIN
    SELECT TOP 1 @uid = Id FROM Users ORDER BY NEWID()

    INSERT INTO Orders (UserId, OrderDate, TotalAmount, Status, ShippingAddress)
    VALUES (
        @uid,
        DATEADD(DAY, -@i, GETDATE()),
        0,
        'PENDING',
        N'Hà Nội'
    )

    SET @i = @i + 1
END


/* =========================
   10. ORDER DETAILS
========================= */

SET @i = 1
WHILE @i <= 20
BEGIN
    DECLARE @pid INT = (ABS(CHECKSUM(NEWID())) % 100) + 1
    DECLARE @q INT = (ABS(CHECKSUM(NEWID())) % 3) + 1
    DECLARE @price2 DECIMAL(18,2)

    SELECT @price2 = Price FROM Products WHERE Id = @pid

    INSERT INTO OrderDetails (OrderId, ProductId, Quantity, UnitPrice)
    VALUES (@i, @pid, @q, @price2)

    SET @i = @i + 1
END


/* =========================
   11. UPDATE TOTAL
========================= */

UPDATE o
SET TotalAmount = (
    SELECT SUM(Quantity * UnitPrice)
    FROM OrderDetails od
    WHERE od.OrderId = o.Id
)
FROM Orders o


/* =========================
   12. ORDER PROMOTIONS
========================= */

SET @i = 1
WHILE @i <= 20
BEGIN
    INSERT INTO OrderPromotions (OrderId, PromotionId, DiscountAmount)
    VALUES (@i, @i, 50000)
    SET @i = @i + 1
END


/* =========================
   13. SHIPPING
========================= */

SET @i = 1
WHILE @i <= 20
BEGIN
    INSERT INTO Shippings
    (OrderId, ReceiverName, ReceiverPhone, ShippingAddress, ShippingMethod, ShippingStatus, ShippingFee)
    VALUES (
        @i,
        N'Khách ' + CAST(@i AS NVARCHAR),
        '09' + RIGHT('00000000' + CAST(@i AS NVARCHAR), 8),
        N'Hà Nội',
        CASE WHEN @i % 2 = 0 THEN 'EXPRESS' ELSE 'STANDARD' END,
        'WAITING',
        20000
    )
    SET @i = @i + 1
END


/* =========================
   14. CART (RANDOM USER)
========================= */

SET @i = 1
WHILE @i <= 20
BEGIN
    SELECT TOP 1 @uid = Id FROM Users ORDER BY NEWID()

    INSERT INTO CartDetails (UserId, ProductId, Quantity, UnitPrice)
    VALUES (
        @uid,
        @i,
        1,
        (SELECT Price FROM Products WHERE Id = @i)
    )

    SET @i = @i + 1
END


COMMIT
PRINT 'SEED DATA SUCCESS'
END TRY

BEGIN CATCH
    ROLLBACK
    PRINT 'ERROR: ' + ERROR_MESSAGE()
END CATCH