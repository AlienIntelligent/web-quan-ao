using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BaseCore.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AlignOrderUserAndOrderDetail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[dbo].[Orders]', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Orders_Users_UserId')
        ALTER TABLE [dbo].[Orders] DROP CONSTRAINT [FK_Orders_Users_UserId];

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_UserId' AND object_id = OBJECT_ID(N'[dbo].[Orders]'))
        DROP INDEX [IX_Orders_UserId] ON [dbo].[Orders];

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID(N'[dbo].[Orders]')
          AND c.name = N'UserId'
          AND c.system_type_id = 36 -- uniqueidentifier
    )
    BEGIN
        ALTER TABLE [dbo].[Orders] ALTER COLUMN [UserId] nvarchar(450) NOT NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_UserId' AND object_id = OBJECT_ID(N'[dbo].[Orders]'))
        CREATE INDEX [IX_Orders_UserId] ON [dbo].[Orders] ([UserId]);

    IF OBJECT_ID(N'[dbo].[Users]', N'U') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Orders_Users_UserId')
    BEGIN
        ALTER TABLE [dbo].[Orders]
        ADD CONSTRAINT [FK_Orders_Users_UserId]
        FOREIGN KEY ([UserId]) REFERENCES [dbo].[Users]([Id]);
    END
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[dbo].[Orders]', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Orders_Users_UserId')
        ALTER TABLE [dbo].[Orders] DROP CONSTRAINT [FK_Orders_Users_UserId];

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_UserId' AND object_id = OBJECT_ID(N'[dbo].[Orders]'))
        DROP INDEX [IX_Orders_UserId] ON [dbo].[Orders];

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        WHERE c.object_id = OBJECT_ID(N'[dbo].[Orders]')
          AND c.name = N'UserId'
          AND c.system_type_id <> 36
    )
    BEGIN
        -- Only safe when existing data can be converted to uniqueidentifier.
        ALTER TABLE [dbo].[Orders] ALTER COLUMN [UserId] uniqueidentifier NOT NULL;
    END
END
");
        }
    }
}
