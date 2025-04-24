import { getConnection } from "../database/connection.js";
import sql from 'mssql';

export const createAlerta = async (req, res) => {
  try {
    const { id_insumo, mensaje, estado } = req.body;

    const pool = await getConnection();
    const result = await pool.request()
      .input('id_insumo', sql.Int, id_insumo)
      .input('mensaje', sql.Text, mensaje)
      .input('estado', sql.VarChar(20), estado)
      .query(`
        INSERT INTO Alertas (id_insumo, mensaje, estado)
        VALUES (@id_insumo, @mensaje, @estado);
        SELECT SCOPE_IDENTITY() AS id_alerta;
      `);

    res.status(201).json({
      id_alerta: result.recordset[0].id_alerta,
      id_insumo,
      mensaje,
      estado,
      fecha: new Date() 
    });

  } catch (error) {
    console.error("Error al crear alerta:", error);
    res.status(500).json({ message: "Error al crear alerta" });
  }
};

export const getAlertas = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT * FROM Alertas');

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener alertas:", error);
    res.status(500).json({ message: "Error al obtener alertas" });
  }
};
