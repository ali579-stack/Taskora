CREATE TABLE IF NOT EXISTS social_accounts (

    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    platform VARCHAR(30) NOT NULL,

    account_name VARCHAR(255) NOT NULL,

    verification_status VARCHAR(30)
        NOT NULL DEFAULT 'pending',

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CONSTRAINT social_accounts_status_check
        CHECK (
            verification_status IN (
                'pending',
                'verified',
                'rejected'
            )
        ),

    CONSTRAINT social_accounts_platform_check
        CHECK (
            platform IN (
                'instagram',
                'tiktok',
                'youtube',
                'facebook',
                'x',
                'other'
            )
        ),

    CONSTRAINT social_accounts_unique_account
        UNIQUE (
            user_id,
            platform,
            account_name
        )

);