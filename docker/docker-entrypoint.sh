#!/bin/sh
# 🚀 TECH HY Ecosystem Docker Entrypoint
# Runtime environment variable substitution for frontend

set -e

# Default values for environment variables
export REACT_APP_BSC_RPC_URL=${REACT_APP_BSC_RPC_URL:-"https://bsc-testnet-rpc.publicnode.com"}
export REACT_APP_BSC_CHAIN_ID=${REACT_APP_BSC_CHAIN_ID:-"97"}
export REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT:-"production"}
export REACT_APP_VERSION=${REACT_APP_VERSION:-"1.0.0"}
export REACT_APP_BUILD_DATE=${REACT_APP_BUILD_DATE:-$(date -u +"%Y-%m-%dT%H:%M:%SZ")}

# Contract addresses (from deployed-ecosystem.json)
export REACT_APP_VC_TOKEN=${REACT_APP_VC_TOKEN:-"0xC88eC091302Eb90e78a4CA361D083330752dfc9A"}
export REACT_APP_VG_TOKEN=${REACT_APP_VG_TOKEN:-"0xe87c0Ff36084033FfB56aCf68F2dD5857C65342d"}
export REACT_APP_LP_LOCKER=${REACT_APP_LP_LOCKER:-"0x9269baba99cE0388Daf814E351b4d556fA728D32"}
export REACT_APP_GOVERNOR=${REACT_APP_GOVERNOR:-"0x786133467f52813Ce0855023D4723A244524563E"}
export REACT_APP_TIMELOCK=${REACT_APP_TIMELOCK:-"0x06EEB4c972c05BBEbf960Fec99f483dC95768e39"}
export REACT_APP_LP_TOKEN=${REACT_APP_LP_TOKEN:-"0xA221093a37396c6301db4B24D55E1C871DF31d13"}

# TECH HY branding
export REACT_APP_BRAND_NAME=${REACT_APP_BRAND_NAME:-"TECH HY Ecosystem"}
export REACT_APP_BRAND_URL=${REACT_APP_BRAND_URL:-"https://techhy.me"}
export REACT_APP_SUPPORT_EMAIL=${REACT_APP_SUPPORT_EMAIL:-"i@techhy.me"}

# Analytics and monitoring
export REACT_APP_ANALYTICS_ID=${REACT_APP_ANALYTICS_ID:-""}
export REACT_APP_SENTRY_DSN=${REACT_APP_SENTRY_DSN:-""}

echo "🚀 Starting TECH HY Ecosystem Frontend..."
echo "📊 Environment: $REACT_APP_ENVIRONMENT"
echo "🌐 BSC RPC: $REACT_APP_BSC_RPC_URL"
echo "⛓️ Chain ID: $REACT_APP_BSC_CHAIN_ID"
echo "🏢 Brand: $REACT_APP_BRAND_NAME"

# Generate runtime environment configuration
echo "🔧 Generating runtime environment configuration..."
envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js

echo "✅ Environment configuration ready!"
echo "📝 Contract addresses:"
echo "   VC Token: $REACT_APP_VC_TOKEN"
echo "   VG Token: $REACT_APP_VG_TOKEN"
echo "   LP Locker: $REACT_APP_LP_LOCKER"
echo "   Governor: $REACT_APP_GOVERNOR"

# Execute the main command
echo "🌐 Starting nginx..."
exec "$@" 