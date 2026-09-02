CREATE TABLE IF NOT EXISTS votes_or_reviews(
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vote_type INTEGER CHECK (vote_type IN (-1, 1)),
    review_content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);  