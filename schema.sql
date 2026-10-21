CREATE DATABASE IF NOT EXISTS blogdb;
USE blogdb;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'user',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: blogs
CREATE TABLE IF NOT EXISTS blogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    blogTitle VARCHAR(255) NOT NULL,
    blog TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Optional: Create an Initial Admin User
-- Email: admin@blog.com | Password: adminpassword
INSERT INTO users (firstname, lastname, email, password, role)
VALUES ('System', 'Admin', 'admin@blog.com', 'adminpassword', 'admin')
ON DUPLICATE KEY UPDATE email=email;