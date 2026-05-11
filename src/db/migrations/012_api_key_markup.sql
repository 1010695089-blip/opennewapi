-- Add markup_rate to api_keys: billing multiplier applied to actual cost when charging users
ALTER TABLE api_keys ADD COLUMN markup_rate REAL NOT NULL DEFAULT 1.0;
