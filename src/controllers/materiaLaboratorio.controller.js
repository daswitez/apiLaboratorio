import { getConnection } from "../database/connection.js";
import sql from "mssql";

export const createMateriaLaboratorio = async (req, res) => {
    try {
        const { id_materia, id_laboratorio } = req.body;

        if (!id_materia || !id_laboratorio) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        const pool = await getConnection();
        await pool.request()
            .input("id_materia", sql.Int, id_materia)
            .input("id_laboratorio", sql.Int, id_laboratorio)
            .query(`
                INSERT INTO MateriaLaboratorio (id_materia, id_laboratorio)
                VALUES (@id_materia, @id_laboratorio)
            `);

        res.status(201).json({ message: "Relación creada exitosamente" });
    } catch (error) {
        console.error("Error al crear relación:", error);
        res.status(500).json({ message: "Error al crear relación" });
    }
};

export const getMateriasLaboratorio = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query("SELECT id_materia, id_laboratorio FROM MateriaLaboratorio");
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener relaciones:", error);
        res.status(500).json({ message: "Error al obtener relaciones" });
    }
};

export const getMateriaLaboratorioByIds = async (req, res) => {
    try {
        const { id_materia, id_laboratorio } = req.params;

        const pool = await getConnection();
        const result = await pool.request()
            .input("id_materia", sql.Int, id_materia)
            .input("id_laboratorio", sql.Int, id_laboratorio)
            .query(`
                SELECT * 
                FROM MateriaLaboratorio
                WHERE id_materia = @id_materia AND id_laboratorio = @id_laboratorio
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Relación no encontrada" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Error al obtener relación:", error);
        res.status(500).json({ message: "Error al obtener relación" });
    }
};

export const updateMateriaLaboratorio = async (req, res) => {
    try {
        const { id_materia, id_laboratorio } = req.params;
        const { nuevo_id_materia, nuevo_id_laboratorio } = req.body;

        if (!nuevo_id_materia || !nuevo_id_laboratorio) {
            return res.status(400).json({ message: "Faltan datos para actualizar" });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input("id_materia", sql.Int, id_materia)
            .input("id_laboratorio", sql.Int, id_laboratorio)
            .input("nuevo_id_materia", sql.Int, nuevo_id_materia)
            .input("nuevo_id_laboratorio", sql.Int, nuevo_id_laboratorio)
            .query(`
                UPDATE MateriaLaboratorio
                SET id_materia = @nuevo_id_materia, id_laboratorio = @nuevo_id_laboratorio
                WHERE id_materia = @id_materia AND id_laboratorio = @id_laboratorio
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Relación no encontrada" });
        }

        res.json({ message: "Relación actualizada exitosamente" });
    } catch (error) {
        console.error("Error al actualizar relación:", error);
        res.status(500).json({ message: "Error al actualizar relación" });
    }
};

export const deleteMateriaLaboratorio = async (req, res) => {
    try {
        const { id_materia, id_laboratorio } = req.params;

        const pool = await getConnection();
        const result = await pool.request()
            .input("id_materia", sql.Int, id_materia)
            .input("id_laboratorio", sql.Int, id_laboratorio)
            .query(`
                DELETE FROM MateriaLaboratorio
                WHERE id_materia = @id_materia AND id_laboratorio = @id_laboratorio
            `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Relación no encontrada" });
        }

        res.json({ message: "Relación eliminada exitosamente" });
    } catch (error) {
        console.error("Error al eliminar relación:", error);
        res.status(500).json({ message: "Error al eliminar relación" });
    }
};
