DOCKER_DIR = infra/docker
DC = docker compose -f $(DOCKER_DIR)/compose.dev.yml --env-file $(DOCKER_DIR)/.env.dev

#########################################################################
# ENV = dev
# SERVICE = edge | bff | auth | identity | ...
#########################################################################

ENV ?= dev

# ---- Generic commands ----
$(ENV).up:
	$(DC) up -d

$(ENV).up.build:
	$(DC) up -d --build

$(ENV).down:
	$(DC) down -v

$(ENV).logs:
	$(DC) logs -f --tail=200

$(ENV).ps:
	$(DC) ps

# ---- Per-service generic commands ----
# Usage:
#   make dev.logs.edge
#   make dev.build.auth
#   make dev.restart.identity

$(ENV).logs.%:
	@container_name=$$($(DC) ps -q $* | head -1); \
	if [ -n "$$container_name" ]; then \
		docker logs -f $$container_name; \
	else \
		echo "Service $* is not running"; \
	fi

$(ENV).restart.%:
	$(DC) restart $*

$(ENV).build.%:
	$(DC) build --no-cache $* && $(DC) up -d $*

# ---- Setup ----
$(ENV).setup:
	@echo "Setting up development environment..."

	@if [ ! -f $(DOCKER_DIR)/.env.dev ]; then \
		echo "Creating .env.dev from example..."; \
		cp $(DOCKER_DIR)/.env.dev.example $(DOCKER_DIR)/.env.dev; \
		echo "Please edit $(DOCKER_DIR)/.env.dev with your configuration"; \
	fi

	@echo "Generating JWT keys for Identity service..."
	@cd services/identity && \
		if [ ! -f private.pem ]; then \
			openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048; \
		fi && \
		if [ ! -f public.pem ]; then \
			openssl rsa -pubout -in private.pem -out public.pem; \
		fi

	@echo "Setup complete! Run 'make dev.up' to start services"

# ---- DB Setup ----
$(ENV).setup.db:
	PGPASSWORD=uts_dev_pw psql -h 127.0.0.1 -p 41000 -U uts -d postgres \
		-c "CREATE DATABASE identity;" || true