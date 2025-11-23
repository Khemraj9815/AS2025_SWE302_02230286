-- cat > ../migrations/0001_add_indexes.sql <<'SQL'
-- -- migrations/0001_add_indexes.sql
-- -- Add indexes used for performance optimization. Adjust table/column names if they differ.
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
CREATE INDEX IF NOT EXISTS idx_comments_article_id ON comments (article_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
SQL
