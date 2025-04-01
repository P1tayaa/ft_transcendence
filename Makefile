all:
	docker compose up --build

prod:
	docker compose -f compose.yml -f compose.prod.yml up --build

clean:
	docker compose down -v

re: clean all

fclean:
	docker system prune -a --volumes