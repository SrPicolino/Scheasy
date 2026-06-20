import { Router } from 'express';
import { getServices, createService, updateService, deleteService } from '../controllers/serviceController';
import { authMiddleware } from '../utils/auth';

const router = Router();

router.get('/', getServices);
router.post('/', authMiddleware, createService);
router.put('/:id', authMiddleware, updateService);
router.delete('/:id', authMiddleware, deleteService);

export default router;
