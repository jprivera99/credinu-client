import { Router } from 'express';
import {verifyToken } from '../../middleware/auth.middleware.js';
import { getApplications } from './applications.controller.js';

const router = Router();
router.get("/", verifyToken, getApplications);

export default router;