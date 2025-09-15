DOCKER_DIR=infra/docker
DC=docker compose -f $(DOCKER_DIR)/compose.dev.yml --env-file $(DOCKER_DIR)/.env.dev

.PHONY: dev-up dev-up-build dev-down dev-logs dev-ps \
        dev-edge-logs dev-bff-logs dev-auth-logs \
        dev-edge-build dev-bff-build dev-auth-build \
        dev-edge-restart dev-bff-restart dev-auth-restart \
        dev-identity-logs dev-identity-build dev-setup
dev-up:
	$(DC) up -d

dev-up-build:
	$(DC) up -d --build

dev-down:
	$(DC) down -v

dev-logs:
	$(DC) logs -f --tail=200

dev-ps:
	$(DC) ps

# Service-specific logs
dev-edge-logs:
	$(DC) logs -f edge

dev-bff-logs:
	$(DC) logs -f bff

dev-auth-logs:
	$(DC) logs -f auth

# Rebuild and (re)start individual services
dev-edge-build:
	$(DC) build --no-cache edge && $(DC) up -d edge

dev-bff-build:
	$(DC) build --no-cache bff && $(DC) up -d bff

dev-auth-build:
	$(DC) build --no-cache auth && $(DC) up -d auth

# Restart running services without rebuild
dev-edge-restart:
	$(DC) restart edge

dev-bff-restart:
	$(DC) restart bff

dev-auth-restart:
	$(DC) restart auth

# Identity service specific commands
dev-identity-logs:
	$(DC) logs -f identity

dev-identity-build:
	$(DC) build --no-cache identity
	$(DC) up -d identity

# Setup development environment
dev-setup:
	@echo "Setting up development environment..."
	@if [ ! -f $(DOCKER_DIR)/.env.dev ]; then \
		echo "Creating .env.dev from example..."; \
		cp $(DOCKER_DIR)/.env.dev.example $(DOCKER_DIR)/.env.dev; \
		echo "Please edit $(DOCKER_DIR)/.env.dev with your configuration"; \
	fi
	@echo "Generating JWT keys for Identity service..."
	@cd services/identity && \
		if [ ! -f private.pem ]; then \
			openssl genpkey -algorithm RSA -out private.pem -pkcs8 -pkeyopt rsa_keygen_bits:2048; \
		fi && \
		if [ ! -f public.pem ]; then \
			openssl rsa -pubout -in private.pem -out public.pem; \
		fi
	@echo "Development environment setup complete!"
	@echo "Run 'make dev-up' to start all services"
