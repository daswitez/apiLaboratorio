// import { getConnection } from "../database/connection.js";
// import sql from 'mssql';

// export const checkStockAndCreateAlertas = async () => {
//   try {
//     const pool = await getConnection();
    
//     const result = await pool.request().query('SELECT * FROM Insumos WHERE stock_actual < stock_minimo');
    
//     if (result.recordset.length > 0) {
//       for (const insumo of result.recordset) {
//         await pool.request()
//           .input('id_insumo', sql.Int, insumo.id_insumo)
//           .input('mensaje', sql.Text, `El stock de ${insumo.nombre} está bajo. Solo queda ${insumo.stock_actual} unidades.`)
//           .input('estado', sql.VarChar(20), 'Activa')
//           .query(`
//             INSERT INTO Alertas (id_insumo, mensaje, estado)
//             VALUES (@id_insumo, @mensaje, @estado);
//           `);
//       }
//     }
//   } catch (error) {
//     console.error("Error al verificar el stock y crear alertas:", error);
//   }
// };
