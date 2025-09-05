# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

## PRE-DEPLOYMENT ✅

### 1. MongoDB Atlas Setup
- [ ] Create free MongoDB Atlas account at https://cloud.mongodb.com
- [ ] Create M0 Sandbox cluster (FREE)
- [ ] Create database user: `reservio-admin` 
- [ ] Set network access to `0.0.0.0/0` (allow all IPs)
- [ ] Copy connection string

### 2. Stripe Setup (Optional - for payments)
- [ ] Create Stripe account
- [ ] Get test keys for development
- [ ] Get live keys for production
- [ ] Set up webhook endpoint

### 3. Generated Secrets ✅
```bash
# JWT Secret (48 chars)
JWT_SECRET=QFWlASGsKPQ/Gr6HJasLqYb30AAAj/cHsmSveqLkpoXNV5XfAViKOCyw6q9hpy0U

# Cookie Secret (32 chars) 
COOKIE_SECRET=Iz/HJbcLDALDl8FdKa0I8qEsSAa6LuMOBq8N5I8i/A4=
```

## DEPLOYMENT PROCESS

### Option 1: Automatic Deploy (Recommended)
```bash
cd "/Users/mohamedsamy/Downloads/reservio terminal/Reservio.io"
./deploy.sh
```

### Option 2: Manual Deploy
```bash
# 1. Build the application
npm run build

# 2. Login to Vercel (choose GitHub/Google/Email)
vercel login

# 3. Deploy
vercel --prod
```

## POST-DEPLOYMENT SETUP

### 1. Environment Variables in Vercel
Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these **EXACT** variables:

```env
MONGODB_URI=mongodb+srv://reservio-admin:YOUR_PASSWORD@reservio-production.xxxxx.mongodb.net/reservio?retryWrites=true&w=majority

JWT_SECRET=QFWlASGsKPQ/Gr6HJasLqYb30AAAj/cHsmSveqLkpoXNV5XfAViKOCyw6q9hpy0U

JWT_EXPIRE=15m

JWT_REFRESH_EXPIRE=7d

BCRYPT_ROUNDS=12

COOKIE_SECRET=Iz/HJbcLDALDl8FdKa0I8qEsSAa6LuMOBq8N5I8i/A4=

RATE_LIMIT_WINDOW_MS=900000

RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=info

NODE_ENV=production

ALLOWED_ORIGINS=https://your-project-name.vercel.app
```

### 2. Seed Production Database
After setting environment variables:
```bash
# Update your local .env with production MONGODB_URI
# Then run:
npm run seed
```

### 3. Test Your Deployment

#### Health Check
Visit: `https://your-project-name.vercel.app/api/health`
Expected: `{"status":"ok",...}`

#### Authentication Test
```bash
# Test business signup
curl -X POST https://your-project-name.vercel.app/api/auth/business/signup \
  -H "Content-Type: application/json" \
  -d '{"businessName":"Test Business","email":"test@example.com","password":"TestPass123!@#"}'
```

#### Frontend Test  
Visit: `https://your-project-name.vercel.app`
- Should load the React app
- Try creating an account
- Try logging in

## SECURITY VERIFICATION ✅

### 1. Headers Check
```bash
curl -I https://your-project-name.vercel.app
```
Should include:
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`

### 2. Authentication Check
- [ ] Can't access `/api/biz/*` without token
- [ ] JWT tokens are properly signed
- [ ] Refresh tokens work correctly
- [ ] Logout clears tokens

### 3. Database Security  
- [ ] MongoDB Atlas requires authentication
- [ ] Connection uses TLS/SSL
- [ ] No sensitive data in logs

## TROUBLESHOOTING

### Common Issues

#### 1. "JWT_SECRET not defined"
- Check Vercel environment variables
- Ensure exact variable name: `JWT_SECRET`
- Redeploy after adding variables

#### 2. Database connection errors
- Verify MongoDB Atlas connection string
- Check IP whitelist (should be 0.0.0.0/0)
- Ensure correct password in connection string

#### 3. "Module not found" errors
- Check `package.json` dependencies
- Run `npm install` locally first
- Verify all imports are correct

#### 4. CORS errors
- Add your Vercel domain to `ALLOWED_ORIGINS`
- Format: `https://your-project-name.vercel.app`

## SUCCESS CRITERIA ✅

Your deployment is successful when:
- [ ] ✅ Health endpoint returns 200
- [ ] ✅ Frontend loads without errors  
- [ ] ✅ User signup/login works
- [ ] ✅ Database operations persist
- [ ] ✅ Security headers are present
- [ ] ✅ No console errors

## NEXT STEPS AFTER DEPLOYMENT

1. **Custom Domain** (Optional)
   - Add domain in Vercel dashboard
   - Update `ALLOWED_ORIGINS` environment variable

2. **Monitoring Setup**
   - Monitor via Vercel dashboard
   - Set up error tracking (Sentry)
   - MongoDB Atlas monitoring

3. **User Testing**
   - Share link with test users
   - Collect feedback
   - Monitor for errors

4. **Business Launch**
   - Create marketing materials
   - Onboard first customers
   - Set up customer support

---

## 🎉 CONGRATULATIONS!

Once these steps are complete, you'll have a **production-ready, secure SaaS platform** that businesses can use to manage their bookings!

**Your Reservio.io platform will be:**
- ✅ Fully secure with enterprise-grade authentication
- ✅ Scalable with MongoDB Atlas
- ✅ Fast with Vercel's global CDN  
- ✅ Monitored with comprehensive logging
- ✅ Ready for real customers and revenue!