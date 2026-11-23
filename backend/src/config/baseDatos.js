import pg from 'pg';
import { entorno } from './entorno.js';

const { Pool } = pg;

// Un pool reutiliza conexiones: una conexión nueva por petición sería muy costosa.
export const pool = new Pool({
  connectionString: entorno.databaseUrl,
  ssl: entorno.dbSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

pool.on('error', (error) => {
  console.error('Error inesperado del pool de PostgreSQL:', error.message);
});
