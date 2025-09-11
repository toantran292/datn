DOCKER_DIR=infra/docker

.PHONY: dev-up dev-down dev-logs dev-ps
dev-up:
	cd $(DOCKER_DIR) && docker compose -f compose.dev.yml --env-file .env.dev up -d

dev-down:
	cd $(DOCKER_DIR) && docker compose -f compose.dev.yml --env-file .env.dev down -v

dev-logs:
	cd $(DOCKER_DIR) && docker compose -f compose.dev.yml logs -f --tail=200

dev-ps:
	cd $(DOCKER_DIR) && docker compose -f compose.dev.yml ps