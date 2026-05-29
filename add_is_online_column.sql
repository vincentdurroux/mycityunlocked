-- SQL to add is_online column to guide_articles table (and fallback articles table)
ALTER TABLE guide_articles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT true;
ALTER TABLE IF EXISTS articles ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT true;
