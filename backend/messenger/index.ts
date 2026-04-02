import { Pool } from "pg";
// v3
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schema = process.env.MAIN_DB_SCHEMA || "t_p79267135_chat_connector_proje";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders() });
}

function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: corsHeaders() });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
  // path[0] = "messenger", path[1] = action
  const action = path[1] || "";

  try {
    // POST /messenger/register
    if (action === "register" && req.method === "POST") {
      const { username, display_name } = await req.json();
      if (!username || !display_name) return err("username and display_name required");
      const trimUser = username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,30}$/.test(trimUser)) return err("Username must be 3-30 chars: letters, digits, underscore");
      // check duplicate
      const dup = await pool.query(`SELECT id FROM ${schema}.users WHERE username=$1`, [trimUser]);
      if (dup.rows.length > 0) return err("Username already taken", 409);
      const colors = ["#2AABEE","#E91E63","#9C27B0","#FF5722","#4CAF50","#FF9800","#00BCD4","#3F51B5"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const res = await pool.query(
        `INSERT INTO ${schema}.users(username, display_name, avatar_color) VALUES($1,$2,$3) RETURNING id, username, display_name, avatar_color, bio, created_at`,
        [trimUser, display_name.trim(), color]
      );
      return json({ user: res.rows[0] });
    }

    // POST /messenger/login
    if (action === "login" && req.method === "POST") {
      const { username } = await req.json();
      if (!username) return err("username required");
      const res = await pool.query(
        `UPDATE ${schema}.users SET is_online=true, last_seen=NOW() WHERE username=$1 RETURNING id, username, display_name, avatar_color, bio, is_online`,
        [username.trim().toLowerCase()]
      );
      if (res.rows.length === 0) return err("User not found", 404);
      return json({ user: res.rows[0] });
    }

    // POST /messenger/logout
    if (action === "logout" && req.method === "POST") {
      const { user_id } = await req.json();
      if (!user_id) return err("user_id required");
      await pool.query(`UPDATE ${schema}.users SET is_online=false, last_seen=NOW() WHERE id=$1`, [user_id]);
      return json({ ok: true });
    }

    // GET /messenger/users?q=search
    if (action === "users" && req.method === "GET") {
      const q = url.searchParams.get("q") || "";
      const current = url.searchParams.get("current_user_id") || "";
      let res;
      if (q.length >= 2) {
        res = await pool.query(
          `SELECT id, username, display_name, avatar_color, is_online, last_seen FROM ${schema}.users WHERE (username ILIKE $1 OR display_name ILIKE $1) AND id != $2 LIMIT 20`,
          [`%${q}%`, current || "00000000-0000-0000-0000-000000000000"]
        );
      } else {
        res = await pool.query(
          `SELECT id, username, display_name, avatar_color, is_online, last_seen FROM ${schema}.users WHERE id != $1 ORDER BY display_name LIMIT 30`,
          [current || "00000000-0000-0000-0000-000000000000"]
        );
      }
      return json({ users: res.rows });
    }

    // GET /messenger/chats?user_id=xxx
    if (action === "chats" && req.method === "GET") {
      const user_id = url.searchParams.get("user_id");
      if (!user_id) return err("user_id required");
      const res = await pool.query(
        `SELECT 
          c.id, c.type, c.name, c.description, c.avatar_color, c.created_at,
          (SELECT content FROM ${schema}.messages WHERE chat_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM ${schema}.messages WHERE chat_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
          (SELECT COUNT(*) FROM ${schema}.messages WHERE chat_id=c.id AND is_read=false AND sender_id != $1) as unread_count,
          CASE WHEN c.type='private' THEN (
            SELECT u.display_name FROM ${schema}.users u 
            JOIN ${schema}.chat_members cm2 ON cm2.user_id=u.id 
            WHERE cm2.chat_id=c.id AND cm2.user_id != $1 LIMIT 1
          ) ELSE c.name END as display_name,
          CASE WHEN c.type='private' THEN (
            SELECT u.avatar_color FROM ${schema}.users u 
            JOIN ${schema}.chat_members cm2 ON cm2.user_id=u.id 
            WHERE cm2.chat_id=c.id AND cm2.user_id != $1 LIMIT 1
          ) ELSE c.avatar_color END as display_color,
          CASE WHEN c.type='private' THEN (
            SELECT u.is_online FROM ${schema}.users u 
            JOIN ${schema}.chat_members cm2 ON cm2.user_id=u.id 
            WHERE cm2.chat_id=c.id AND cm2.user_id != $1 LIMIT 1
          ) ELSE false END as partner_online,
          CASE WHEN c.type='private' THEN (
            SELECT u.id FROM ${schema}.users u 
            JOIN ${schema}.chat_members cm2 ON cm2.user_id=u.id 
            WHERE cm2.chat_id=c.id AND cm2.user_id != $1 LIMIT 1
          ) ELSE NULL END as partner_id
        FROM ${schema}.chats c
        JOIN ${schema}.chat_members cm ON cm.chat_id=c.id AND cm.user_id=$1
        ORDER BY last_message_at DESC NULLS LAST`,
        [user_id]
      );
      return json({ chats: res.rows });
    }

    // POST /messenger/chats - create/get private chat
    if (action === "chats" && req.method === "POST") {
      const body = await req.json();
      const { user_id, partner_id, type, name } = body;
      if (!user_id) return err("user_id required");

      if (type === "group") {
        if (!name) return err("name required for group");
        const colors = ["#2AABEE","#E91E63","#9C27B0","#FF5722","#4CAF50","#FF9800"];
        const color = colors[Math.floor(Math.random() * colors.length)];
        const chat = await pool.query(
          `INSERT INTO ${schema}.chats(type, name, avatar_color, created_by) VALUES('group',$1,$2,$3) RETURNING *`,
          [name, color, user_id]
        );
        const chatId = chat.rows[0].id;
        await pool.query(`INSERT INTO ${schema}.chat_members(chat_id, user_id, role) VALUES($1,$2,'admin')`, [chatId, user_id]);
        if (body.member_ids && Array.isArray(body.member_ids)) {
          for (const mid of body.member_ids) {
            await pool.query(`INSERT INTO ${schema}.chat_members(chat_id, user_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [chatId, mid]);
          }
        }
        return json({ chat: chat.rows[0] });
      }

      // private chat
      if (!partner_id) return err("partner_id required");
      // check if exists
      const existing = await pool.query(
        `SELECT c.id FROM ${schema}.chats c
         JOIN ${schema}.chat_members cm1 ON cm1.chat_id=c.id AND cm1.user_id=$1
         JOIN ${schema}.chat_members cm2 ON cm2.chat_id=c.id AND cm2.user_id=$2
         WHERE c.type='private' LIMIT 1`,
        [user_id, partner_id]
      );
      if (existing.rows.length > 0) return json({ chat_id: existing.rows[0].id, existing: true });
      const chat = await pool.query(
        `INSERT INTO ${schema}.chats(type, created_by) VALUES('private',$1) RETURNING *`,
        [user_id]
      );
      const chatId = chat.rows[0].id;
      await pool.query(`INSERT INTO ${schema}.chat_members(chat_id, user_id) VALUES($1,$2)`, [chatId, user_id]);
      await pool.query(`INSERT INTO ${schema}.chat_members(chat_id, user_id) VALUES($1,$2)`, [chatId, partner_id]);
      return json({ chat_id: chatId, existing: false });
    }

    // GET /messenger/messages?chat_id=xxx&before=timestamp
    if (action === "messages" && req.method === "GET") {
      const chat_id = url.searchParams.get("chat_id");
      const before = url.searchParams.get("before");
      const user_id = url.searchParams.get("user_id");
      if (!chat_id) return err("chat_id required");
      let query: string;
      let params: unknown[];
      if (before) {
        query = `SELECT m.id, m.content, m.type, m.is_read, m.created_at, m.sender_id,
          u.display_name as sender_name, u.avatar_color as sender_color, u.username as sender_username
          FROM ${schema}.messages m
          LEFT JOIN ${schema}.users u ON u.id=m.sender_id
          WHERE m.chat_id=$1 AND m.created_at < $2
          ORDER BY m.created_at DESC LIMIT 40`;
        params = [chat_id, before];
      } else {
        query = `SELECT m.id, m.content, m.type, m.is_read, m.created_at, m.sender_id,
          u.display_name as sender_name, u.avatar_color as sender_color, u.username as sender_username
          FROM ${schema}.messages m
          LEFT JOIN ${schema}.users u ON u.id=m.sender_id
          WHERE m.chat_id=$1
          ORDER BY m.created_at DESC LIMIT 40`;
        params = [chat_id];
      }
      const res = await pool.query(query, params);
      // mark as read
      if (user_id) {
        await pool.query(
          `UPDATE ${schema}.messages SET is_read=true WHERE chat_id=$1 AND sender_id != $2 AND is_read=false`,
          [chat_id, user_id]
        );
      }
      return json({ messages: res.rows.reverse() });
    }

    // POST /messenger/messages
    if (action === "messages" && req.method === "POST") {
      const { chat_id, sender_id, content, type: msgType } = await req.json();
      if (!chat_id || !sender_id || !content) return err("chat_id, sender_id, content required");
      const res = await pool.query(
        `INSERT INTO ${schema}.messages(chat_id, sender_id, content, type) VALUES($1,$2,$3,$4) RETURNING *`,
        [chat_id, sender_id, content.trim(), msgType || "text"]
      );
      const msg = res.rows[0];
      // get sender info
      const user = await pool.query(`SELECT display_name, avatar_color, username FROM ${schema}.users WHERE id=$1`, [sender_id]);
      if (user.rows.length > 0) {
        msg.sender_name = user.rows[0].display_name;
        msg.sender_color = user.rows[0].avatar_color;
        msg.sender_username = user.rows[0].username;
      }
      return json({ message: msg });
    }

    // GET /messenger/poll?chat_id=xxx&after=timestamp&user_id=xxx
    if (action === "poll" && req.method === "GET") {
      const chat_id = url.searchParams.get("chat_id");
      const after = url.searchParams.get("after");
      const user_id = url.searchParams.get("user_id");
      if (!chat_id || !after) return err("chat_id and after required");
      const res = await pool.query(
        `SELECT m.id, m.content, m.type, m.is_read, m.created_at, m.sender_id,
          u.display_name as sender_name, u.avatar_color as sender_color, u.username as sender_username
          FROM ${schema}.messages m
          LEFT JOIN ${schema}.users u ON u.id=m.sender_id
          WHERE m.chat_id=$1 AND m.created_at > $2
          ORDER BY m.created_at ASC`,
        [chat_id, after]
      );
      if (user_id && res.rows.length > 0) {
        await pool.query(
          `UPDATE ${schema}.messages SET is_read=true WHERE chat_id=$1 AND sender_id != $2 AND is_read=false`,
          [chat_id, user_id]
        );
      }
      return json({ messages: res.rows });
    }

    // GET /messenger/chat_updates?user_id=xxx&after=timestamp
    if (action === "chat_updates" && req.method === "GET") {
      const user_id = url.searchParams.get("user_id");
      const after = url.searchParams.get("after");
      if (!user_id || !after) return err("user_id and after required");
      const res = await pool.query(
        `SELECT DISTINCT m.chat_id,
          (SELECT content FROM ${schema}.messages WHERE chat_id=m.chat_id ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM ${schema}.messages WHERE chat_id=m.chat_id ORDER BY created_at DESC LIMIT 1) as last_message_at,
          (SELECT COUNT(*) FROM ${schema}.messages WHERE chat_id=m.chat_id AND is_read=false AND sender_id != $1) as unread_count
        FROM ${schema}.messages m
        JOIN ${schema}.chat_members cm ON cm.chat_id=m.chat_id AND cm.user_id=$1
        WHERE m.created_at > $2`,
        [user_id, after]
      );
      return json({ updates: res.rows });
    }

    return err("Not found", 404);
  } catch (e: unknown) {
    console.error("Messenger API error:", e);
    return err("Internal server error", 500);
  }
}