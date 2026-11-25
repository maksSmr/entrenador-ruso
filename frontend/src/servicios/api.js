const URL_BASE = process.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Petición genérica a la API. Lanza un Error con mensaje, codigo, detalles y status.
 */
export async function peticion(ruta, { metodo = 'GET', cuerpo, token, archivo } = {}) {
  const cabeceras = {};

  if (token) {
    cabeceras.Authorization = `Bearer ${token}`;
  }

  let cuerpoFinal;
  if (archivo instanceof FormData) {
    cuerpoFinal = archivo;
  } else if (cuerpo !== undefined && cuerpo !== null) {
    cabeceras['Content-Type'] = 'application/json';
    cuerpoFinal = JSON.stringify(cuerpo);
  }

  let respuesta;
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpoFinal,
    });
  } catch (errorRed) {
    const error = new Error('No se pudo conectar con el servidor. Inténtalo de nuevo.');
    error.codigo = 'error_red';
    error.status = 0;
    throw error;
  }

  const texto = await respuesta.text();
  let datos = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = texto;
    }
  }

  if (!respuesta.ok) {
    const error = new Error(
      (datos && typeof datos === 'object' && datos.error) || `Error ${respuesta.status}`,
    );
    error.codigo = datos && typeof datos === 'object' ? datos.codigo : undefined;
    error.detalles = datos && typeof datos === 'object' ? datos.detalles : undefined;
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

/* ------------------------------- AUTH ---------------------------------- */

export function registrarMaestro(datos) {
  return peticion('/auth/registro-maestro', { metodo: 'POST', cuerpo: datos });
}

export function registrarAlumno(datos) {
  return peticion('/auth/registro-alumno', { metodo: 'POST', cuerpo: datos });
}

export function login(datos) {
  return peticion('/auth/login', { metodo: 'POST', cuerpo: datos });
}

export function verificarCorreo(tokenVerificacion) {
  return peticion('/auth/verificar-correo', {
    metodo: 'POST',
    cuerpo: { token: tokenVerificacion },
  });
}

export function reenviarVerificacion(email) {
  return peticion('/auth/reenviar-verificacion', { metodo: 'POST', cuerpo: { email } });
}

export function olvideContrasena(email) {
  return peticion('/auth/olvide-contrasena', { metodo: 'POST', cuerpo: { email } });
}

export function restablecerContrasena(tokenRestablecimiento, contrasena) {
  return peticion('/auth/restablecer-contrasena', {
    metodo: 'POST',
    cuerpo: { token: tokenRestablecimiento, contrasena },
  });
}

export function yo(token) {
  return peticion('/auth/yo', { token });
}

/* ------------------------------ CURSOS ---------------------------------- */

export function listarCursos(token) {
  return peticion('/cursos', { token });
}

export function crearCurso(datos, token) {
  return peticion('/cursos', { metodo: 'POST', cuerpo: datos, token });
}

export function obtenerCurso(id, token) {
  return peticion(`/cursos/${id}`, { token });
}

export function actualizarCurso(id, datos, token) {
  return peticion(`/cursos/${id}`, { metodo: 'PUT', cuerpo: datos, token });
}

export function eliminarCurso(id, token) {
  return peticion(`/cursos/${id}`, { metodo: 'DELETE', token });
}

export function regenerarCodigo(id, token) {
  return peticion(`/cursos/${id}/regenerar-codigo`, { metodo: 'POST', token });
}

export function listarAlumnos(cursoId, token) {
  return peticion(`/cursos/${cursoId}/alumnos`, { token });
}

export function inscribirse(datos, token) {
  return peticion('/inscripciones', { metodo: 'POST', cuerpo: datos, token });
}

export function listarMisCursos(token) {
  return peticion('/mis-cursos', { token });
}

/* ----------------------------- LECCIONES -------------------------------- */

export function listarLecciones(cursoId, token) {
  return peticion(`/cursos/${cursoId}/lecciones`, { token });
}

export function crearLeccion(cursoId, datos, token) {
  return peticion(`/cursos/${cursoId}/lecciones`, { metodo: 'POST', cuerpo: datos, token });
}

export function actualizarLeccion(id, datos, token) {
  return peticion(`/lecciones/${id}`, { metodo: 'PUT', cuerpo: datos, token });
}

export function eliminarLeccion(id, token) {
  return peticion(`/lecciones/${id}`, { metodo: 'DELETE', token });
}

/* ------------------------------ TARJETAS -------------------------------- */

export function listarTarjetas(leccionId, token) {
  return peticion(`/lecciones/${leccionId}/tarjetas`, { token });
}

export function crearTarjeta(leccionId, datos, token) {
  return peticion(`/lecciones/${leccionId}/tarjetas`, { metodo: 'POST', cuerpo: datos, token });
}

export function actualizarTarjeta(id, datos, token) {
  return peticion(`/tarjetas/${id}`, { metodo: 'PUT', cuerpo: datos, token });
}

export function eliminarTarjeta(id, token) {
  return peticion(`/tarjetas/${id}`, { metodo: 'DELETE', token });
}

export function importarCsv(leccionId, archivo, token) {
  const datos = new FormData();
  datos.append('archivo', archivo);
  return peticion(`/lecciones/${leccionId}/importar-csv`, {
    metodo: 'POST',
    archivo: datos,
    token,
  });
}

/** Pide a Gemini sugerencias a partir de un PDF/DOCX. Devuelve tarjetas sin guardar. */
export function generarTarjetasIA(leccionId, archivo, token) {
  const datos = new FormData();
  datos.append('archivo', archivo);
  return peticion(`/lecciones/${leccionId}/generar-tarjetas`, {
    metodo: 'POST',
    archivo: datos,
    token,
  });
}

/* ------------------------------- QUIZ ----------------------------------- */

export function obtenerQuiz(leccionId, cantidad = 4, token) {
  return peticion(`/lecciones/${leccionId}/quiz?cantidad=${cantidad}`, { token });
}

export function enviarResultadoQuiz(datos, token) {
  return peticion('/quiz/resultado', { metodo: 'POST', cuerpo: datos, token });
}

/* ------------------------------- REPASO --------------------------------- */

export function listarRepaso(cursoId, token) {
  return peticion(`/cursos/${cursoId}/repaso/hoy`, { token });
}

export function responderRepaso(datos, token) {
  return peticion('/repaso/respuesta', { metodo: 'POST', cuerpo: datos, token });
}

export function reiniciarRepaso(cursoId, token) {
  return peticion(`/cursos/${cursoId}/repaso/reiniciar`, { metodo: 'POST', token });
}

/* -------------------------- PANELES Y PLAN ------------------------------ */

export function panelAlumno(token) {
  return peticion('/panel/alumno', { token });
}

export function panelMaestro(token) {
  return peticion('/panel/maestro', { token });
}

export function reporteMaestro(token) {
  return peticion('/panel/maestro/reporte', { token });
}

export function miPlan(token) {
  return peticion('/mi-plan', { token });
}

export function checkout(token) {
  return peticion('/suscripcion/checkout', { metodo: 'POST', token });
}

export function portal(token) {
  return peticion('/suscripcion/portal', { metodo: 'POST', token });
}

export default {
  peticion,
  registrarMaestro,
  registrarAlumno,
  login,
  verificarCorreo,
  reenviarVerificacion,
  olvideContrasena,
  restablecerContrasena,
  yo,
  listarCursos,
  crearCurso,
  obtenerCurso,
  actualizarCurso,
  eliminarCurso,
  regenerarCodigo,
  listarAlumnos,
  inscribirse,
  listarMisCursos,
  listarLecciones,
  crearLeccion,
  actualizarLeccion,
  eliminarLeccion,
  listarTarjetas,
  crearTarjeta,
  actualizarTarjeta,
  eliminarTarjeta,
  importarCsv,
  generarTarjetasIA,
  obtenerQuiz,
  enviarResultadoQuiz,
  listarRepaso,
  responderRepaso,
  reiniciarRepaso,
  panelAlumno,
  panelMaestro,
  reporteMaestro,
  miPlan,
  checkout,
  portal,
};
