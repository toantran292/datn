FROM postgres:16-alpine

# Seed databases the first time the data directory is created.
COPY init-identity-db.sql /docker-entrypoint-initdb.d/10-init-identity-db.sql
COPY init-notification-db.sql /docker-entrypoint-initdb.d/20-init-notification-db.sql
COPY init-chat-db.sql /docker-entrypoint-initdb.d/30-init-chat-db.sql
