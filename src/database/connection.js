import sql from 'mssql';
import sqlv8 from 'msnodesqlv8';

// Definimos los parámetros de la base de datos
const dbSettings = {
    server: '127.0.0.1',  // Nombre del servidor
    database: 'Inventario',  // Nombre de la base de datos
    user: 'sa',  // El nombre de usuario que creaste
    password: 'nuevaContraseñaFuerte',  // La contraseña que asignaste
    driver: 'msnodesqlv8',  // El driver de conexión
    options: {
        trustServerCertificate: true  // Si es necesario
    }
};


// Función para obtener la conexión a la base de datos
export const getConnection = async () => {
    try {
        // Intentamos conectarnos a la base de datos
        const pool = await sql.connect(dbSettings);
        console.log("✅ Conectado a SQL Server");
        return pool;
    } catch (error) {
        // Si ocurre un error de conexión, lo mostramos
        console.error("❌ Error connecting to SQL Server:", error);
        return null;
    }
};