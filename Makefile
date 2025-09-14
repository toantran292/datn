DOCKER_DIR=infra/docker

.PHONY: dev-up dev-down dev-logs dev-ps dev-identity-logs dev-identity-build dev-setup
dev-up:
	cd $(DOCKER_DIR) && docker compose -f compose.dev.yml --env-file .env.dev up -d

dev-down:
	cd $(DOCKER_DIR) && docker compose -f compose.dev.yml --env-file .env.dev down -v

dev-logs:
	cd $(DOCKER_DIR) && docker compose -f compose.dev.yml logs -f --tail=200

dev-ps:
	cd $(DOCKER_DIR) && docker compose -f compose.dev.yml ps

# Identity service specific commands
dev-identity-logs:
	cd $(DOCKER_DIR) && docker compose -f compose.dev.yml logs -f identity

dev-identity-build:
	cd $(DOCKER_DIR) && docker compose -f compose.dev.yml build --no-cache identity
	cd $(DOCKER_DIR) && docker compose -f compose.dev.yml up -d identity

# Setup development environment
dev-setup:
	@echo "Setting up development environment..."
	@if [ ! -f $(DOCKER_DIR)/.env.dev ]; then \
		echo "Creating .env.dev from example..."; \
		cp $(DOCKER_DIR)/env.dev.example $(DOCKER_DIR)/.env.dev; \
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