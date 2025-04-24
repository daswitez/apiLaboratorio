import { Router } from 'express';
import {
    createSemestre,
    getSemestres,
    getSemestreById,
    updateSemestre,
    deleteSemestre
} from '../controllers/semestres.controller.js';

const router = Router();

router.post('/semestres', createSemestre);

router.get('/semestres', getSemestres);

router.get('/semestres/:id', getSemestreById);

router.put('/semestres/:id', updateSemestre);

router.delete('/semestres/:id', deleteSemestre);

export default router;