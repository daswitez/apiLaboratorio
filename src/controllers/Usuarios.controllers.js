import { getConnection } from '../database/connection.js';
import sql from 'mssql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
    try {
        const { correo, contraseña } = req.body;

        const pool = await getConnection();
        const result = await pool.request()
            .input('correo', sql.VarChar, correo)
            .query('SELECT * FROM Usuarios WHERE correo = @correo');

        const user = result.recordset[0];

        if (!user) {
            return res.status(401).json({ message: 'Correo no encontrado' });
        }

        const validPassword = await bcrypt.compare(contraseña, user.contraseña);
        if (!validPassword) {
            return res.status(401).json({ message: 'Contrasena incorrecta' });
        }

        const token = jwt.sign(
            { id: user.id_usuario, correo: user.correo },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            usuario: {
                id: user.id_usuario,
                correo: user.correo
            }
        });

    } catch (error) {
        console.error('Error al hacer login:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
