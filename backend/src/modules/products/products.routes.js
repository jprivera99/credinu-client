import { Router } from 'express';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { getProducts } from './products.controller.js';

const router = Router();

router.get('/', verifyToken, getProducts);

export default router;