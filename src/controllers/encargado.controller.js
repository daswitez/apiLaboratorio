import { getConnection } from "../database/connection.js";
import sql from "mssql";
import bcrypt from "bcryptjs";



const saltRounds = 10;

export const createEncargado = async (req, res) => {
    try {
        const { nombre, apellido, correo, contrasena } = req.body;

        if (!nombre || !apellido || !correo || !contrasena) {
            return res.status(400).json({ message: "Faltan campos obligatorios" });
        }

        const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

        const pool = await getConnection();
        const result = await pool.request()
            .input("nombre", sql.VarChar(100), nombre)
            .input("apellido", sql.VarChar(100), apellido)
            .input("correo", sql.VarChar(100), correo)
            .input("contrasena", sql.VarChar(100), hashedPassword)
            .query(`
                INSERT INTO EncargadoLaboratorio (nombre, apellido, correo, contrasena)
                OUTPUT INSERTED.id_encargado
                VALUES (@nombre, @apellido, @correo, @contrasena)
            `);

        res.status(201).json({
            id_encargado: result.recordset[0].id_encargado,
            message: "Encargado creado exitosamente"
        });

    } catch (error) {
        if (error.number === 2627) {
            return res.status(409).json({ message: "El correo ya está registrado" });
        }
        console.error("Error al crear encargado:", error);
        res.status(500).json({ message: "Error al crear encargado" });
    }
};

export const getEncargados = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query("SELECT id_encargado, nombre, apellido, correo FROM EncargadoLaboratorio");
        res.json(result.recordset);
    } catch (error) {
        console.error("Error al obtener encargados:", error);
        res.status(500).json({ message: "Error al obtener encargados" });
    }
};

export const getEncargadoById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query(`
                SELECT id_encargado, nombre, apellido, correo 
                FROM EncargadoLaboratorio 
                WHERE id_encargado = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: "Encargado no encontrado" });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error("Error al obtener encargado:", error);
        res.status(500).json({ message: "Error al obtener encargado" });
    }
};

export const updateEncargado = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, correo, contrasena } = req.body;

        const pool = await getConnection();
        let hashedPassword;
        let updateFields = [];
        let inputs = [];

        if (nombre) {
            updateFields.push("nombre = @nombre");
            inputs.push({ name: "nombre", type: sql.VarChar(100), value: nombre });
        }
        if (apellido) {
            updateFields.push("apellido = @apellido");
            inputs.push({ name: "apellido", type: sql.VarChar(100), value: apellido });
        }
        if (correo) {
            updateFields.push("correo = @correo");
            inputs.push({ name: "correo", type: sql.VarChar(100), value: correo });
        }
        if (contrasena) {
            hashedPassword = await bcrypt.hash(contrasena, saltRounds);
            updateFields.push("contrasena = @contrasena");
            inputs.push({ name: "contrasena", type: sql.VarChar(100), value: hashedPassword });
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: "No se proporcionaron datos para actualizar" });
        }

        const request = pool.request();
        inputs.forEach(input => request.input(input.name, input.type, input.value));
        request.input("id", sql.Int, id);

        const query = `
            UPDATE EncargadoLaboratorio 
            SET ${updateFields.join(", ")}
            WHERE id_encargado = @id
        `;

        const result = await request.query(query);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Encargado no encontrado" });
        }

        res.json({ message: "Encargado actualizado exitosamente" });

    } catch (error) {
        console.error("Error al actualizar encargado:", error);
        res.status(500).json({ message: "Error al actualizar encargado" });
    }
};

export const deleteEncargado = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();
        const result = await pool.request()
            .input("id", sql.Int, id)
            .query("DELETE FROM EncargadoLaboratorio WHERE id_encargado = @id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Encargado no encontrado" });
        }

        res.json({ message: "Encargado eliminado exitosamente" });
    } catch (error) {
        console.error("Error al eliminar encargado:", error);
        res.status(500).json({ message: "Error al eliminar encargado" });
    }
};


