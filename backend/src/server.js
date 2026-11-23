import app from './app.js';
import { entorno } from './config/entorno.js';
import { pool } from './config/baseDatos.js';

const servidor = app.listen(entorno.puerto, () => {
  console.log(`API lista en http://localhost:${entorno.puerto}/salud`);
});

async function cerrar() {
  servidor.close();
  await pool.end();
  process.exit(0);
}

process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
