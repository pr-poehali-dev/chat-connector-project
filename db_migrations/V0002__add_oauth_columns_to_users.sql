ALTER TABLE t_p79267135_chat_connector_proje.users
  ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(128) UNIQUE,
  ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_users_oauth_id ON t_p79267135_chat_connector_proje.users(oauth_id);