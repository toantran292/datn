FROM postgres:16-alpine

# Seed the identity database the first time the data directory is created.
COPY init-identity-db.sql /docker-entrypoint-initdb.d/10-init-identity-db.sql
