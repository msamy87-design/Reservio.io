#!/bin/bash

# Reservio Backend Deployment Script for Railway
# This script prepares and deploys the backend API to Railway

set -e  # Exit on any error

echo "🚀 Reservio Backend Deployment Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
print_status "Checking Railway CLI installation..."
if ! command -v railway &> /dev/null; then
    print_error "Railway CLI is not installed. Installing now..."
    npm install -g @railway/cli
    print_success "Railway CLI installed successfully"
else
    print_success "Railway CLI is already installed"
fi

# Check if user is logged in to Railway
print_status "Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    print_warning "Not logged in to Railway. Please run 'railway login' first"
    echo "After logging in, run this script again."
    exit 1
else
    print_success "Authenticated with Railway"
fi

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if required files exist
required_files=(".env" "package.json" "railway.json" "tsconfig.json")
for file in "${required_files[@]}"; do
    if [[ ! -f "$file" ]]; then
        print_error "Required file $file not found!"
        exit 1
    fi
done
print_success "All required files present"

# Check if MongoDB URI is set
if ! grep -q "MONGODB_URI" .env; then
    print_error "MONGODB_URI not found in .env file!"
    exit 1
fi
print_success "MongoDB URI configured"

# Check TypeScript compilation
print_status "Checking TypeScript compilation..."
if npm run typecheck; then
    print_success "TypeScript compilation successful"
else
    print_warning "TypeScript compilation has warnings/errors, but continuing..."
fi

# Install dependencies
print_status "Installing production dependencies..."
npm ci --production=false
print_success "Dependencies installed"

# Build the application
print_status "Building application..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed!"
    exit 1
fi

# Set environment variables in Railway
print_status "Setting environment variables in Railway..."
railway variables set NODE_ENV=production
railway variables set MONGODB_URI="$(grep MONGODB_URI .env | cut -d '=' -f2)"
railway variables set JWT_SECRET="$(grep JWT_SECRET .env | cut -d '=' -f2)"
railway variables set JWT_EXPIRE="$(grep JWT_EXPIRE .env | cut -d '=' -f2)"
railway variables set JWT_REFRESH_EXPIRE="$(grep JWT_REFRESH_EXPIRE .env | cut -d '=' -f2)"
railway variables set RATE_LIMIT_WINDOW_MS="$(grep RATE_LIMIT_WINDOW_MS .env | cut -d '=' -f2)"
railway variables set RATE_LIMIT_MAX_REQUESTS="$(grep RATE_LIMIT_MAX_REQUESTS .env | cut -d '=' -f2)"
railway variables set GEMINI_API_KEY="$(grep GEMINI_API_KEY .env | cut -d '=' -f2)"
railway variables set FRONTEND_URL="$(grep FRONTEND_URL .env | cut -d '=' -f2)"
railway variables set ALLOWED_ORIGINS="$(grep ALLOWED_ORIGINS .env | cut -d '=' -f2)"
railway variables set LOG_LEVEL="info"
railway variables set COOKIE_SECRET="$(grep COOKIE_SECRET .env | cut -d '=' -f2)"
railway variables set BCRYPT_ROUNDS="$(grep BCRYPT_ROUNDS .env | cut -d '=' -f2)"

print_success "Environment variables set"

# Deploy to Railway
print_status "Deploying to Railway..."
if railway up --detach; then
    print_success "Deployment initiated successfully!"
    
    # Get deployment URL
    print_status "Getting deployment information..."
    sleep 5  # Wait for deployment to start
    
    if railway status; then
        print_success "Deployment status retrieved"
    fi
    
    echo ""
    echo "🎉 Deployment Summary:"
    echo "======================"
    echo "✅ Application built successfully"
    echo "✅ Environment variables configured"
    echo "✅ Deployed to Railway"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Check Railway dashboard for deployment status"
    echo "2. Test your API endpoints"
    echo "3. Update frontend CORS origins if needed"
    echo "4. Set up monitoring and alerts"
    echo ""
    echo "🔗 Useful Commands:"
    echo "• railway logs    - View application logs"
    echo "• railway status  - Check deployment status"
    echo "• railway open    - Open Railway dashboard"
    echo ""
    
else
    print_error "Deployment failed!"
    print_status "Check Railway logs with: railway logs"
    exit 1
fi

print_success "Deployment script completed!"