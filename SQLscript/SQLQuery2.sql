BEGIN TRAN;

;WITH ProductOrder AS (
    SELECT
        p.Id,
        p.CategoryId,
        ROW_NUMBER() OVER (
            PARTITION BY
                CASE
                    WHEN p.CategoryId IN (1,2) THEN 'man'
                    WHEN p.CategoryId IN (3,4,5) THEN 'woman'
                    WHEN p.CategoryId = 6 THEN 'kid'
                    ELSE 'other'
                END
            ORDER BY p.Id
        ) AS rn
    FROM Products p
    WHERE p.CategoryId IN (1,2,3,4,5,6)
),
MappedImage AS (
    SELECT
        po.Id,
        CASE
            -- man: img33 .. img63 (31 ?nh)
            WHEN po.CategoryId IN (1,2) THEN
                '/img/man/img' + CAST(33 + ((po.rn - 1) % 31) AS varchar(10)) + '.png'

            -- woman: img1 .. img32 (32 ?nh)
            WHEN po.CategoryId IN (3,4,5) THEN
                '/img/woman/img' + CAST(1 + ((po.rn - 1) % 32) AS varchar(10)) + '.png'

            -- kid: img64 .. img93 (30 ?nh)
            WHEN po.CategoryId = 6 THEN
                '/img/kid/img' + CAST(64 + ((po.rn - 1) % 30) AS varchar(10)) + '.png'
        END AS NewImageUrl
    FROM ProductOrder po
)
UPDATE p
SET p.ImageUrl = m.NewImageUrl
FROM Products p
JOIN MappedImage m ON m.Id = p.Id;

-- ki?m tra k?t qu?
SELECT Id, Name, CategoryId, ImageUrl
FROM Products
WHERE CategoryId IN (1,2,3,4,5,6)
ORDER BY CategoryId, Id;

-- N?u ok thì COMMIT, chua ok thì ROLLBACK
COMMIT;
-- ROLLBACK;