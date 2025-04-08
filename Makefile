all:
	docker compose up --build

prod:
	docker compose -f compose.yml -f compose.prod.yml up --build

clean:
	docker compose down -v
	docker volume prune -af
	docker network prune -f

re: clean all

fclean: clean
	docker system prune -a --volumes