import { Router } from 'express';
import {
    getPracticas,
    getPracticaById,
    createPractica,
    updatePractica,
    deletePractica
} from '../controllers/practicas.controller.js';

const router = Router();

router.get('/practicas', getPracticas);
router.get('/practicas/:id', getPracticaById);
router.post('/practicas', createPractica);
router.put('/practicas/:id', updatePractica);
router.delete('/practicas/:id', deletePractica);

export default router;
