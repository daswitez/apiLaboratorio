import { request } from "express";
import { getConnection } from "../database/connection.js";
import sql from 'mssql';


//get general
export const getInsumos = async (req, res) => {
    const pool = await getConnection()
    const result = await pool.request().query('SELECT * FROM Insumos')
    res.json(result.recordset)
}

//get individual

export const getInsumo = async (req, res) => {
    console.log(req.params.id)

    const pool = await getConnection()
    const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query('SELECT * FROM Insumos WHERE id_insumo = @id')

    if (result.rowsAffected[0] === 0) {
        return res.status(404).json({
            message: "Insumo not found"
        });
    }
    return res.json(result.recordset[0]);
}


//post /////////////////////////////


export const createInsumo = async (req, res) => {
    console.log(req.body)

    const pool = await getConnection()
    const result = await pool.request()
        .input('nombre', sql.VarChar, req.body.nombre)
        .input('descripcion', sql.Text, req.body.descripcion)
        .input('ubicacion', sql.VarChar, req.body.ubicacion)
        .input('tipo', sql.VarChar, req.body.tipo)
        .input('unidad_medida', sql.VarChar, req.body.unidad_medida)
        .input('stock_actual', sql.Int, req.body.stock_actual)
        .input('stock_minimo', sql.Int, req.body.stock_minimo)
        .input('stock_maximo', sql.Int, req.body.stock_maximo)
        .query(
            'INSERT INTO Insumos (nombre, descripcion,ubicacion,tipo,unidad_medida, stock_actual, stock_minimo, stock_maximo) VALUES (@nombre, @descripcion,@ubicacion,@tipo, @unidad_medida, @stock_actual, @stock_minimo, @stock_maximo); SELECT SCOPE_IDENTITY() AS id;');
    console.log(result)

    res.json({
        id: result.recordset[0].id,
        nombre: req.body.nombre,
        descripcion: req.body.descripcion,
        ubicacion: req.body.ubicacion,
        tipo:req.body.tipo,
        unidad_medida: req.body.unidad_medida,
        stock_actual: req.body.stock_actual,
        stock_minimo: req.body.stock_minimo,
        stock_maximo: req.body.stock_minimo
    })

}

//////////////////////////////

export const updateInsumo = async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('nombre', sql.VarChar, req.body.nombre)
            .input('descripcion', sql.Text, req.body.descripcion)
            .input('ubicacion', sql.VarChar, req.body.ubicacion)
            .input('tipo', sql.VarChar, req.body.tipo)
            .input('unidad_medida', sql.VarChar, req.body.unidad_medida)
            .input('stock_actual', sql.Int, req.body.stock_actual)
            .input('stock_minimo', sql.Int, req.body.stock_minimo)
            .input('stock_maximo', sql.Int, req.body.stock_maximo)
            .query(`UPDATE Insumos SET 
                   nombre = @nombre, 
                   descripcion = @descripcion,
                   ubicacion = @ubicacion, 
                   tipo = @tipo, 
                   unidad_medida = @unidad_medida, 
                   stock_actual = @stock_actual,
                   stock_minimo = @stock_minimo, 
                   stock_maximo = @stock_maximo 
                   WHERE id_insumo = @id`);

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Insumo no encontrado" });
        }

        res.json({
            id: req.params.id,
            nombre: req.body.nombre,
            descripcion: req.body.descripcion,
            ubicacion: req.body.ubicacion,
            tipo: req.body.tipo,
            unidad_medida: req.body.unidad_medida,
            stock_actual: req.body.stock_actual,
            stock_minimo: req.body.stock_minimo,
            stock_maximo: req.body.stock_maximo
        });
    } catch (error) {
        console.error('Error al actualizar insumo:', error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};


////////////////////////////////


export const deleteInsumo = async (req, res) => {
    const pool = await getConnection();
    try {
        const result = await pool.request()
            .input("id", sql.Int, req.params.id)
            .query("DELETE FROM Insumos WHERE id_insumo = @id");

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ message: "Insumo no encontrado" });
        }
        return res.json({ message: "Insumo eliminado correctamente" });
    } catch (error) {
        console.error('Error al eliminar insumo:', error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};