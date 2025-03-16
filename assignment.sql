CREATE DATABASE quizapp;

USE quizapp;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams Table
CREATE TABLE exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved Exams Table (for user progress)
CREATE TABLE saved_exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    exam_id INT,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (exam_id) REFERENCES exams(id)
);

-- Sample Users
INSERT INTO users (username, email, password, role) VALUES 
('admin', 'admin@example.com', 'adminpassword', 'admin'),
('user1', 'user1@example.com', 'userpassword', 'user');

-- Sample Exams
INSERT INTO exams (title, description) VALUES 
('Math Quiz', 'This is a sample math quiz'),
('History Quiz', 'This is a sample history quiz');
