import { Router } from 'express';
import { createAlerta, getAlertas } from '../controllers/Alertas.controllers.js';

const router = Router();

router.get('/alertas', getAlertas); 
router.post('/alertas', createAlerta);  

export default router;
