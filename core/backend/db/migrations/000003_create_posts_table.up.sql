CREATE TABLE IF NOT EXISTS posts(
    id SERIAL PRIMARY KEY,
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    encrypted_metadata TEXT NOT NULL,
    reputation_score numeric,
    status TEXT,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp
);