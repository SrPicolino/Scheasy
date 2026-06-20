import { Router } from 'express';

import serviceRoutes from './service.routes';
import barberRoutes from './barber.routes';
import appointmentRoutes from './appointment.routes';
import ratingRoutes from './rating.routes';
import customerRoutes from './customer.routes';
import authRoutes from './auth.routes';
import waitingListRoutes from './waiting-list.routes';

const router = Router();

// Modular Routes
router.use('/services', serviceRoutes);
router.use('/barbers', barberRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/ratings', ratingRoutes);
router.use('/customer', customerRoutes);
router.use('/auth', authRoutes);
router.use('/waiting-list', waitingListRoutes);

// Retrocompatibility for root login
import { login } from '../controllers/adminController';
router.post('/login', login);

export default router;
