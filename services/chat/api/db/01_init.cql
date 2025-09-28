CREATE KEYSPACE IF NOT EXISTS chat
  WITH REPLICATION = { 'class': 'SimpleStrategy', 'replication_factor': 1 };

CREATE TABLE IF NOT EXISTS chat.users (
  id          uuid,
  org_id      uuid,
  display_name text,

  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS chat.rooms (
  id          timeuuid,
  org_id      uuid,
  is_private  boolean,
  
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS chat.room_members (
  room_id     uuid,
  user_id     uuid,
  org_id      uuid,
  last_seen_message_id timeuuid,

  PRIMARY KEY ((room_id), user_id)
);

CREATE TABLE IF NOT EXISTS chat.threads (
  id          timeuuid,
  org_id      uuid,
  room_id     uuid,

  PRIMARY KEY ((room_id), id)
);

CREATE TABLE IF NOT EXISTS chat.messages (
  id          timeuuid,
  room_id     uuid,
  send_at     timestamp,
  thread_id   uuid,
  user_id     uuid,
  org_id      uuid,
  type        text,
  content     text,
  PRIMARY KEY ((room_id), send_at, id)
) WITH CLUSTERING ORDER BY (send_at ASC, id ASC);