


DROP TABle Users


CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(200) NOT NULL UNIQUE,
    AccessToken NVARCHAR(500) NULL UNIQUE,
    RefreshToken NVARCHAR(500) NULL UNIQUE,
    TokenExpiry NVARCHAR(500) NULL,
    PasswordResetToken NVARCHAR(500) NULL,
    PasswordResetExpires DATETIME NULL,
    LastLogin DATETIME NULL,
    Name NVARCHAR(200) NOT NULL,
    Password NVARCHAR(200) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE()
);
SELECT 
    t.name AS TableName,
    c.name AS ColumnName,
    i.name AS ConstraintName
FROM sys.indexes i
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
JOIN sys.tables t ON i.object_id = t.object_id
WHERE i.is_unique = 1 AND t.name = 'Users';

ALTER TABLE Users DROP CONSTRAINT UQ__Users__DEA298DACCD0FE40;
ALTER TABLE Users DROP CONSTRAINT UQ__Users__A4E40AB2F20721BB;

ALTER TABLE Users
ADD PasswordResetToken NVARCHAR(500) NULL,
    PasswordResetExpires DATETIME NULL;
    
SELECT * FROM Users


CREATE TABLE Subscriptions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(200) NOT NULL,
    StripeSessionId NVARCHAR(255) NULL,
    PaymentIntentId NVARCHAR(255) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    ExpiryDate DATETIME NOT NULL DEFAULT DATEADD(HOUR, 24, GETDATE())
);

ALTER TABLE Subscriptions
ADD UserId INT NULL

ALTER TABLE Subscriptions
DROP COLUMN userId;

ALTER TABLE Users
ADD PasswordResetToken NVARCHAR(500) NULL,
    PasswordResetExpires DATETIME NULL;

DROP TABLE Subscriptions
