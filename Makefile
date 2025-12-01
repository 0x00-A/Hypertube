.PHONY: help dev prod down clean logs test lint

# Optional build flag: make dev build=true
dev:
	@echo "Starting development environment..."
	docker-compose -f docker-compose.dev.yml up -d --build
	@echo "\nUse 'make logs' to follow logs"

## Start production environment
# prod:
# 	@echo "Starting production environment..."
# 	docker-compose -f docker-compose.prod.yml up -d --build

## Stop all services
down:
	@echo "Stopping all services..."
	docker-compose -f docker-compose.dev.yml down
# 	docker-compose -f docker-compose.prod.yml down

## Remove all containers, volumes, and images
clean: down
	@echo "Cleaning up..."
	docker system prune -af
	docker volume prune -f

## View logs
logs:
	docker-compose -f docker-compose.dev.yml logs -f

## View logs for a specific service (usage: make logs-service service=frontend)
logs-service:
	docker-compose -f docker-compose.dev.yml logs -f $(service)

## Run tests
test:
	@echo "Running tests..."
	cd ./client && npm test
	cd ./server && npm test -- --passWithNoTests

## Run linting
lint:
	@echo "Linting frontend..."
	cd ./client && npm run lint
	@echo "Linting backend..."
	cd ./server && npm run lint

## Build for production
# build:
# 	@echo "Building for production..."
# 	docker-compose -f docker-compose.prod.yml build

## Restart a specific service (usage: make restart service=frontend)
restart:
	docker-compose -f docker-compose.dev.yml restart $(service)

## Show status of services
status:
	docker-compose -f docker-compose.dev.yml ps

## Enter shell in a container (usage: make shell service=frontend)
shell:
	docker-compose -f docker-compose.dev.yml exec $(service) sh