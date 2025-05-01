import { Router } from "express";
import {
    getLaboratorios,
    getLaboratorioById,
    createLaboratorio,
    updateLaboratorio,
    deleteLaboratorio, getTopDocentesLaboratorios, getLaboratoriosPorDocente
} from "../controllers/laboratorios.controller.js";

const router = Router();

router.get("/laboratorios", getLaboratorios);
router.get("/laboratorios/:id", getLaboratorioById);
router.post("/laboratorios", createLaboratorio);
router.put("/laboratorios/:id", updateLaboratorio);
router.delete("/laboratorios/:id", deleteLaboratorio);
router.get('/top-docentes-laboratorios', getTopDocentesLaboratorios);

router.get('/laboratorios-por-docente/:id_docente', getLaboratoriosPorDocente);


export default router;
