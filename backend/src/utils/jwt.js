import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (payload) => {
    return jwt.sign(payload, env.jwtSecret, {
        expiresIn: '8h',
        issuer: 'credinu',
    });
};

