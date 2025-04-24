import { getConnection } from "../database/connection.js";
import sql from 'mssql';

export const createSolicitudUso = async (req, res) => {
    let transaction;
    let transactionStarted = false;

    try {
        const {
            id_docente,
            id_practica,
            id_laboratorio,
            fecha_hora_inicio,
            fecha_hora_fin,
            numero_estudiantes,
            tamano_grupo = 3,
            observaciones,
            insumos
        } = req.body;

        const requiredFields = [
            'id_docente', 'id_laboratorio',
            'fecha_hora_inicio', 'fecha_hora_fin',
            'numero_estudiantes'
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                message: `Campos obligatorios faltantes: ${missingFields.join(', ')}`
            });
        }

        if (numero_estudiantes <= 0 || tamano_grupo <= 0) {
            return res.status(400).json({
                message: "Número de estudiantes y tamaño de grupo deben ser mayores a 0"
            });
        }

        const pool = await getConnection();
        transaction = new sql.Transaction(pool);

        await transaction.begin();
        transactionStarted = true;

        const docenteExists = await new sql.Request(transaction)
            .input('id_docente', sql.Int, id_docente)
            .query('SELECT 1 FROM Docentes WHERE id_docente = @id_docente');

        if (docenteExists.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: "Docente no encontrado" });
        }

        const numero_grupos = Math.ceil(numero_estudiantes / tamano_grupo);
        if (numero_grupos > 50) {
            await transaction.rollback();
            return res.status(400).json({ message: "Número de grupos excede el límite permitido" });
        }

        const solicitudResult = await new sql.Request(transaction)
            .input('id_docente', sql.Int, id_docente)
            .input('id_practica', sql.Int, id_practica)
            .input('id_laboratorio', sql.Int, id_laboratorio)
            .input('fecha_hora_inicio', sql.DateTime, fecha_hora_inicio)
            .input('fecha_hora_fin', sql.DateTime, fecha_hora_fin) // Nombre corregido
            .input('numero_estudiantes', sql.Int, numero_estudiantes)
            .input('tamano_grupo', sql.Int, tamano_grupo)
            .input('numero_grupos', sql.Int, numero_grupos)
            .input('observaciones', sql.Text, observaciones)
            .query(`
                INSERT INTO SolicitudesUso (
                    id_docente, id_practica, id_laboratorio,
                    fecha_hora_inicio, fecha_hora_fin, numero_estudiantes,
                    tamano_grupo, numero_grupos, observaciones
                )
                    OUTPUT INSERTED.id_solicitud
                VALUES (
                    @id_docente, @id_practica, @id_laboratorio,
                    @fecha_hora_inicio, @fecha_hora_fin, @numero_estudiantes,
                    @tamano_grupo, @numero_grupos, @observaciones
                    )
            `);

        const id_solicitud = solicitudResult.recordset[0].id_solicitud;

        if (!Array.isArray(insumos) || insumos.length === 0) {
            await transaction.rollback();
            return res.status(400).json({ message: "Debe especificar al menos un insumo" });
        }

        for (const insumo of insumos) {
            if (!insumo.id_insumo || !insumo.cantidad_por_grupo) {
                await transaction.rollback();
                return res.status(400).json({ message: "Formato de insumo inválido" });
            }

            const cantidad_total = insumo.cantidad_por_grupo * numero_grupos;

            const insumoExists = await new sql.Request(transaction)
                .input('id_insumo', sql.Int, insumo.id_insumo)
                .query('SELECT 1 FROM Insumos WHERE id_insumo = @id_insumo');

            if (insumoExists.recordset.length === 0) {
                await transaction.rollback();
                return res.status(404).json({ message: `Insumo ${insumo.id_insumo} no encontrado` });
            }

            await new sql.Request(transaction)
                .input('id_solicitud', sql.Int, id_solicitud)
                .input('id_insumo', sql.Int, insumo.id_insumo)
                .input('cantidad_por_grupo', sql.Int, insumo.cantidad_por_grupo)
                .input('cantidad_total', sql.Int, cantidad_total)
                .query(`
                    INSERT INTO DetalleSolicitudUso
                        (id_solicitud, id_insumo, cantidad_por_grupo, cantidad_total)
                    VALUES (@id_solicitud, @id_insumo, @cantidad_por_grupo, @cantidad_total)
                `);

            const stockResult = await new sql.Request(transaction)
                .input('id_insumo', sql.Int, insumo.id_insumo)
                .query('SELECT stock_actual FROM Insumos WHERE id_insumo = @id_insumo');

            const stockActual = stockResult.recordset[0]?.stock_actual ?? 0;

            if (stockActual < cantidad_total) {
                await transaction.rollback();
                return res.status(400).json({
                    message: `Stock insuficiente para el insumo ${insumo.id_insumo}. Disponible: ${stockActual}, Requerido: ${cantidad_total}`
                });
            }

            await new sql.Request(transaction)
                .input('id_insumo', sql.Int, insumo.id_insumo)
                .input('cantidad_total', sql.Int, cantidad_total)
                .query(`
                    UPDATE Insumos
                    SET stock_actual = stock_actual - @cantidad_total
                    WHERE id_insumo = @id_insumo
                `);
        }

        await transaction.commit();

        res.status(201).json({
            id_solicitud,
            message: "Solicitud creada exitosamente"
        });

    } catch (error) {
        if (transactionStarted && transaction) await transaction.rollback();

        console.error('Error al crear solicitud:', error);

        const errorMessage = error.number === 2627
            ? "El nombre de la solicitud ya existe"
            : "Error al crear solicitud";

        res.status(500).json({
            message: errorMessage,
            details: error.message
        });
    }
};



