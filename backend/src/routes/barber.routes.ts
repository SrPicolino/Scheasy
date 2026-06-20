import { Router } from 'express';
import { getBarbers, createBarber } from '../controllers/barberController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/', getBarbers);
router.post('/', authMiddleware, createBarber);

export default router;
