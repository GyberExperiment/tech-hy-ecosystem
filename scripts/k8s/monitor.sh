#!/bin/bash
# 📊 TECH HY Ecosystem K3S Monitoring Script

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
NAMESPACE=${NAMESPACE:-"techhy-ecosystem"}

echo -e "${CYAN}📊 TECH HY Ecosystem K3S Monitoring${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed${NC}"
    exit 1
fi

print_info "Monitoring namespace: $NAMESPACE"

# Show overview
echo -e "${YELLOW}Pods:${NC}"
kubectl get pods -n "$NAMESPACE"

echo -e "${YELLOW}Services:${NC}"
kubectl get services -n "$NAMESPACE"

echo -e "${YELLOW}Ingress:${NC}"
kubectl get ingress -n "$NAMESPACE" 