import { getConnection } from "../database/connection.js";
import sql from 'mssql';

export const createSemestre = async (req, res) => {
    try {
        const { numero, id_carrera } = req.body;

        if (!numero || !id_carrera) {
            return res.status(400).json({ message: "Número y ID de carrera son obligatorios" });
        }

        const pool = await getConnection();

        const carreraExists = await pool.request()
            .input('id_carrera', sql.Int, id_carrera)
            .query('SELECT 1 FROM Carreras WHERE id_carrera = @id_carrera');

        if (carreraExists.recordset.length === 0) {
            return res.status(404).json({ message: "La carrera especificada no existe" });
        }

        const result = await pool.request()
            .input('numero', sql.Int, numero)
            .input('id_carrera', sql.Int, id_carrera)
            .query(`
                INSERT INTO Semestres (numero, id_carrera)
                OUTPUT INSERTED.id_semestre
                VALUES (@numero, @id_carrera)
            `);

        res.status(201).json({
            id_semestre: result.recordset[0].id_semestre,
            message: "Semestre creado exitosamente"
        });

    } catch (error) {
        console.error('Error al crear semestre:', error);
        res.status(500).json({ message: "Error al crear semestre" });
    }
};

export const getSemestres = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT s.id_semestre, s.numero, c.nombre as carrera_nombre 
                FROM Semestres s
                INNER JOIN Carreras c ON s.id_carrera = c.id_carrera
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener semestres:', error);
        res.status(500).json({ message: "Error al obtener semestres" });
    }
};

export const getSemestreById = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT s.id_semestre, s.numero, c.id_carrera, c.nombre as carrera_nombre 
                FROM Semestres s
                INNER JOIN Carreras c ON s.id_carrera = c.id_carrera
                WHERE s.id_semestre = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Semestre no encontrado" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error al obtener semestre:', error);
        res.status(500).json({ message: "Error al obtener semestre" });
    }
};

export const updateSemestre = async (req, res) => {
    try {
        const { id } = req.params;
        const { numero, id_carrera } = req.body;

        if (!numero && !id_carrera) {
            return res.status(400).json({ message: "Se requiere número o ID de carrera para actualizar" });
        }

        const pool = await getConnection();
        const updates = [];
        const inputs = [];

        if (numero) {
            updates.push('numero = @numero');
            inputs.push({ name: 'numero', type: sql.Int, value: numero });
        }
        if (id_carrera) {
            const carreraExists = await pool.request()
                .input('id_carrera', sql.Int, id_carrera)
                .query('SELECT 1 FROM Carreras WHERE id_carrera = @id_carrera');

            if (carreraExists.recordset.length === 0) {
                return res.status(404).json({ message: "La nueva carrera no existe" });
            }

            updates.push('id_carrera = @id_carrera');
            inputs.push({ name: 'id_carrera', type: sql.Int, value: id_carrera });
        }

        const request = pool.request();
        inputs.forEach(input => request.input(input.name, input.type, input.value));
        request.input('id', sql.Int, id);

        const result = await request.query(`
            UPDATE Semestres 
            SET ${updates.join(', ')}
            WHERE id_semestre = @id
        `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Semestre no encontrado" });
        }

        res.json({ message: "Semestre actualizado exitosamente" });

    } catch (error) {
        console.error('Error al actualizar semestre:', error);
        res.status(500).json({ message: "Error al actualizar semestre" });
    }
};

export const deleteSemestre = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Semestres WHERE id_semestre = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Semestre no encontrado" });
        }

        res.json({ message: "Semestre eliminado exitosamente" });

    } catch (error) {
        if (error.number === 547) {
            return res.status(409).json({
                message: "No se puede eliminar el semestre porque tiene materias asociadas"
            });
        }
        console.error('Error al eliminar semestre:', error);
        res.status(500).json({ message: "Error al eliminar semestre" });
    }
};