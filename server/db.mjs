import mysql from "mysql2/promise";

let pool;
export function database() {
  if (pool) return pool;
  const { AIVEN_MYSQL_HOST: host, AIVEN_MYSQL_USER: user,
    AIVEN_MYSQL_PASSWORD: password, AIVEN_MYSQL_DATABASE: database,
    AIVEN_MYSQL_PORT: port, AIVEN_MYSQL_CA: ca } = process.env;
  if (!host || !user || !password || !database || !port || !ca)
    throw new Error("Banco não configurado.");
  pool = mysql.createPool({ host, port: Number(port), user, password, database,
    ssl: { ca: ca.replace(/\\n/g, "\n"), rejectUnauthorized: true },
    timezone: "Z",
    waitForConnections: true, connectionLimit: 3, queueLimit: 10,
    connectTimeout: 8000 });
  return pool;
}
