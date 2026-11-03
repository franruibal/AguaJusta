import mysql from 'mysql2/promise';

/*
 * Conexión a MySQL. Acepta, en este orden:
 *  - MYSQL_URL o DATABASE_URL  (mysql://usuario:clave@host:puerto/base)
 *  - MYSQLHOST, MYSQLPORT, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE
 *  - valores locales por defecto
 *
 * La conexión va cifrada (TLS) salvo que la base esté en la misma máquina.
 * TiDB Cloud y casi todas las bases en la nube lo exigen. MYSQL_SSL=false lo apaga.
 */
const e = process.env;
const url = e.MYSQL_URL || e.DATABASE_URL;

function leerUrl(u) {
  const p = new URL(u);
  return {
    host: p.hostname,
    port: Number(p.port || 3306),
    user: decodeURIComponent(p.username),
    password: decodeURIComponent(p.password),
    database: decodeURIComponent(p.pathname.replace(/^\//, '')) || undefined,
  };
}

let base, origen, errorConfig = null;
try {
  if (url) { base = leerUrl(url); origen = e.MYSQL_URL ? 'MYSQL_URL' : 'DATABASE_URL'; }
  else if (e.MYSQLHOST) {
    base = { host: e.MYSQLHOST, port: Number(e.MYSQLPORT ?? 3306), user: e.MYSQLUSER, password: e.MYSQLPASSWORD, database: e.MYSQLDATABASE };
    origen = 'MYSQLHOST';
  } else {
    base = { host: '127.0.0.1', port: 3306, user: 'root', password: '', database: 'aguas_justas' };
    origen = 'valores por defecto (no hay MYSQL_URL)';
  }
} catch (err) {
  errorConfig = `MYSQL_URL no es una dirección válida (${err.message}). Si la contraseña tiene caracteres como @ # / ?, regenerala sin ellos o codificala.`;
  base = { host: '127.0.0.1', port: 3306 };
  origen = 'MYSQL_URL inválida';
}

const local = ['localhost', '127.0.0.1', '::1'].includes(base.host);
const ssl = e.MYSQL_SSL ? e.MYSQL_SSL === 'true' : !local;

export const config = ssl ? { ...base, ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : base;

/** Describe la conexión sin la contraseña, para diagnosticar. */
export const describir = () => ({
  origen, host: base.host, puerto: base.port, usuario: base.user ?? null, base: base.database ?? null,
  cifrada: ssl, ...(errorConfig ? { error_config: errorConfig } : {}),
});

export const pool = mysql.createPool({
  ...config,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 5,
  connectTimeout: 10000,
  decimalNumbers: true,
  dateStrings: true,
});

/** Ejecuta una consulta parametrizada y devuelve las filas. */
export async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
