PNPM?=pnpm
PYTHON?=python

.PHONY: install dev build lint typecheck test db-up db-down agents infra-validate

install:
	$(PNPM) install

build:
	$(PNPM) build

dev:
	$(PNPM) dev

lint:
	$(PNPM) lint

typecheck:
	$(PNPM) typecheck

test:
	$(PNPM) test

db-up:
	docker compose up -d postgres timescaledb redis rabbitmq qdrant

db-down:
	docker compose down

agents:
	$(PYTHON) -m pip install -r agents-requirements.txt

infra-validate:
	node scripts/validate-infra.mjs
