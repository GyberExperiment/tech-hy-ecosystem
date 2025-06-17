#!/bin/bash
# 🚀 TECH HY Ecosystem K3S Deploy Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${ENVIRONMENT:-"production"}
NAMESPACE=${NAMESPACE:-"techhy-ecosystem"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}
DRY_RUN=${DRY_RUN:-"false"}

echo -e "${CYAN}🚀 TECH HY Ecosystem K3S Deployment Script${NC}"
echo -e "${BLUE}================================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
echo -e "${PURPLE}🔍 Checking prerequisites...${NC}"

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

if ! command -v envsubst &> /dev/null; then
    print_error "envsubst is not installed (usually part of gettext package)"
    exit 1
fi

# Test kubectl connection
if ! kubectl cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Check your kubeconfig."
    exit 1
fi

print_status "Prerequisites check passed"

# Set environment-specific values
if [[ "$ENVIRONMENT" == "development" ]]; then
    NAMESPACE="techhy-ecosystem-dev"
    IMAGE_TAG="${IMAGE_TAG:-dev-latest}"
    print_info "Deploying to DEVELOPMENT environment"
elif [[ "$ENVIRONMENT" == "staging" ]]; then
    NAMESPACE="techhy-ecosystem-staging"
    IMAGE_TAG="${IMAGE_TAG:-staging-latest}"
    print_info "Deploying to STAGING environment"
elif [[ "$ENVIRONMENT" == "stage-debug" ]]; then
    NAMESPACE="techhy-ecosystem-stage-debug"
    IMAGE_TAG="${IMAGE_TAG:-stage-debug-latest}"
    print_info "Deploying to STAGE-DEBUG environment"
else
    NAMESPACE="techhy-ecosystem"
    IMAGE_TAG="${IMAGE_TAG:-latest}"
    print_info "Deploying to PRODUCTION environment"
fi

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo -e "   Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "   Namespace:   ${YELLOW}$NAMESPACE${NC}"
echo -e "   Image Tag:   ${YELLOW}$IMAGE_TAG${NC}"
echo -e "   Dry Run:     ${YELLOW}$DRY_RUN${NC}"
echo ""

# Export variables for envsubst
export IMAGE_TAG
export NAMESPACE

# Apply dry run flag if set
KUBECTL_ARGS=""
if [[ "$DRY_RUN" == "true" ]]; then
    KUBECTL_ARGS="--dry-run=client"
    print_warning "DRY RUN mode enabled - no actual changes will be made"
fi

# Deploy function
deploy_manifest() {
    local manifest=$1
    local description=$2
    
    print_info "Deploying $description..."
    
    if [[ -f "$manifest" ]]; then
        if [[ "$manifest" == *"deployment.yaml" ]]; then
            # Apply environment-specific substitutions to deployment
            envsubst < "$manifest" | \
            sed "s/techhy-ecosystem/$NAMESPACE/g" | \
            sed "s/environment: production/environment: $ENVIRONMENT/g" | \
            kubectl apply $KUBECTL_ARGS -f -
        else
            # Apply standard substitutions
            envsubst < "$manifest" | \
            sed "s/techhy-ecosystem/$NAMESPACE/g" | \
            kubectl apply $KUBECTL_ARGS -f -
        fi
        print_status "$description deployed successfully"
    else
        print_warning "$manifest not found, skipping $description"
    fi
}

# Start deployment
echo -e "${PURPLE}🚀 Starting deployment...${NC}"

# 1. Create namespace
print_info "Creating namespace: $NAMESPACE"
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply $KUBECTL_ARGS -f -

# 2. Deploy manifests in order
deploy_manifest "k8s/configmap.yaml" "ConfigMap and Secrets"
deploy_manifest "k8s/deployment.yaml" "Deployment and HPA"
deploy_manifest "k8s/service.yaml" "Service and ServiceMonitor"
deploy_manifest "k8s/ingress.yaml" "Ingress and Certificate"

# Wait for deployment if not dry run
if [[ "$DRY_RUN" != "true" ]]; then
    echo -e "${PURPLE}⏳ Waiting for deployment to be ready...${NC}"
    
    # Check if deployment exists first
    if kubectl get deployment techhy-ecosystem-frontend -n "$NAMESPACE" &> /dev/null; then
        kubectl rollout status deployment/techhy-ecosystem-frontend -n "$NAMESPACE" --timeout=300s
        print_status "Deployment is ready!"
    else
        print_warning "Deployment not found, skipping rollout status check"
    fi
    
    # Show deployment status
    echo -e "${BLUE}📊 Deployment Status:${NC}"
    kubectl get pods -n "$NAMESPACE" -l app.kubernetes.io/name=techhy-ecosystem
    echo ""
    kubectl get services -n "$NAMESPACE"
    echo ""
    kubectl get ingress -n "$NAMESPACE"
    
    # Get external URLs
    echo -e "${GREEN}🌐 Access URLs:${NC}"
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo -e "   Production: ${CYAN}https://ecosystem.techhy.me${NC}"
    elif [[ "$ENVIRONMENT" == "development" ]]; then
        echo -e "   Development: ${CYAN}https://dev.stage.techhyecosystem.build.infra.gyber.org${NC}"
    elif [[ "$ENVIRONMENT" == "staging" ]]; then
        echo -e "   Staging: ${CYAN}https://stage.techhyecosystem.build.infra.gyber.org${NC}"
    elif [[ "$ENVIRONMENT" == "stage-debug" ]]; then
        echo -e "   Stage Debug: ${CYAN}https://stage-debug.techhyecosystem.build.infra.gyber.org${NC}"
    fi
    
    echo ""
    print_status "TECH HY Ecosystem deployed successfully! 🎉"
    
    # Health check
    echo -e "${PURPLE}🔍 Running health check...${NC}"
    sleep 10
    
    HEALTH_URL=""
    if [[ "$ENVIRONMENT" == "production" ]]; then
        HEALTH_URL="https://stage.techhyecosystem.build.infra.gyber.org/health"
    else
        # Use port-forward for local testing
        kubectl port-forward service/techhy-ecosystem-frontend-service 8080:80 -n "$NAMESPACE" &
        PORT_FORWARD_PID=$!
        sleep 5
        HEALTH_URL="http://localhost:8080/health"
    fi
    
    if curl -f -s "$HEALTH_URL" > /dev/null 2>&1; then
        print_status "Health check passed! ✨"
        if [[ -n "$PORT_FORWARD_PID" ]]; then
            kill $PORT_FORWARD_PID 2>/dev/null || true
        fi
    else
        print_warning "Health check failed - app might still be starting up"
        if [[ -n "$PORT_FORWARD_PID" ]]; then
            kill $PORT_FORWARD_PID 2>/dev/null || true
        fi
    fi
else
    print_info "Dry run completed - review the output above"
fi

echo -e "${CYAN}================================================${NC}"
echo -e "${GREEN}🎉 Deployment script completed!${NC}" 