import { Router } from "express";
import {
    getLaboratorios,
    getLaboratorioById,
    createLaboratorio,
    updateLaboratorio,
    deleteLaboratorio
} from "../controllers/laboratorios.controller.js";

const router = Router();

router.get("/laboratorios", getLaboratorios);
router.get("/laboratorios/:id", getLaboratorioById);
router.post("/laboratorios", createLaboratorio);
router.put("/laboratorios/:id", updateLaboratorio);
router.delete("/laboratorios/:id", deleteLaboratorio);

export default router;
