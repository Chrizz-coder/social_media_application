.PHONY: dev stop reset logs neo4j-start neo4j-stop neo4j-restart neo4j-logs

# ── Full stack ────────────────────────────────────────────────────────────────
dev:
	docker-compose up -d
	pnpm dev

stop:
	docker-compose down

# Removes named Docker volumes (mongo_data). Does NOT delete ./neo4j-data.
reset:
	docker-compose down -v

logs:
	docker-compose logs -f

# ── Neo4j only ────────────────────────────────────────────────────────────────
neo4j-start:
	docker-compose up -d neo4j

neo4j-stop:
	docker-compose stop neo4j

neo4j-restart:
	docker-compose restart neo4j

neo4j-logs:
	docker-compose logs -f neo4j
