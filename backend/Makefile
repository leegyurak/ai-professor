.PHONY: help test dev clean build lint format

# Load .env file if it exists
ifneq (,$(wildcard .env))
    include .env
    export
endif

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

test: ## Run tests
	./gradlew test

test-report: ## Run tests and open report
	./gradlew test
	open build/reports/tests/test/index.html

dev: ## Run application in development mode
	@test -f .env || (echo "Error: .env file not found. Please copy .env.example to .env and configure it." && exit 1)
	SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun

dev-docker: ## Run application with Docker Compose
	@test -f .env || (echo "Error: .env file not found. Please copy .env.example to .env and configure it." && exit 1)
	docker-compose up -d mysql redis
	@echo "Waiting for services to be ready..."
	@sleep 10
	SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun

clean: ## Clean build artifacts
	./gradlew clean

build: ## Build the application
	./gradlew build

lint: ## Run ktlint check
	./gradlew ktlintCheck

format: ## Format code with ktlint
	./gradlew ktlintFormat

docker-up: ## Start all services with Docker Compose
	docker-compose up -d

docker-down: ## Stop all services with Docker Compose
	docker-compose down

docker-logs: ## Show Docker Compose logs
	docker-compose logs -f

docker-clean: ## Remove all Docker volumes and images
	docker-compose down -v
	docker system prune -f

flyway-info: ## Show Flyway migration status
	./gradlew flywayInfo

flyway-validate: ## Validate Flyway migrations
	./gradlew flywayValidate

flyway-migrate: ## Apply Flyway migrations
	./gradlew flywayMigrate

flyway-clean: ## Clean database (WARNING: Deletes all data)
	./gradlew flywayClean
