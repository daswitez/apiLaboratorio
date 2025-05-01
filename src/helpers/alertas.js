import { getConnection } from "../database/connection.js";
import sql from 'mssql';

export const gestionarAlertasInsumo = async (id_insumo) => {
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const insumo = await new sql.Request(transaction)
            .input('id_insumo', sql.Int, id_insumo)
            .query(`
                SELECT stock_actual, stock_minimo, stock_maximo
                FROM Insumos
                WHERE id_insumo = @id_insumo
            `);

        if (insumo.recordset.length === 0) return;

        const { stock_actual, stock_minimo, stock_maximo } = insumo.recordset[0];

        if (stock_actual < stock_minimo) {
            await new sql.Request(transaction)
                .input('id_insumo', sql.Int, id_insumo)
                .input('mensaje', sql.VarChar(sql.MAX), `Stock bajo (${stock_actual} < ${stock_minimo})`) // Cambio aquí
                .input('tipo', sql.VarChar(20), 'STOCK_BAJO')
                .query(`
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM Alertas 
                        WHERE id_insumo = @id_insumo 
                        AND CONVERT(VARCHAR(MAX), mensaje) = @mensaje 
                        AND estado = 'Activa'
                    )
                    BEGIN
                        INSERT INTO Alertas 
                        (id_insumo, mensaje, tipo, estado)
                        VALUES (@id_insumo, @mensaje, @tipo, 'Activa')
                    END
                `);
        }
        else if (stock_actual > stock_maximo) {
            await new sql.Request(transaction)
                .input('id_insumo', sql.Int, id_insumo)
                .input('mensaje', sql.VarChar(sql.MAX), `Stock excedido (${stock_actual} > ${stock_maximo})`) // Cambio aquí
                .input('tipo', sql.VarChar(20), 'STOCK_EXCEDIDO')
                .query(`
                    IF NOT EXISTS (
                        SELECT 1 
                        FROM Alertas 
                        WHERE id_insumo = @id_insumo 
                        AND CONVERT(VARCHAR(MAX), mensaje) = @mensaje 
                        AND estado = 'Activa'
                    )
                    BEGIN
                        INSERT INTO Alertas 
                        (id_insumo, mensaje, tipo, estado)
                        VALUES (@id_insumo, @mensaje, @tipo, 'Activa')
                    END
                `);
        }
        else {
            await new sql.Request(transaction)
                .input('id_insumo', sql.Int, id_insumo)
                .query(`
                    UPDATE Alertas
                    SET estado = 'Resuelta',
                        fecha_resolucion = GETDATE()
                    WHERE id_insumo = @id_insumo
                      AND estado = 'Activa'
                `);
        }

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        console.error('Error gestionando alertas:', error);
    }
};