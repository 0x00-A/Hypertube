.PHONY: help dev prod down clean logs test lint server down-server logs-server

# Optional build flag: make dev build=true
all:
	docker compose -f docker-compose.yml up -d --build
	@echo "\nUse 'make logs' to follow logs"
	@echo "Access the frontend at http://localhost:5173"
	@echo "Access the backend at http://localhost:3000"

## Start only the server services (MongoDB, Mongo Express, and Backend)
server:
	@echo "Starting server services..."
	docker compose -f server/docker-compose.yml up -d --build
	@echo "\nServer services started!"
	@echo "Use 'make logs-server' to follow server logs"

## Stop server services
down-server:
	@echo "Stopping server services..."
	docker compose -f server/docker-compose.yml down

## View logs for server services (only app, not MongoDB)
logs-server:
	docker logs hypertube-server

## View all server logs including MongoDB
logs-server-all:
	docker compose -f server/docker-compose.yml logs -f
## Start production environment
# prod:
# 	@echo "Starting production environment..."
# 	docker-compose -f docker-compose.prod.yml up -d --build

## Stop all services
down:
	@echo "Stopping all services..."
	docker compose -f docker-compose.yml down
# 	docker-compose -f docker-compose.prod.yml down

## Remove all containers, volumes, and images
clean: down
	@echo "Cleaning up..."
	docker system prune -af
	docker volume prune -f

## View logs
logs:
	docker compose -f docker-compose.yml logs -f

## View logs for a specific service (usage: make logs-service service=frontend)
logs-service:
	docker-compose -f docker-compose.yml logs -f $(service)

## Run tests
test:
	@echo "Running tests..."
	cd ./client && npm test
	cd ./server && npm test -- --passWithNoTests

## Run server tests in Docker
test-server:
	@echo "Running server tests in Docker..."
	cd ./server && docker compose -f docker-compose.yml exec app npm test -- --passWithNoTests

## Run linting
lint:
	@echo "Linting frontend..."
	cd ./client && npm run lint
	@echo "Linting backend..."
	cd ./server && npm run lint

## Run server lint in Docker
lint-server:
	@echo "Running server lint in Docker..."
	cd ./server && docker compose -f docker-compose.yml exec app npm run lint

## Build for production
# build:
# 	@echo "Building for production..."
# 	docker-compose -f docker-compose.prod.yml build

## Restart a specific service (usage: make restart service=frontend)
restart:
	docker-compose -f docker-compose.yml restart $(service)

## Show status of services
status:
	docker-compose -f docker-compose.yml ps

## Enter shell in a container (usage: make shell service=frontend)
shell:
	docker-compose -f docker-compose.yml exec $(service) sh