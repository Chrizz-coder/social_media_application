.PHONY: dev stop reset logs

dev:
	docker-compose up -d
	pnpm dev

stop:
	docker-compose down

reset:
	docker-compose down -v

logs:
	docker-compose logs -f
