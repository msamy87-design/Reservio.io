
// FIX: Switch to default express import to resolve type conflicts.
import express from 'express';
// FIX: Remove ambiguous Request, Response imports to prevent type conflicts
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import businessesRouter from './routes/businesses';
import bookingsRouter from './routes/bookings';
import authRouter from './routes/auth';
import customerRouter from './routes/customer';
import bizRouter from './routes/biz';
import paymentsRouter from './routes/payments';
import adminRouter from './routes/admin';
import reviewsRouter from './routes/reviews';
import waitlistRouter from './routes/waitlist';
import stripeWebhooksRouter from './routes/webhooks';
import { runSimulatedCronJobs } from './services/notificationService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- Security Middleware ---
app.use(helmet());
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 500, // Limit each IP to 500 requests per windowMs
	standardHeaders: true,
	legacyHeaders: false,
});
// FIX: Removed unnecessary type assertion
app.use(limiter);

// --- Core Middleware ---
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
};
// FIX: Removed unnecessary type assertion
app.use(cors(corsOptions));

// --- Routes ---
// FIX: Use qualified express types to resolve type errors.
app.get('/api', (req: express.Request, res: express.Response) => {
  res.send('Reservio API is running!');
});

// ⚠️ Webhooks must come BEFORE JSON body parsing
app.use('/api/webhooks', stripeWebhooksRouter);

// JSON/body parsers for normal routes
// FIX: Removed unnecessary type assertion
app.use(express.json({ limit: '10mb' }));
// FIX: Removed unnecessary type assertion
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/businesses', businessesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/auth', authRouter);
app.use('/api/customer', customerRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/biz', bizRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/waitlist', waitlistRouter);


// --- Start Server ---
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
  console.log(`[server]: Accepting requests from ${corsOptions.origin}`);
  
  runSimulatedCronJobs();
});