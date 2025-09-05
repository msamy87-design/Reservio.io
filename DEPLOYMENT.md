# Deployment Guide

## Prerequisites

1. **MongoDB Atlas Account**: Create a MongoDB Atlas cluster for production
2. **Stripe Account**: Get your production Stripe keys
3. **Vercel Account**: For deployment
4. **Domain** (optional): For custom domain

## Security Checklist

### ✅ Critical Security Issues Fixed

- ✅ **Real JWT Authentication**: Replaced mock tokens with proper JWT + bcrypt
- ✅ **Database Security**: MongoDB with proper models and validation
- ✅ **Input Validation**: Comprehensive validation with Joi
- ✅ **Error Handling**: Proper error handling and logging
- ✅ **Security Headers**: Helmet.js with CSP, HSTS, and more
- ✅ **Rate Limiting**: Configurable rate limiting
- ✅ **Environment Protection**: Proper .gitignore and environment management

### Production Environment Setup

1. **MongoDB Atlas Setup**:
   ```bash
   # Create cluster at https://cloud.mongodb.com
   # Get connection string and whitelist IP addresses
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/reservio-production
   ```

2. **Generate Secure JWT Secret**:
   ```bash
   # Generate a 32+ character secret
   openssl rand -base64 32
   ```

3. **Stripe Production Setup**:
   - Get live API keys from Stripe dashboard
   - Set up webhooks for your production URL
   - Test payment flow in Stripe's test mode first

## Vercel Deployment

### 1. Environment Variables

In Vercel dashboard, set these environment variables:

```bash
# Database
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=your-32-char-secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Security
BCRYPT_ROUNDS=12
COOKIE_SECRET=your-cookie-secret

# CORS
ALLOWED_ORIGINS=https://your-domain.vercel.app

# Logging
LOG_LEVEL=info
```

### 2. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 3. Database Seeding

After deployment, seed your production database:

```bash
# Set production environment variables locally
cp .env.production.example .env

# Run seed script
npm run seed
```

## Post-Deployment Checklist

### 1. Health Check
- [ ] Visit `https://your-domain.vercel.app/api/health`
- [ ] Should return 200 status with API info

### 2. Authentication Test
- [ ] Try business signup: `POST /api/auth/business/signup`
- [ ] Try business login: `POST /api/auth/business/login`
- [ ] Verify JWT tokens are working

### 3. Database Test
- [ ] Create a test booking
- [ ] Verify data persistence
- [ ] Check MongoDB Atlas monitoring

### 4. Security Test
- [ ] Run security scan (OWASP ZAP, etc.)
- [ ] Test rate limiting
- [ ] Verify HTTPS is enforced
- [ ] Check security headers

## Monitoring Setup

### 1. Error Tracking
```javascript
// Add to your production environment
// Sentry, LogRocket, or similar service
```

### 2. Performance Monitoring
- Set up MongoDB Atlas monitoring alerts
- Configure Vercel analytics
- Monitor API response times

### 3. Uptime Monitoring
- Set up uptime checks (Pingdom, UptimeRobot)
- Monitor critical endpoints

## Database Migration

If migrating from mock data to production:

1. **Export existing data** (if any):
   ```bash
   mongoexport --uri="mongodb://localhost:27017/reservio-dev" --collection=businesses --out=businesses.json
   ```

2. **Import to production**:
   ```bash
   mongoimport --uri="mongodb+srv://..." --collection=businesses --file=businesses.json
   ```

## Backup Strategy

1. **MongoDB Atlas Backups**: Enable automatic backups
2. **Code Backups**: Git repository with regular commits
3. **Environment Variables**: Securely store in password manager

## Performance Optimization

### Backend
- [ ] Enable MongoDB indexes (already configured)
- [ ] Set up database connection pooling
- [ ] Implement API response caching where appropriate

### Frontend
- [ ] Enable Vercel Edge Caching
- [ ] Optimize bundle size
- [ ] Implement lazy loading

## Troubleshooting

### Common Issues

1. **"JWT_SECRET not defined"**
   - Ensure JWT_SECRET is set in Vercel environment variables
   - Secret must be 32+ characters

2. **Database connection errors**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string format
   - Check network connectivity

3. **CORS errors**
   - Update ALLOWED_ORIGINS environment variable
   - Ensure frontend URL matches

4. **Authentication failures**
   - Check cookie settings in production
   - Verify HTTPS is enabled
   - Test token refresh flow

### Logs

Check logs in:
- Vercel Functions tab
- MongoDB Atlas logs
- Application logs via Winston

## Security Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Rotate JWT secrets quarterly
- [ ] Review access logs
- [ ] Update security headers
- [ ] Test backup/restore procedures

### Security Monitoring
- [ ] Set up vulnerability scanning
- [ ] Monitor for suspicious activity
- [ ] Review authentication logs
- [ ] Update security policies

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review application logs
3. Verify environment variable configuration
4. Test individual components (auth, database, etc.)

Remember to never commit sensitive environment variables to Git!