.PHONY: all down logs logs-server logs-client lint clean fclean

DC = docker compose -f docker-compose.yml

all:
	@echo "Starting all services..."
	$(DC) up -d --build
	@echo "Frontend → http://localhost:5173"
	@echo "Backend  → http://localhost:3000"
	@echo "API docs → http://localhost:3000/api-docs"

down:
	$(DC) down

logs:
	$(DC) logs -f

logs-server:
	docker logs -f hypertube-server

logs-client:
	docker logs -f hypertube-client

lint:
	cd client && npm run lint
	cd server && npm run lint

clean: down -v -rmi all

fclean: down
	docker system prune -af
	docker volume prune -f