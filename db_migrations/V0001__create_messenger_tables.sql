
CREATE TABLE IF NOT EXISTS t_p79267135_chat_connector_proje.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  avatar_color VARCHAR(20) DEFAULT '#2AABEE',
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  is_online BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS t_p79267135_chat_connector_proje.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL DEFAULT 'private',
  name VARCHAR(100),
  description TEXT DEFAULT '',
  avatar_color VARCHAR(20) DEFAULT '#2AABEE',
  created_by UUID REFERENCES t_p79267135_chat_connector_proje.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p79267135_chat_connector_proje.chat_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES t_p79267135_chat_connector_proje.chats(id),
  user_id UUID REFERENCES t_p79267135_chat_connector_proje.users(id),
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS t_p79267135_chat_connector_proje.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES t_p79267135_chat_connector_proje.chats(id),
  sender_id UUID REFERENCES t_p79267135_chat_connector_proje.users(id),
  content TEXT NOT NULL,
  type VARCHAR(20) DEFAULT 'text',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON t_p79267135_chat_connector_proje.messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON t_p79267135_chat_connector_proje.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON t_p79267135_chat_connector_proje.users(username);
