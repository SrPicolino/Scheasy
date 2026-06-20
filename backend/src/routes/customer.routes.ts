import { Router } from 'express';
import { registerCustomer, loginCustomer, getCustomerProfile, cancelAppointment, updateCustomerProfile } from '../controllers/customerController';
import { customerAuthMiddleware } from '../utils/auth';

const router = Router();

router.post('/register', registerCustomer);
router.post('/login', loginCustomer);
router.get('/profile', customerAuthMiddleware, getCustomerProfile);
router.put('/profile', customerAuthMiddleware, updateCustomerProfile);
router.post('/appointments/:id/cancel', customerAuthMiddleware, cancelAppointment);

export default router;
