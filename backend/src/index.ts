import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';

import apiRoutes from './routes/api';
import { initReminderJob } from './services/reminderService';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.send('Barbershop Scheduler API is running. Use /api for endpoints.');
});

// Start background jobs
initReminderJob();

import { errorHandler } from './utils/errorHandler';

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Global Error Handler (must be the last middleware)
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