export const getSolicitudesUso = async (req, res) => {
    try {
        const { estado } = req.query;
        const pool = await getConnection();

        let query = `
            SELECT s.*, d.nombre + ' ' + d.apellido as docente_nombre,
                   p.titulo as practica_titulo, l.nombre as laboratorio_nombre
            FROM SolicitudesUso s
            LEFT JOIN Docentes d ON s.id_docente = d.id_docente
            LEFT JOIN Practicas p ON s.id_practica = p.id_practica
            LEFT JOIN Laboratorios l ON s.id_laboratorio = l.id_laboratorio
        `;

        const request = pool.request();
        if (estado) {
            query += " WHERE s.estado = @estado";
            request.input('estado', sql.VarChar(20), estado);
        }

        const result = await request.query(query);
        res.json(result.recordset);

    } catch (error) {
        console.error('Error al obtener solicitudes:', error);
        res.status(500).json({ message: "Error al obtener solicitudes" });
    }
};

export const getSolicitudUsoById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getConnection();

        const solicitud = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT s.*, d.nombre + ' ' + d.apellido as docente_nombre,
                       p.titulo as practica_titulo, l.nombre as laboratorio_nombre
                FROM SolicitudesUso s
                LEFT JOIN Docentes d ON s.id_docente = d.id_docente
                LEFT JOIN Practicas p ON s.id_practica = p.id_practica
                LEFT JOIN Laboratorios l ON s.id_laboratorio = l.id_laboratorio
                WHERE s.id_solicitud = @id
            `);

        if (solicitud.recordset.length === 0) {
            return res.status(404).json({ message: "Solicitud no encontrada" });
        }

        const detalles = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT d.*, i.nombre as insumo_nombre, i.unidad_medida
                FROM DetalleSolicitudUso d
                JOIN Insumos i ON d.id_insumo = i.id_insumo
                WHERE d.id_solicitud = @id
            `);

        res.json({
            ...solicitud.recordset[0],
            insumos: detalles.recordset
        });

    } catch (error) {
        console.error('Error al obtener solicitud:', error);
        res.status(500).json({ message: "Error al obtener solicitud" });
    }
};

