import { Router } from "express";
import {
    createMateriaLaboratorio,
    getMateriasLaboratorio,
    getMateriaLaboratorioByIds,
    updateMateriaLaboratorio,
    deleteMateriaLaboratorio
} from "../controllers/materiaLaboratorio.controller.js";

const router = Router();

router.post("/materia-laboratorio", createMateriaLaboratorio);
router.get("/materia-laboratorio", getMateriasLaboratorio);
router.get("/materia-laboratorio/:id_materia/:id_laboratorio", getMateriaLaboratorioByIds);
router.put("/materia-laboratorio/:id_materia/:id_laboratorio", updateMateriaLaboratorio);
router.delete("/materia-laboratorio/:id_materia/:id_laboratorio", deleteMateriaLaboratorio);

export default router;
