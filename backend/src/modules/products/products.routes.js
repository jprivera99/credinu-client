import { Router } from 'express';
import { verifyToken, authMiddleware} from '../../middleware/auth.middleware.js';
import { getProducts, getProductsByinstitucions } from './products.controller.js';

const router = Router();

router.get('/', verifyToken, getProducts);
router.get('/institucion', verifyToken, authMiddleware, getProductsByinstitucions);

export default router;