import { Router } from 'express';
import {
    createCarrera,
    getCarreras,
    getCarreraById,
    updateCarrera,
    deleteCarrera
} from '../controllers/carreras.controller.js';

const router = Router();

router.post('/carreras', createCarrera);
router.get('/carreras', getCarreras);
router.get('/carreras/:id', getCarreraById);
router.put('/carreras/:id', updateCarrera);
router.delete('/carreras/:id', deleteCarrera);

export default router;