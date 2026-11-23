/** Límites acordados con el backend (config/planes.js). */
export const PLANES = {
  gratis: {
    nombre: 'Gratis',
    limites: { cursos: 2, alumnos: 10 },
    precio: '0 € / mes',
    caracteristicas: ['Hasta 2 cursos', 'Hasta 10 alumnos en total', 'Tarjetas, quizzes y repaso espaciado', 'Herramientas de ruso'],
  },
  pro: {
    nombre: 'Pro',
    limites: { cursos: null, alumnos: 50 },
    precio: '9 € / mes',
    caracteristicas: ['Cursos ilimitados', 'Hasta 50 alumnos', 'Informes avanzados', 'Soporte prioritario'],
  },
};

export function textoLimite(valor) {
  return valor === null || valor === undefined ? 'Ilimitado' : String(valor);
}
