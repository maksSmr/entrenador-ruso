// null = ilimitado. Un solo lugar para cambiar los límites del negocio.
export const PLANES = {
  gratis: {
    nombre: 'Gratis',
    cursos: 2,
    alumnos: 10,
  },
  pro: {
    nombre: 'Pro',
    cursos: null,
    alumnos: 50,
  },
};

export const planPorDefecto = 'gratis';

export function obtenerPlan(nombre) {
  return PLANES[nombre] ?? PLANES[planPorDefecto];
}
