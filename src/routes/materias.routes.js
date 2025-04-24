import { Router } from 'express';
import {
    createMateria,
    getMaterias,
    getMateriaById,
    updateMateria,
    deleteMateria
} from '../controllers/materias.controller.js';

const router = Router();

router.post('/materias', createMateria);

router.get('/materias', getMaterias);

router.get('/materias/:id', getMateriaById);

router.put('/materias/:id', updateMateria);

router.delete('/materias/:id', deleteMateria);

export default router;