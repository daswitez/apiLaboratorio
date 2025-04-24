import { getConnection } from "../database/connection.js";
import sql from "mssql";

export const getLaboratorios = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM Laboratorios");
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener laboratorios:", error);
        res.status(500).json({ message: "Error al obtener laboratorios" });
    }
};

export const getLaboratorioById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query("SELECT * FROM Laboratorios WHERE id_laboratorio = @id");

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Laboratorio no encontrado" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Error al obtener laboratorio:", error);
        res.status(500).json({ message: "Error al obtener laboratorio" });
    }
};

export const createLaboratorio = async (req, res) => {
    try {
        const { nombre, ubicacion, descripcion, id_encargado } = req.body;

        if (!nombre || id_encargado == null) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        const pool = await getConnection();
        await pool.request()
            .input("nombre", sql.VarChar(100), nombre)
            .input("ubicacion", sql.VarChar(100), ubicacion)
            .input("descripcion", sql.Text, descripcion)
            .input("id_encargado", sql.Int, id_encargado)
            .query(`
                INSERT INTO Laboratorios (nombre, ubicacion, descripcion, id_encargado)
                VALUES (@nombre, @ubicacion, @descripcion, @id_encargado)
            `);

        res.status(201).json({ message: "Laboratorio creado exitosamente" });
    } catch (error) {
        console.error("Error al crear laboratorio:", error);
        res.status(500).json({ message: "Error al crear laboratorio" });
    }
};

export const updateLaboratorio = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, ubicacion, descripcion, id_encargado } = req.body;

        const pool = await getConnection();
        await pool.request()
            .input("id", sql.Int, id)
            .input("nombre", sql.VarChar(100), nombre)
            .input("ubicacion", sql.VarChar(100), ubicacion)
            .input("descripcion", sql.Text, descripcion)
            .input("id_encargado", sql.Int, id_encargado)
            .query(`
                UPDATE Laboratorios
                SET nombre = @nombre,
                    ubicacion = @ubicacion,
                    descripcion = @descripcion,
                    id_encargado = @id_encargado
                WHERE id_laboratorio = @id
            `);

        res.json({ message: "Laboratorio actualizado correctamente" });
    } catch (error) {
        console.error("Error al actualizar laboratorio:", error);
        res.status(500).json({ message: "Error al actualizar laboratorio" });
    }
};

export const deleteLaboratorio = async (req, res) => {
    try {
        const { id } = req.params;

        const pool = await getConnection();
        await pool.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM Laboratorios WHERE id_laboratorio = @id");

        res.json({ message: "Laboratorio eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar laboratorio:", error);
        res.status(500).json({ message: "Error al eliminar laboratorio" });
    }
};
