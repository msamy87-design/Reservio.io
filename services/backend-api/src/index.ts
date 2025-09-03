

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import businessesRouter from './routes/businesses';
import bookingsRouter from './routes/bookings';
import authRouter from './routes/auth';
import customerRouter from './routes/customer';
import bizRouter from './routes/biz';
import paymentsRouter from './routes/payments';
import adminRouter from './routes/admin';
import { runSimulatedCronJobs } from './services/notificationService';

dotenv.config();

const app: express.Express = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json({ limit: '10mb' })); // Enable parsing of JSON request bodies, increase limit for images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
// FIX: Use explicit Request and Response types from express to fix method errors.
app.get('/api', (req: Request, res: Response) => {
  res.send('Reservio API is running!');
});

app.use('/api/businesses', businessesRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/auth', authRouter);
app.use('/api/customer', customerRouter);
app.use('/api/biz', bizRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/admin', adminRouter);


// Start Server
app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
  
  // Run simulated cron jobs on startup
  runSimulatedCronJobs();
});