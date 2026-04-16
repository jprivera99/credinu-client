import { Router } from 'express';
import {
    preRegister,
    validateEmail,
    validatePhone,
    validateSMS,
    sendCode, 
    validateCode,
    validateRegister
} from './register.controller.js';

const router = Router();

router.post('/pre-register', preRegister);
router.get('/validate-email', validateEmail);
router.get('/validate-phone', validatePhone);
router.post('/validate-sms', validateSMS);
router.post("/send-code", sendCode);
router.post("/validate-code", validateCode);
router.post("/validate", validateRegister);

export default router;