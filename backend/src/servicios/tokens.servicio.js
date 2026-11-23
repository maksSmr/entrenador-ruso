import { pool } from '../config/baseDatos.js';
import { ErrorApi } from '../utilidades/errorApi.js';
import { generarToken, hashToken } from '../utilidades/tokens.js';

// El cliente es opcional para poder crear el token dentro de una transacción.
export async function crearToken(usuarioId, tipo, horas, cliente = pool) {
  const token = generarToken();
  await cliente.query(
    `INSERT INTO tokens_verificacion (usuario_id, token_hash, tipo, expira_en)
     VALUES ($1, $2, $3, NOW() + ($4::integer * INTERVAL '1 hour'))`,
    [usuarioId, hashToken(token), tipo, horas],
  );
  return token;
}

// Devuelve el dueño del token o falla con el mismo mensaje para vencido/inexistente.
export async function consumirToken(token, tipo) {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const { rows } = await cliente.query(
      `SELECT id, usuario_id FROM tokens_verificacion
        WHERE token_hash = $1 AND tipo = $2 AND usado_en IS NULL AND expira_en > NOW()
        FOR UPDATE`,
      [hashToken(token), tipo],
    );

    if (!rows.length) {
      throw new ErrorApi(400, 'El enlace no es válido o ha vencido', 'token_invalido');
    }

    await cliente.query('UPDATE tokens_verificacion SET usado_en = NOW() WHERE id = $1', [rows[0].id]);
    await cliente.query('COMMIT');
    return rows[0].usuario_id;
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

export async function invalidarTokens(usuarioId, tipo) {
  await pool.query(
    `UPDATE tokens_verificacion SET usado_en = NOW()
      WHERE usuario_id = $1 AND tipo = $2 AND usado_en IS NULL`,
    [usuarioId, tipo],
  );
}
