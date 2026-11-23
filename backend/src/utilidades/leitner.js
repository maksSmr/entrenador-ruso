import { ZONA_HORARIA } from './constantes.js';

export const INTERVALOS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 15 };
export const CAJA_MAXIMA = 5;

// "Hoy" debe ser hoy en Mexico City, aunque el servidor esté en otra zona.
export function fechaHoyZona(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(fecha);

  const valor = (tipo) => partes.find((parte) => parte.type === tipo)?.value;
  return `${valor('year')}-${valor('month')}-${valor('day')}`;
}

function sumarDias(iso, dias) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

// Función pura: aciertas => subes una caja; fallas => vuelves a la 1.
export function siguienteRevision(cajaActual, acerto, fecha = new Date()) {
  const caja = acerto
    ? Math.min(CAJA_MAXIMA, cajaActual + 1)
    : 1;

  return {
    caja,
    proxima_revision: sumarDias(fechaHoyZona(fecha), INTERVALOS[caja]),
  };
}
