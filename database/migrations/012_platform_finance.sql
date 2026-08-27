CREATE TABLE IF NOT EXISTS platform_settings (
    id SERIAL PRIMARY KEY,

    fee_rate NUMERIC(5,4) NOT NULL DEFAULT 0.1000,

    currency VARCHAR(10) NOT NULL DEFAULT 'EUR',

    minimum_withdrawal NUMERIC(12,2)
        NOT NULL DEFAULT 5.00,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);


INSERT INTO platform_settings
(
    fee_rate,
    currency,
    minimum_withdrawal
)
SELECT
    0.1000,
    'EUR',
    5.00
WHERE NOT EXISTS (
    SELECT 1
    FROM platform_settings
);