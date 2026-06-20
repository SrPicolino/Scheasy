import { Router } from 'express';
import { createRating, getRatings, getRatingsStats } from '../controllers/ratingController';
import { authMiddleware, customerAuthMiddleware } from '../utils/auth';

const router = Router();

router.post('/', customerAuthMiddleware, createRating);
router.get('/', authMiddleware, getRatings);
router.get('/stats', authMiddleware, getRatingsStats);

export default router;
