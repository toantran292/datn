FROM pgvector/pgvector:0.7.4-pg16

# Seed databases the first time the data directory is created.
COPY init-identity-db.sql /docker-entrypoint-initdb.d/10-init-identity-db.sql