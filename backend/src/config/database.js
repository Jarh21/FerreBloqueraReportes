import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pools = new Map();

// Pool global para base local (tabla empresas, tablas locales)
export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0,
});

// Pool global para consultar credenciales empresa (puedes usar el mismo pool local)
const configPool = pool;

/**
 * Obtener configuración dinámica para conexión remota por empresa
 */
export async function conexionDinamica(empresaId) {
  const [rows] = await configPool.query(
    `SELECT servidor, puerto, usuario_db, clave, basedatos FROM empresas WHERE id = ?`,
    [empresaId]
  );

  if (rows.length === 0) {
    throw new Error(`No se encontraron credenciales para la empresa ID: ${empresaId}`);
  }

  const credenciales = rows[0];

  return {
    host: credenciales.servidor,
    port: credenciales.puerto || 3306,
    user: credenciales.usuario_db,
    password: credenciales.clave,
    database: credenciales.basedatos,
  };
}

/**
 * Obtener o crear pool dinámico para empresa
 */
async function getPoolPorEmpresa(empresaId) {
  if (pools.has(empresaId)) return pools.get(empresaId);

  const dbConfig = await conexionDinamica(empresaId);

  const poolEmpresa = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
  });

  pools.set(empresaId, poolEmpresa);
  console.log(`Pool creado para empresa ID: ${empresaId}`);
  return poolEmpresa;
}

/**
 * Ejecuta consulta en base de datos remota de empresa
 */
export async function ejecutarConsultaEnEmpresaPorId(empresaId, consultaSQL, params = []) {  
  const poolEmpresa = await getPoolPorEmpresa(empresaId);
  const [results] = await poolEmpresa.query(consultaSQL, params);
  return results;
}