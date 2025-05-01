import { Router } from "express";

import {
    createEncargado,
    getEncargados,
    getEncargadoById,
    updateEncargado,
    deleteEncargado,
} from "../controllers/encargado.controller.js";

const router = Router();

router.post("/encargados", createEncargado);
router.get("/encargados", getEncargados);
router.get("/encargados/:id", getEncargadoById);
router.put("/encargados/:id", updateEncargado);
router.delete("/encargados/:id", deleteEncargado);

export default router;
