-- =====================================================
-- TASKORA DATABASE SCHEMA
-- =====================================================

CREATE TABLE users (

    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) DEFAULT 'worker',

    balance DECIMAL(10,2) DEFAULT 0.00,

    pending_balance DECIMAL(10,2) DEFAULT 0.00,

    total_earnings DECIMAL(10,2) DEFAULT 0.00,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);



CREATE TABLE tasks (

    id SERIAL PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    category VARCHAR(100),

    reward DECIMAL(10,2) NOT NULL,

    status VARCHAR(20) DEFAULT 'active',

    created_by INTEGER REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);



CREATE TABLE submissions (

    id SERIAL PRIMARY KEY,

    task_id INTEGER REFERENCES tasks(id),

    worker_id INTEGER REFERENCES users(id),

    proof TEXT,

    status VARCHAR(20) DEFAULT 'pending',

    reward DECIMAL(10,2) DEFAULT 0.00,

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);



CREATE TABLE withdrawals (

    id SERIAL PRIMARY KEY,

    worker_id INTEGER REFERENCES users(id),

    amount DECIMAL(10,2) NOT NULL,

    method VARCHAR(50),

    account TEXT,

    status VARCHAR(20) DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    processed_at TIMESTAMP

);



CREATE TABLE platform_finance (

    id SERIAL PRIMARY KEY,

    task_funding DECIMAL(10,2),

    taskora_fee DECIMAL(10,2),

    worker_pool DECIMAL(10,2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);
