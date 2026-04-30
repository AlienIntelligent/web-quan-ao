CREATE TABLE ProductVariants (
    Id INT IDENTITY PRIMARY KEY,
    ProductId INT NOT NULL,
    Size NVARCHAR(10) NOT NULL,
    Color NVARCHAR(20) NULL,
    Stock INT NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    CONSTRAINT FK_ProductVariants_Products 
        FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
);

CREATE TABLE Reviews (
    Id INT IDENTITY PRIMARY KEY,
    ProductId INT NOT NULL,
    UserId NVARCHAR(450) NOT NULL,
    Rating INT NOT NULL, -- 1-5
    Comment NVARCHAR(1000),
    CreatedAt DATETIME2 DEFAULT GETDATE(),

    FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

ALTER TABLE Products
ADD OriginalPrice DECIMAL(18,2) NULL

UPDATE Products
SET OriginalPrice = Price + (ABS(CHECKSUM(NEWID())) % 50 + 10) * 1000
WHERE Id <> 1

INSERT INTO ProductVariants (ProductId, Size, Stock, Price) VALUES
(1,'XS',10,150000),
(1,'S',20,150000),
(1,'M',30,150000),
(1,'L',15,150000),
(1,'XL',10,150000);

DECLARE @pid INT = 2

WHILE @pid <= 100
BEGIN
    DECLARE @basePrice DECIMAL(18,2)
    SELECT @basePrice = Price FROM Products WHERE Id = @pid

    INSERT INTO ProductVariants (ProductId, Size, Stock, Price) VALUES
    (@pid,'XS', (ABS(CHECKSUM(NEWID())) % 20) + 5, @basePrice),
    (@pid,'S',  (ABS(CHECKSUM(NEWID())) % 30) + 5, @basePrice),
    (@pid,'M',  (ABS(CHECKSUM(NEWID())) % 40) + 5, @basePrice),
    (@pid,'L',  (ABS(CHECKSUM(NEWID())) % 25) + 5, @basePrice),
    (@pid,'XL', (ABS(CHECKSUM(NEWID())) % 15) + 5, @basePrice);

    SET @pid = @pid + 1
END

DECLARE @i INT = 1
DECLARE @uid NVARCHAR(450)

WHILE @i <= 18
BEGIN
    SELECT TOP 1 @uid = Id FROM Users ORDER BY NEWID()

    INSERT INTO Reviews (ProductId, UserId, Rating, Comment)
    VALUES (
        1,
        @uid,
        (ABS(CHECKSUM(NEWID())) % 5) + 1,
        N'Sản phẩm tốt ' + CAST(@i AS NVARCHAR)
    )

    SET @i = @i + 1
END

DECLARE @pid INT = 2

WHILE @pid <= 100
BEGIN
    DECLARE @numReview INT = (ABS(CHECKSUM(NEWID())) % 15) + 5
    DECLARE @i INT = 1
    DECLARE @uid NVARCHAR(450)

    WHILE @i <= @numReview
    BEGIN
        SELECT TOP 1 @uid = Id FROM Users ORDER BY NEWID()

        INSERT INTO Reviews (ProductId, UserId, Rating, Comment)
        VALUES (
            @pid,
            @uid,
            (ABS(CHECKSUM(NEWID())) % 5) + 1,
            N'Sản phẩm ' + CAST(@pid AS NVARCHAR) + N' - đánh giá ' + CAST(@i AS NVARCHAR)
        )

        SET @i = @i + 1
    END

    SET @pid = @pid + 1
END