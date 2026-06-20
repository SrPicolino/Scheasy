import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import apiRoutes from './routes/api';
import { initReminderJob } from './services/reminderService';
import barbershopRoutes from './routes/barbershop.routes';
import { errorHandler } from './utils/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Main API router (services, barbers, appointments, auth, etc.)
app.use('/api', apiRoutes);

// Barbershop routes (public: /api/barbershops/:slug, admin-protected: /api/barbershops/)
app.use('/api/barbershops', barbershopRoutes);

app.get('/', (req, res) => {
  res.send('Barbershop Scheduler API is running. Use /api for endpoints.');
});

// Start background jobs
initReminderJob();

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
