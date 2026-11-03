import mysql from 'mysql2/promise';

/*
 * Conexión a MySQL. Acepta, en este orden:
 *  - MYSQL_URL o DATABASE_URL (Railway: MYSQL_URL=${{MySQL.MYSQL_URL}})
 *  - MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE (variables de Railway)
 *  - valores locales por defecto
 */
const url = process.env.MYSQL_URL || process.env.DATABASE_URL;
const e = process.env;

const base = url
  ? { uri: url }
  : {
      host: e.MYSQLHOST ?? '127.0.0.1',
      port: Number(e.MYSQLPORT ?? 3306),
      user: e.MYSQLUSER ?? 'root',
      password: e.MYSQLPASSWORD ?? '',
      database: e.MYSQLDATABASE ?? 'aguas_justas',
    };

/* Las bases MySQL en la nube (TiDB, Aiven, etc.) suelen pedir conexión cifrada: MYSQL_SSL=true. */
export const config = e.MYSQL_SSL === 'true' ? { ...base, ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : base;

export const pool = mysql.createPool({
  ...config,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 8,
  decimalNumbers: true,
  dateStrings: true,
});

/** Ejecuta una consulta parametrizada y devuelve las filas. */
export async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
