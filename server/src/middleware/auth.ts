import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'nexora_default_dev_secret';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`[AUTH_DEBUG] ${req.method} ${req.originalUrl} - authHeaderPresent=false`);
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (verifyErr) {
      console.log(`[AUTH_DEBUG] ${req.method} ${req.originalUrl} - authHeaderPresent=true, tokenVerified=false`);
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      console.log(`[AUTH_DEBUG] ${req.method} ${req.originalUrl} - authHeaderPresent=true, tokenVerified=true, userFound=false`);
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    console.log(`[AUTH_DEBUG] ${req.method} ${req.originalUrl} - authHeaderPresent=true, tokenVerified=true, userFound=true`);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
