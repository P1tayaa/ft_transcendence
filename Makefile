all:
	docker compose up --build

https:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build

clean:
	docker system prune -a -f --volumes

merge:
	git pull && git merge origin/oscar