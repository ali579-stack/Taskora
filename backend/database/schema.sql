CREATE TABLE IF NOT EXISTS social_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    platform VARCHAR(50) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);