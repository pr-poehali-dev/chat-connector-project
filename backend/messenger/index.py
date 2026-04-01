import os
import json
import re
import random
from urllib.parse import urlparse, parse_qs
import psycopg
import requests as http_requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

DATABASE_URL = os.environ.get("DATABASE_URL", "")
SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p79267135_chat_connector_proje")
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")
YANDEX_CLIENT_ID = os.environ.get("YANDEX_CLIENT_ID", "")
YANDEX_CLIENT_SECRET = os.environ.get("YANDEX_CLIENT_SECRET", "")

COLORS = ["#2AABEE", "#E91E63", "#9C27B0", "#FF5722", "#4CAF50", "#FF9800", "#00BCD4", "#3F51B5"]


def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Content-Type": "application/json",
    }


def json_response(data, status=200):
    return {"statusCode": status, "headers": cors_headers(), "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": cors_headers(), "body": json.dumps({"error": msg})}


def get_conn():
    return psycopg.connect(DATABASE_URL)


async def handler(request):
    # Support both dict-style and object-style request
    if isinstance(request, dict):
        method = request.get("method", "GET")
        full_url = request.get("url", "") or request.get("path", "")
        body_raw = request.get("body", "") or ""
        query_params = dict(request.get("queryParams", {}) or request.get("query", {}) or {})
    else:
        method = getattr(request, "method", "GET")
        full_url = str(getattr(request, "url", ""))
        try:
            body_raw = await request.body()
            if isinstance(body_raw, bytes):
                body_raw = body_raw.decode("utf-8")
        except Exception:
            body_raw = ""
        query_params = {}

    # Parse URL for path and query string
    try:
        parsed = urlparse(full_url)
        path = parsed.path
        qs = parse_qs(parsed.query)
        for k, v in qs.items():
            if k not in query_params:
                query_params[k] = v[0] if v else ""
    except Exception:
        path = full_url.split("?")[0] if "?" in str(full_url) else str(full_url)

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": cors_headers(), "body": ""}

    # Parse action from path
    parts = [p for p in path.strip("/").split("/") if p]
    action = parts[1] if len(parts) > 1 else (parts[0] if parts else "")

    body = {}
    if body_raw:
        try:
            body = json.loads(body_raw)
        except Exception:
            pass

    try:
        with get_conn() as conn:
            with conn.cursor() as cur:

                # POST /messenger/register
                if action == "register" and method == "POST":
                    username = body.get("username", "")
                    display_name = body.get("display_name", "")
                    if not username or not display_name:
                        return err("username and display_name required")
                    trim_user = username.strip().lower()
                    if not re.match(r'^[a-z0-9_]{3,30}$', trim_user):
                        return err("Username must be 3-30 chars: letters, digits, underscore")
                    cur.execute(f'SELECT id FROM {SCHEMA}.users WHERE username=%s', (trim_user,))
                    if cur.fetchone():
                        return err("Username already taken", 409)
                    color = random.choice(COLORS)
                    cur.execute(
                        f'INSERT INTO {SCHEMA}.users(username, display_name, avatar_color) VALUES(%s,%s,%s) RETURNING id, username, display_name, avatar_color, bio, created_at',
                        (trim_user, display_name.strip(), color)
                    )
                    row = cur.fetchone()
                    cols = [d[0] for d in cur.description]
                    conn.commit()
                    return json_response({"user": dict(zip(cols, row))})

                # POST /messenger/login
                if action == "login" and method == "POST":
                    username = body.get("username", "")
                    if not username:
                        return err("username required")
                    cur.execute(
                        f'UPDATE {SCHEMA}.users SET is_online=true, last_seen=NOW() WHERE username=%s RETURNING id, username, display_name, avatar_color, bio, is_online',
                        (username.strip().lower(),)
                    )
                    row = cur.fetchone()
                    if not row:
                        return err("User not found", 404)
                    cols = [d[0] for d in cur.description]
                    conn.commit()
                    return json_response({"user": dict(zip(cols, row))})

                # POST /messenger/oauth_login
                if action == "oauth_login" and method == "POST":
                    provider = body.get("provider", "")
                    token = body.get("token", "")
                    if not provider or not token:
                        return err("provider and token required")

                    oauth_id = None
                    display_name = None
                    email = None

                    if provider == "google":
                        try:
                            idinfo = id_token.verify_oauth2_token(
                                token, google_requests.Request(), GOOGLE_CLIENT_ID
                            )
                            oauth_id = "google_" + idinfo["sub"]
                            display_name = idinfo.get("name", idinfo.get("email", "User"))
                            email = idinfo.get("email", "")
                        except Exception as e:
                            return err(f"Invalid Google token: {str(e)}", 401)

                    elif provider == "yandex":
                        try:
                            resp = http_requests.get(
                                "https://login.yandex.ru/info",
                                headers={"Authorization": f"OAuth {token}"},
                                timeout=10
                            )
                            if resp.status_code != 200:
                                return err("Invalid Yandex token", 401)
                            yinfo = resp.json()
                            oauth_id = "yandex_" + yinfo["id"]
                            display_name = yinfo.get("real_name") or yinfo.get("display_name") or yinfo.get("login", "User")
                            email = yinfo.get("default_email", "")
                        except Exception as e:
                            return err(f"Yandex auth error: {str(e)}", 401)
                    else:
                        return err("Unknown provider")

                    # Try to find existing user by oauth_id
                    cur.execute(
                        f'SELECT id, username, display_name, avatar_color, bio, is_online FROM {SCHEMA}.users WHERE oauth_id=%s',
                        (oauth_id,)
                    )
                    row = cur.fetchone()
                    if row:
                        cols = [d[0] for d in cur.description]
                        user = dict(zip(cols, row))
                        # Update online status
                        cur.execute(
                            f'UPDATE {SCHEMA}.users SET is_online=true, last_seen=NOW() WHERE id=%s',
                            (user["id"],)
                        )
                        conn.commit()
                        user["is_online"] = True
                        return json_response({"user": user})

                    # Create new user
                    color = random.choice(COLORS)
                    # Generate unique username from display_name or email
                    base = re.sub(r'[^a-z0-9_]', '_', (email.split("@")[0] if email else display_name).lower())[:20]
                    base = re.sub(r'_+', '_', base).strip('_') or "user"
                    if len(base) < 3:
                        base = base + "_user"
                    username = base
                    suffix = 1
                    while True:
                        cur.execute(f'SELECT id FROM {SCHEMA}.users WHERE username=%s', (username,))
                        if not cur.fetchone():
                            break
                        username = f"{base}_{suffix}"
                        suffix += 1

                    cur.execute(
                        f'INSERT INTO {SCHEMA}.users(username, display_name, avatar_color, oauth_id, oauth_provider) VALUES(%s,%s,%s,%s,%s) RETURNING id, username, display_name, avatar_color, bio, is_online',
                        (username, display_name, color, oauth_id, provider)
                    )
                    row = cur.fetchone()
                    cols = [d[0] for d in cur.description]
                    conn.commit()
                    return json_response({"user": dict(zip(cols, row))})

                # POST /messenger/logout
                if action == "logout" and method == "POST":
                    user_id = body.get("user_id", "")
                    if not user_id:
                        return err("user_id required")
                    cur.execute(f'UPDATE {SCHEMA}.users SET is_online=false, last_seen=NOW() WHERE id=%s', (user_id,))
                    conn.commit()
                    return json_response({"ok": True})

                # GET /messenger/users
                if action == "users" and method == "GET":
                    q = query_params.get("q", "")
                    current = query_params.get("current_user_id", "00000000-0000-0000-0000-000000000000")
                    if len(q) >= 2:
                        cur.execute(
                            f'SELECT id, username, display_name, avatar_color, is_online, last_seen FROM {SCHEMA}.users WHERE (username ILIKE %s OR display_name ILIKE %s) AND id != %s LIMIT 20',
                            (f'%{q}%', f'%{q}%', current)
                        )
                    else:
                        cur.execute(
                            f'SELECT id, username, display_name, avatar_color, is_online, last_seen FROM {SCHEMA}.users WHERE id != %s ORDER BY display_name LIMIT 30',
                            (current,)
                        )
                    cols = [d[0] for d in cur.description]
                    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
                    return json_response({"users": rows})

                # GET /messenger/chats
                if action == "chats" and method == "GET":
                    user_id = query_params.get("user_id")
                    if not user_id:
                        return err("user_id required")
                    cur.execute(f"""
                        SELECT
                          c.id, c.type, c.name, c.description, c.avatar_color, c.created_at,
                          (SELECT content FROM {SCHEMA}.messages WHERE chat_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                          (SELECT created_at FROM {SCHEMA}.messages WHERE chat_id=c.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
                          (SELECT COUNT(*) FROM {SCHEMA}.messages WHERE chat_id=c.id AND is_read=false AND sender_id != %s) as unread_count,
                          CASE WHEN c.type='private' THEN (
                            SELECT u.display_name FROM {SCHEMA}.users u
                            JOIN {SCHEMA}.chat_members cm2 ON cm2.user_id=u.id
                            WHERE cm2.chat_id=c.id AND cm2.user_id != %s LIMIT 1
                          ) ELSE c.name END as display_name,
                          CASE WHEN c.type='private' THEN (
                            SELECT u.avatar_color FROM {SCHEMA}.users u
                            JOIN {SCHEMA}.chat_members cm2 ON cm2.user_id=u.id
                            WHERE cm2.chat_id=c.id AND cm2.user_id != %s LIMIT 1
                          ) ELSE c.avatar_color END as display_color,
                          CASE WHEN c.type='private' THEN (
                            SELECT u.is_online FROM {SCHEMA}.users u
                            JOIN {SCHEMA}.chat_members cm2 ON cm2.user_id=u.id
                            WHERE cm2.chat_id=c.id AND cm2.user_id != %s LIMIT 1
                          ) ELSE false END as partner_online,
                          CASE WHEN c.type='private' THEN (
                            SELECT u.id FROM {SCHEMA}.users u
                            JOIN {SCHEMA}.chat_members cm2 ON cm2.user_id=u.id
                            WHERE cm2.chat_id=c.id AND cm2.user_id != %s LIMIT 1
                          ) ELSE NULL END as partner_id
                        FROM {SCHEMA}.chats c
                        JOIN {SCHEMA}.chat_members cm ON cm.chat_id=c.id AND cm.user_id=%s
                        ORDER BY last_message_at DESC NULLS LAST
                    """, (user_id, user_id, user_id, user_id, user_id, user_id))
                    cols = [d[0] for d in cur.description]
                    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
                    return json_response({"chats": rows})

                # POST /messenger/chats
                if action == "chats" and method == "POST":
                    user_id = body.get("user_id")
                    if not user_id:
                        return err("user_id required")
                    chat_type = body.get("type", "private")
                    if chat_type == "group":
                        name = body.get("name")
                        if not name:
                            return err("name required for group")
                        color = random.choice(COLORS)
                        cur.execute(
                            f"INSERT INTO {SCHEMA}.chats(type, name, avatar_color, created_by) VALUES('group',%s,%s,%s) RETURNING *",
                            (name, color, user_id)
                        )
                        chat_cols = [d[0] for d in cur.description]
                        chat_row = dict(zip(chat_cols, cur.fetchone()))
                        chat_id = chat_row["id"]
                        cur.execute(f"INSERT INTO {SCHEMA}.chat_members(chat_id, user_id, role) VALUES(%s,%s,'admin')", (chat_id, user_id))
                        for mid in body.get("member_ids", []):
                            cur.execute(f"INSERT INTO {SCHEMA}.chat_members(chat_id, user_id) VALUES(%s,%s) ON CONFLICT DO NOTHING", (chat_id, mid))
                        conn.commit()
                        return json_response({"chat": chat_row})

                    partner_id = body.get("partner_id")
                    if not partner_id:
                        return err("partner_id required")
                    cur.execute(f"""
                        SELECT c.id FROM {SCHEMA}.chats c
                        JOIN {SCHEMA}.chat_members cm1 ON cm1.chat_id=c.id AND cm1.user_id=%s
                        JOIN {SCHEMA}.chat_members cm2 ON cm2.chat_id=c.id AND cm2.user_id=%s
                        WHERE c.type='private' LIMIT 1
                    """, (user_id, partner_id))
                    existing = cur.fetchone()
                    if existing:
                        return json_response({"chat_id": str(existing[0]), "existing": True})
                    cur.execute(f"INSERT INTO {SCHEMA}.chats(type, created_by) VALUES('private',%s) RETURNING id", (user_id,))
                    chat_id = cur.fetchone()[0]
                    cur.execute(f"INSERT INTO {SCHEMA}.chat_members(chat_id, user_id) VALUES(%s,%s)", (chat_id, user_id))
                    cur.execute(f"INSERT INTO {SCHEMA}.chat_members(chat_id, user_id) VALUES(%s,%s)", (chat_id, partner_id))
                    conn.commit()
                    return json_response({"chat_id": str(chat_id), "existing": False})

                # GET /messenger/messages
                if action == "messages" and method == "GET":
                    chat_id = query_params.get("chat_id")
                    before = query_params.get("before")
                    user_id = query_params.get("user_id")
                    if not chat_id:
                        return err("chat_id required")
                    if before:
                        cur.execute(f"""
                            SELECT m.id, m.content, m.type, m.is_read, m.created_at, m.sender_id,
                              u.display_name as sender_name, u.avatar_color as sender_color, u.username as sender_username
                            FROM {SCHEMA}.messages m
                            JOIN {SCHEMA}.users u ON u.id=m.sender_id
                            WHERE m.chat_id=%s AND m.created_at < %s::timestamptz
                            ORDER BY m.created_at DESC LIMIT 50
                        """, (chat_id, before))
                    else:
                        cur.execute(f"""
                            SELECT m.id, m.content, m.type, m.is_read, m.created_at, m.sender_id,
                              u.display_name as sender_name, u.avatar_color as sender_color, u.username as sender_username
                            FROM {SCHEMA}.messages m
                            JOIN {SCHEMA}.users u ON u.id=m.sender_id
                            WHERE m.chat_id=%s
                            ORDER BY m.created_at DESC LIMIT 50
                        """, (chat_id,))
                    cols = [d[0] for d in cur.description]
                    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
                    rows.reverse()
                    if user_id:
                        cur.execute(f"UPDATE {SCHEMA}.messages SET is_read=true WHERE chat_id=%s AND sender_id != %s AND is_read=false", (chat_id, user_id))
                        conn.commit()
                    return json_response({"messages": rows})

                # POST /messenger/messages
                if action == "messages" and method == "POST":
                    chat_id = body.get("chat_id")
                    sender_id = body.get("sender_id")
                    content = body.get("content")
                    if not chat_id or not sender_id or not content:
                        return err("chat_id, sender_id, content required")
                    cur.execute(f"""
                        INSERT INTO {SCHEMA}.messages(chat_id, sender_id, content)
                        VALUES(%s,%s,%s)
                        RETURNING id, chat_id, sender_id, content, type, is_read, created_at
                    """, (chat_id, sender_id, content))
                    cols = [d[0] for d in cur.description]
                    row = dict(zip(cols, cur.fetchone()))
                    conn.commit()
                    return json_response({"message": row})

                # GET /messenger/poll
                if action == "poll" and method == "GET":
                    chat_id = query_params.get("chat_id")
                    after = query_params.get("after")
                    user_id = query_params.get("user_id")
                    if not chat_id or not after:
                        return err("chat_id and after required")
                    cur.execute(f"""
                        SELECT m.id, m.content, m.type, m.is_read, m.created_at, m.sender_id,
                          u.display_name as sender_name, u.avatar_color as sender_color, u.username as sender_username
                        FROM {SCHEMA}.messages m
                        JOIN {SCHEMA}.users u ON u.id=m.sender_id
                        WHERE m.chat_id=%s AND m.created_at > %s::timestamptz
                        ORDER BY m.created_at ASC LIMIT 50
                    """, (chat_id, after))
                    cols = [d[0] for d in cur.description]
                    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
                    if user_id and rows:
                        cur.execute(f"UPDATE {SCHEMA}.messages SET is_read=true WHERE chat_id=%s AND sender_id != %s AND is_read=false", (chat_id, user_id))
                        conn.commit()
                    return json_response({"messages": rows})

                # GET /messenger/chat_updates
                if action == "chat_updates" and method == "GET":
                    user_id = query_params.get("user_id")
                    after = query_params.get("after")
                    if not user_id or not after:
                        return err("user_id and after required")
                    cur.execute(f"""
                        SELECT DISTINCT m.chat_id,
                          MAX(m.created_at) as last_message_at,
                          (SELECT content FROM {SCHEMA}.messages WHERE chat_id=m.chat_id ORDER BY created_at DESC LIMIT 1) as last_message,
                          (SELECT COUNT(*) FROM {SCHEMA}.messages WHERE chat_id=m.chat_id AND is_read=false AND sender_id != %s) as unread_count
                        FROM {SCHEMA}.messages m
                        JOIN {SCHEMA}.chat_members cm ON cm.chat_id=m.chat_id AND cm.user_id=%s
                        WHERE m.created_at > %s::timestamptz
                        GROUP BY m.chat_id
                    """, (user_id, user_id, after))
                    cols = [d[0] for d in cur.description]
                    rows = [dict(zip(cols, r)) for r in cur.fetchall()]
                    return json_response({"updates": rows})

                return err("Not found", 404)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return err(str(e), 500)