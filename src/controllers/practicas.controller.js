import { getConnection } from "../database/connection.js";
import sql from "mssql";

export const getPracticas = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM Practicas");
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener prácticas:", error);
        res.status(500).json({ message: "Error al obtener prácticas" });
    }
};

export const getPracticaById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query("SELECT * FROM Practicas WHERE id_practica = @id");

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Práctica no encontrada" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Error al obtener práctica:", error);
        res.status(500).json({ message: "Error al obtener práctica" });
    }
};

export const createPractica = async (req, res) => {
    try {
        const { titulo, numero_practica, descripcion, id_laboratorio, id_materia } = req.body;

        if (!titulo || numero_practica == null || !id_laboratorio || !id_materia) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        const pool = await getConnection();
        await pool.request()
            .input("titulo", sql.VarChar(150), titulo)
            .input("numero_practica", sql.Int, numero_practica)
            .input("descripcion", sql.Text, descripcion)
            .input("id_laboratorio", sql.Int, id_laboratorio)
            .input("id_materia", sql.Int, id_materia)
            .query(`
                INSERT INTO Practicas (titulo, numero_practica, descripcion, id_laboratorio, id_materia)
                VALUES (@titulo, @numero_practica, @descripcion, @id_laboratorio, @id_materia)
            `);

        res.status(201).json({ message: "Práctica creada exitosamente" });
    } catch (error) {
        console.error("Error al crear práctica:", error);
        res.status(500).json({ message: "Error al crear práctica" });
    }
};

export const updatePractica = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, numero_practica, descripcion, id_laboratorio, id_materia } = req.body;

        const pool = await getConnection();
        await pool.request()
            .input("id", sql.Int, id)
            .input("titulo", sql.VarChar(150), titulo)
            .input("numero_practica", sql.Int, numero_practica)
            .input("descripcion", sql.Text, descripcion)
            .input("id_laboratorio", sql.Int, id_laboratorio)
            .input("id_materia", sql.Int, id_materia)
            .query(`
                UPDATE Practicas
                SET titulo = @titulo,
                    numero_practica = @numero_practica,
                    descripcion = @descripcion,
                    id_laboratorio = @id_laboratorio,
                    id_materia = @id_materia
                WHERE id_practica = @id
            `);

        res.json({ message: "Práctica actualizada correctamente" });
    } catch (error) {
        console.error("Error al actualizar práctica:", error);
        res.status(500).json({ message: "Error al actualizar práctica" });
    }
};

export const deletePractica = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        await pool.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM Practicas WHERE id_practica = @id");

        res.json({ message: "Práctica eliminada correctamente" });
    } catch (error) {
        console.error("Error al eliminar práctica:", error);
        res.status(500).json({ message: "Error al eliminar práctica" });
    }
};
