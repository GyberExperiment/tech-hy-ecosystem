# 🚀 TECH HY Ecosystem Makefile
# Convenient commands for development and deployment

.PHONY: help install test build docker deploy monitor clean

# Default target
help: ## Show this help message
	@echo "🚀 TECH HY Ecosystem - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "🌍 Environment Variables:"
	@echo "  ENVIRONMENT  - deployment environment (production|development|staging|stage-debug)"
	@echo "  NAMESPACE    - kubernetes namespace"
	@echo "  IMAGE_TAG    - docker image tag"

# Development Commands
install: ## Install all dependencies
	@echo "📦 Installing root dependencies..."
	npm install
	@echo "📦 Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ Dependencies installed!"

test: ## Run all tests
	@echo "🧪 Running smart contract tests..."
	npm run test
	@echo "🎨 Running frontend tests..."
	cd frontend && npm run test
	@echo "✅ All tests passed!"

lint: ## Run linting for all code
	@echo "🔍 Linting smart contracts..."
	npm run lint:sol
	npm run lint:ts
	@echo "🔍 Linting frontend..."
	cd frontend && npm run lint
	@echo "✅ Linting completed!"

compile: ## Compile smart contracts
	@echo "🔨 Compiling smart contracts..."
	npm run compile
	@echo "✅ Contracts compiled!"

# Build Commands
build-frontend: ## Build frontend for production
	@echo "🏗️ Building frontend..."
	cd frontend && npm run build
	@echo "✅ Frontend built!"

build-docker: ## Build Docker image
	@echo "🐳 Building Docker image..."
	docker build -t ghcr.io/gyberexperiment/tech-hy-ecosystem:latest .
	@echo "✅ Docker image built!"

build: compile build-frontend build-docker ## Build everything

# Docker Commands
docker-run: ## Run Docker container locally
	@echo "🚀 Running Docker container..."
	docker run -p 8080:80 ghcr.io/gyberexperiment/tech-hy-ecosystem:latest
	@echo "🌐 Access at: http://localhost:8080"

docker-push: ## Push Docker image to registry
	@echo "📤 Pushing Docker image..."
	docker push ghcr.io/gyberexperiment/tech-hy-ecosystem:latest
	@echo "✅ Image pushed!"

# Kubernetes Commands
deploy-prod: ## Deploy to production K3S
	@echo "🚀 Deploying to production..."
	ENVIRONMENT=production ./scripts/k8s/deploy.sh
	@echo "✅ Production deployment completed!"

deploy-stage-debug: ## Deploy to stage-debug K3S
	@echo "🎭 Deploying to stage-debug..."
	ENVIRONMENT=stage-debug ./scripts/k8s/deploy.sh
	@echo "✅ Stage-debug deployment completed!"

deploy-dev: ## Deploy to development K3S
	@echo "🧪 Deploying to development..."
	ENVIRONMENT=development ./scripts/k8s/deploy.sh
	@echo "✅ Development deployment completed!"

deploy-dry: ## Dry run deployment
	@echo "🔍 Running deployment dry run..."
	DRY_RUN=true ./scripts/k8s/deploy.sh
	@echo "✅ Dry run completed!"

# Monitoring Commands
monitor: ## Monitor K3S deployment
	@echo "📊 Monitoring deployment..."
	./scripts/k8s/monitor.sh

monitor-stage-debug: ## Monitor stage-debug deployment
	@echo "📊 Monitoring stage-debug deployment..."
	NAMESPACE=techhy-ecosystem-stage-debug ./scripts/k8s/monitor.sh

monitor-dev: ## Monitor development deployment
	@echo "📊 Monitoring development deployment..."
	NAMESPACE=techhy-ecosystem-dev ./scripts/k8s/monitor.sh

logs: ## Show application logs
	@echo "📋 Showing application logs..."
	kubectl logs -f deployment/techhy-ecosystem-frontend -n techhy-ecosystem

logs-stage-debug: ## Show stage-debug logs
	@echo "📋 Showing stage-debug logs..."
	kubectl logs -f deployment/techhy-ecosystem-stage-debug-deployment -n techhy-ecosystem-stage-debug

logs-dev: ## Show development logs
	@echo "📋 Showing development logs..."
	kubectl logs -f deployment/techhy-ecosystem-frontend -n techhy-ecosystem-dev

# Health Commands
health: ## Check application health
	@echo "🔍 Checking health..."
	curl -f https://ecosystem.techhy.me/health || echo "❌ Health check failed"

health-stage-debug: ## Check stage-debug health
	@echo "🔍 Checking stage-debug health..."
	curl -f https://stage-debug.techhyecosystem.build.infra.gyber.org/health || echo "❌ Stage-debug health check failed"

health-local: ## Check local health via port-forward
	@echo "🔍 Checking local health..."
	kubectl port-forward service/techhy-ecosystem-frontend-service 8080:80 -n techhy-ecosystem &
	sleep 3
	curl -f http://localhost:8080/health && echo "✅ Health check passed"
	pkill -f "kubectl port-forward" || true

# Utility Commands
clean: ## Clean build artifacts and node_modules
	@echo "🧹 Cleaning build artifacts..."
	rm -rf node_modules
	rm -rf frontend/node_modules
	rm -rf frontend/dist
	rm -rf artifacts
	rm -rf cache
	@echo "✅ Cleaned!"

reset-k8s: ## Reset K3S deployment (delete everything)
	@echo "⚠️  Resetting K3S deployment..."
	kubectl delete namespace techhy-ecosystem --ignore-not-found=true
	kubectl delete namespace techhy-ecosystem-dev --ignore-not-found=true
	@echo "✅ K3S reset completed!"

# Quick Development Workflow
dev: install compile ## Quick development setup
	@echo "🚀 Development environment ready!"

# Production Workflow  
prod: test build deploy-prod ## Full production deployment
	@echo "🎉 Production deployment completed!"

# Status Commands
status: ## Show all deployment status
	@echo "📊 Production Status:"
	kubectl get pods,svc,ingress -n techhy-ecosystem || echo "❌ Production not deployed"
	@echo ""
	@echo "📊 Stage Debug Status:"
	kubectl get pods,svc,ingress -n techhy-ecosystem-stage-debug || echo "❌ Stage Debug not deployed"
	@echo ""
	@echo "📊 Development Status:"
	kubectl get pods,svc,ingress -n techhy-ecosystem-dev || echo "❌ Development not deployed"

# Version and Info
version: ## Show version information
	@echo "🏷️ TECH HY Ecosystem Version Information:"
	@echo "   Frontend: $(shell cd frontend && npm pkg get version | tr -d '"')"
	@echo "   Node.js: $(shell node --version)"
	@echo "   NPM: $(shell npm --version)"
	@echo "   Docker: $(shell docker --version | cut -d' ' -f3 | tr -d ',')"
	@echo "   Kubectl: $(shell kubectl version --client --short 2>/dev/null | cut -d' ' -f3)"

info: version ## Show project information
	@echo ""
	@echo "🌐 TECH HY Ecosystem Information:"
	@echo "   Main Site: https://techhy.me"
	@echo "   Ecosystem: https://ecosystem.techhy.me"
	@echo "   Repository: https://github.com/GyberExperiment/tech-hy-ecosystem"
	@echo "   Support: i@techhy.me" 