export const updateEstadoSolicitud = async (req, res) => {
    const transaction = new sql.Transaction();
    try {
        const { id } = req.params;
        const { estado } = req.body;
        const pool = await getConnection();

        if (!estado) {
            return res.status(400).json({ message: "Estado es requerido" });
        }

        await transaction.begin(pool);

        const solicitud = await new sql.Request(transaction)
            .input('id', sql.Int, id)
            .query(`
                SELECT estado, id_solicitud 
                FROM SolicitudesUso 
                WHERE id_solicitud = @id
            `);

        if (solicitud.recordset.length === 0) {
            await transaction.rollback();
            return res.status(404).json({ message: "Solicitud no encontrada" });
        }

        if (estado === 'Aprobada') {
            const detalles = await new sql.Request(transaction)
                .input('id', sql.Int, id)
                .query(`
                    SELECT d.id_insumo, d.cantidad_total, i.stock_actual
                    FROM DetalleSolicitudUso d
                    JOIN Insumos i ON d.id_insumo = i.id_insumo
                    WHERE d.id_solicitud = @id
                `);

            for (const detalle of detalles.recordset) {
                if (detalle.stock_actual < detalle.cantidad_total) {
                    await transaction.rollback();
                    return res.status(400).json({
                        message: `Stock insuficiente para ${detalle.id_insumo}`,
                        id_insumo: detalle.id_insumo,
                        stock_disponible: detalle.stock_actual,
                        requerido: detalle.cantidad_total
                    });
                }
            }

            for (const detalle of detalles.recordset) {
                await new sql.Request(transaction)
                    .input('id_insumo', sql.Int, detalle.id_insumo)
                    .input('cantidad', sql.Int, detalle.cantidad_total)
                    .query(`
                        UPDATE Insumos 
                        SET stock_actual = stock_actual - @cantidad 
                        WHERE id_insumo = @id_insumo
                    `);

                await new sql.Request(transaction)
                    .input('id_insumo', sql.Int, detalle.id_insumo)
                    .input('cantidad', sql.Int, detalle.cantidad_total)
                    .input('id_solicitud', sql.Int, id)
                    .input('responsable', sql.VarChar(100), 'Sistema')
                    .query(`
                        INSERT INTO MovimientosInventario 
                        (id_insumo, tipo_movimiento, cantidad, responsable, id_solicitud)
                        VALUES (@id_insumo, 'PRESTAMO', @cantidad, @responsable, @id_solicitud)
                    `);
            }
        }

        await new sql.Request(transaction)
            .input('id', sql.Int, id)
            .input('estado', sql.VarChar(20), estado)
            .query(`
                UPDATE SolicitudesUso 
                SET estado = @estado 
                WHERE id_solicitud = @id
            `);

        await transaction.commit();
        res.json({ message: "Estado actualizado exitosamente" });

    } catch (error) {
        await transaction.rollback();
        console.error('Error al actualizar estado:', error);
        res.status(500).json({ message: "Error al actualizar estado" });
    }
};

export const devolverSolicitud = async (req, res) => {
    const transaction = new sql.Transaction();
    try {
        const { id } = req.params;
        const pool = await getConnection();

        await transaction.begin(pool);

        const solicitud = await new sql.Request(transaction)
            .input('id', sql.Int, id)
            .query(`
                SELECT estado 
                FROM SolicitudesUso 
                WHERE id_solicitud = @id
            `);

        if (solicitud.recordset[0].estado !== 'Aprobada') {
            await transaction.rollback();
            return res.status(400).json({ message: "La solicitud debe estar en estado Aprobada" });
        }

        const detalles = await new sql.Request(transaction)
            .input('id', sql.Int, id)
            .query(`
                SELECT id_insumo, cantidad_total 
                FROM DetalleSolicitudUso 
                WHERE id_solicitud = @id
            `);

        for (const detalle of detalles.recordset) {
            await new sql.Request(transaction)
                .input('id_insumo', sql.Int, detalle.id_insumo)
                .input('cantidad', sql.Int, detalle.cantidad_total)
                .query(`
                    UPDATE Insumos 
                    SET stock_actual = stock_actual + @cantidad 
                    WHERE id_insumo = @id_insumo
                `);

            await new sql.Request(transaction)
                .input('id_solicitud', sql.Int, id)
                .input('id_insumo', sql.Int, detalle.id_insumo)
                .query(`
                    UPDATE MovimientosInventario 
                    SET fecha_devuelto = GETDATE()
                    WHERE id_solicitud = @id_solicitud 
                    AND id_insumo = @id_insumo 
                    AND fecha_devuelto IS NULL
                `);
        }

        await new sql.Request(transaction)
            .input('id', sql.Int, id)
            .query(`
                UPDATE SolicitudesUso 
                SET estado = 'Completada' 
                WHERE id_solicitud = @id
            `);

        await transaction.commit();
        res.json({ message: "Devolución registrada exitosamente" });

    } catch (error) {
        await transaction.rollback();
        console.error('Error al registrar devolución:', error);
        res.status(500).json({ message: "Error al registrar devolución" });
    }
};