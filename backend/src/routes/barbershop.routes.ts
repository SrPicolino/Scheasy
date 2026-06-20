import { Router } from 'express';
import {
  getBarbershopBySlug,
  getAllBarbershops,
  createBarbershop,
  updateBarbershop
} from '../controllers/barbershopController';
import { authMiddleware } from '../utils/auth';

const router = Router();

// Admin-only routes (must be defined BEFORE the /:slug route to avoid conflicts)
router.get('/', authMiddleware, getAllBarbershops);
router.post('/', authMiddleware, createBarbershop);
router.put('/:id', authMiddleware, updateBarbershop);

// Public: Get a barbershop's full data by its slug (used by the booking page)
router.get('/:slug', getBarbershopBySlug);

export default router;
