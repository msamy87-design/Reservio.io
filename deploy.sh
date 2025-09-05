#!/bin/bash

echo "🚀 RESERVIO.IO PRODUCTION DEPLOYMENT"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Building the application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed! Please fix errors and try again.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"

echo -e "${BLUE}Step 2: Deploying to Vercel...${NC}"
vercel --prod

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Deployment failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Deployment successful!${NC}"

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo -e "${YELLOW}IMPORTANT: Set these environment variables in Vercel dashboard:${NC}"
echo "1. Go to your Vercel project dashboard"
echo "2. Click Settings → Environment Variables"
echo "3. Add these variables:"
echo ""
echo "MONGODB_URI=mongodb+srv://reservio-admin:<password>@reservio-production.xxxxx.mongodb.net/reservio?retryWrites=true&w=majority"
echo "JWT_SECRET=QFWlASGsKPQ/Gr6HJasLqYb30AAAj/cHsmSveqLkpoXNV5XfAViKOCyw6q9hpy0U"
echo "JWT_EXPIRE=15m"
echo "JWT_REFRESH_EXPIRE=7d"
echo "BCRYPT_ROUNDS=12"
echo "COOKIE_SECRET=Iz/HJbcLDALDl8FdKa0I8qEsSAa6LuMOBq8N5I8i/A4="
echo "RATE_LIMIT_WINDOW_MS=900000"
echo "RATE_LIMIT_MAX_REQUESTS=100"
echo "LOG_LEVEL=info"
echo "NODE_ENV=production"
echo ""
echo -e "${GREEN}4. Click 'Save' and redeploy if needed${NC}"
echo ""
echo -e "${BLUE}Your secure, production-ready SaaS is now LIVE! 🎉${NC}"