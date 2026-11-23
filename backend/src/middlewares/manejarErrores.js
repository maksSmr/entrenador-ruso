import { ErrorApi } from '../utilidades/errorApi.js';

const erroresPostgres = {
  '23505': [409, 'Ya existe un registro con esos datos', 'duplicado'],
  '23503': [400, 'El registro relacionado no existe', 'relacion_inexistente'],
  '22P02': [400, 'Formato de dato inválido', 'formato_invalido'],
};

export function noEncontrado(_req, res) {
  res.status(404).json({ error: 'Ruta no encontrada', codigo: 'ruta_no_encontrada' });
}

// Express identifica este middleware por tener 4 argumentos.
export function manejarErrores(error, _req, res, _next) {
  if (error instanceof ErrorApi) {
    const respuesta = { error: error.message };
    if (error.codigo) respuesta.codigo = error.codigo;
    if (error.detalles) respuesta.detalles = error.detalles;
    return res.status(error.status).json(respuesta);
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({ error: 'Error al subir el archivo', codigo: 'archivo_invalido' });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo no es un JSON válido', codigo: 'json_invalido' });
  }

  const traducido = erroresPostgres[error.code];
  if (traducido) {
    return res.status(traducido[0]).json({ error: traducido[1], codigo: traducido[2] });
  }

  if (['ECONNREFUSED', 'ENOTFOUND', '28P01'].includes(error.code)) {
    return res.status(503).json({ error: 'Base de datos no disponible', codigo: 'bd_no_disponible' });
  }

  console.error(error);
  return res.status(500).json({ error: 'Error interno del servidor', codigo: 'interno' });
}
