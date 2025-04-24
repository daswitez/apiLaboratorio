import { getConnection } from "../database/connection.js";
import sql from 'mssql';

export const createMateria = async (req, res) => {
    try {
        const { nombre, id_semestre } = req.body;

        if (!nombre || !id_semestre) {
            return res.status(400).json({ message: "Nombre y ID de semestre son obligatorios" });
        }

        const pool = await getConnection();

        const semestreExists = await pool.request()
            .input('id_semestre', sql.Int, id_semestre)
            .query('SELECT 1 FROM Semestres WHERE id_semestre = @id_semestre');

        if (semestreExists.recordset.length === 0) {
            return res.status(404).json({ message: "El semestre especificado no existe" });
        }

        const result = await pool.request()
            .input('nombre', sql.VarChar(100), nombre)
            .input('id_semestre', sql.Int, id_semestre)
            .query(`
                INSERT INTO Materias (nombre, id_semestre)
                OUTPUT INSERTED.id_materia
                VALUES (@nombre, @id_semestre)
            `);

        res.status(201).json({
            id_materia: result.recordset[0].id_materia,
            message: "Materia creada exitosamente"
        });

    } catch (error) {
        console.error('Error al crear materia:', error);
        res.status(500).json({ message: "Error al crear materia" });
    }
};

export const getMaterias = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT m.id_materia, m.nombre, 
                       s.numero as semestre_numero,
                       c.nombre as carrera_nombre
                FROM Materias m
                INNER JOIN Semestres s ON m.id_semestre = s.id_semestre
                INNER JOIN Carreras c ON s.id_carrera = c.id_carrera
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener materias:', error);
        res.status(500).json({ message: "Error al obtener materias" });
    }
};

export const getMateriaById = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT m.id_materia, m.nombre, m.id_semestre,
                       s.numero as semestre_numero,
                       c.nombre as carrera_nombre
                FROM Materias m
                INNER JOIN Semestres s ON m.id_semestre = s.id_semestre
                INNER JOIN Carreras c ON s.id_carrera = c.id_carrera
                WHERE m.id_materia = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Materia no encontrada" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error al obtener materia:', error);
        res.status(500).json({ message: "Error al obtener materia" });
    }
};

export const updateMateria = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, id_semestre } = req.body;

        if (!nombre && !id_semestre) {
            return res.status(400).json({ message: "Se requiere nombre o ID de semestre para actualizar" });
        }

        const pool = await getConnection();
        const updates = [];
        const inputs = [];

        if (nombre) {
            updates.push('nombre = @nombre');
            inputs.push({ name: 'nombre', type: sql.VarChar(100), value: nombre });
        }
        if (id_semestre) {
            const semestreExists = await pool.request()
                .input('id_semestre', sql.Int, id_semestre)
                .query('SELECT 1 FROM Semestres WHERE id_semestre = @id_semestre');

            if (semestreExists.recordset.length === 0) {
                return res.status(404).json({ message: "El nuevo semestre no existe" });
            }

            updates.push('id_semestre = @id_semestre');
            inputs.push({ name: 'id_semestre', type: sql.Int, value: id_semestre });
        }

        const request = pool.request();
        inputs.forEach(input => request.input(input.name, input.type, input.value));
        request.input('id', sql.Int, id);

        const result = await request.query(`
            UPDATE Materias 
            SET ${updates.join(', ')}
            WHERE id_materia = @id
        `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Materia no encontrada" });
        }

        res.json({ message: "Materia actualizada exitosamente" });

    } catch (error) {
        console.error('Error al actualizar materia:', error);
        res.status(500).json({ message: "Error al actualizar materia" });
    }
};

export const deleteMateria = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Materias WHERE id_materia = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Materia no encontrada" });
        }

        res.json({ message: "Materia eliminada exitosamente" });

    } catch (error) {
        if (error.number === 547) { // Error de restricción de clave externa
            return res.status(409).json({
                message: "No se puede eliminar la materia porque tiene prácticas asociadas"
            });
        }
        console.error('Error al eliminar materia:', error);
        res.status(500).json({ message: "Error al eliminar materia" });
    }
};