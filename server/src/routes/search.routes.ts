import { Router } from 'express';
import { searchAll } from '../controllers/search.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', searchAll);

export default router;
