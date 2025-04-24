import { getConnection } from "../database/connection.js";
import sql from 'mssql';

export const createCarrera = async (req, res) => {
    try {
        const { nombre, siglas } = req.body;

        if (!nombre || !siglas) {
            return res.status(400).json({ message: "Nombre y siglas son obligatorios" });
        }

        const pool = await getConnection();
        const result = await pool.request()
            .input('nombre', sql.VarChar(100), nombre)
            .input('siglas', sql.VarChar(10), siglas)
            .query(`
                INSERT INTO Carreras (nombre, siglas)
                OUTPUT INSERTED.id_carrera
                VALUES (@nombre, @siglas)
            `);

        res.status(201).json({
            id_carrera: result.recordset[0].id_carrera,
            message: "Carrera creada exitosamente"
        });

    } catch (error) {
        console.error('Error al crear carrera:', error);
        res.status(500).json({ message: "Error al crear carrera" });
    }
};

export const getCarreras = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query('SELECT * FROM Carreras');

        res.json(result.recordset);
    } catch (error) {
        console.error('Error al obtener carreras:', error);
        res.status(500).json({ message: "Error al obtener carreras" });
    }
};

export const getCarreraById = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Carreras WHERE id_carrera = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Carrera no encontrada" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Error al obtener carrera:', error);
        res.status(500).json({ message: "Error al obtener carrera" });
    }
};

export const updateCarrera = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, siglas } = req.body;

        if (!nombre && !siglas) {
            return res.status(400).json({ message: "Se requiere nombre o siglas para actualizar" });
        }

        const pool = await getConnection();
        const updates = [];
        const inputs = [];

        if (nombre) {
            updates.push('nombre = @nombre');
            inputs.push({ name: 'nombre', type: sql.VarChar(100), value: nombre });
        }
        if (siglas) {
            updates.push('siglas = @siglas');
            inputs.push({ name: 'siglas', type: sql.VarChar(10), value: siglas });
        }

        const request = pool.request();
        inputs.forEach(input => request.input(input.name, input.type, input.value));
        request.input('id', sql.Int, id);

        const result = await request.query(`
            UPDATE Carreras 
            SET ${updates.join(', ')}
            WHERE id_carrera = @id
        `);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Carrera no encontrada" });
        }

        res.json({ message: "Carrera actualizada exitosamente" });

    } catch (error) {
        console.error('Error al actualizar carrera:', error);
        res.status(500).json({ message: "Error al actualizar carrera" });
    }
};

export const deleteCarrera = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Carreras WHERE id_carrera = @id');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Carrera no encontrada" });
        }

        res.json({ message: "Carrera eliminada exitosamente" });

    } catch (error) {
        if (error.number === 547) {
            return res.status(409).json({
                message: "No se puede eliminar la carrera porque tiene semestres asociados"
            });
        }
        console.error('Error al eliminar carrera:', error);
        res.status(500).json({ message: "Error al eliminar carrera" });
    }
};