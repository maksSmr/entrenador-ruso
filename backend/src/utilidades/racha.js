import { fechaHoyZona } from './leitner.js';

const UN_DIA = 24 * 60 * 60 * 1000;

function aISO(fecha) {
  return fecha instanceof Date ? fecha.toISOString() : fecha;
}

// Devuelve la racha y la fecha de actividad; no consulta nada.
export function actualizarRacha(ultimaActividad, rachaActual = 0, fecha = new Date()) {
  const hoy = fechaHoyZona(fecha);
  if (!ultimaActividad) return { racha: 1, ultima_actividad: fecha };

  const ultimo = aISO(ultimaActividad);
  if (fechaHoyZona(new Date(ultimo)) === hoy) {
    return { racha: rachaActual, ultima_actividad: ultimo };
  }

  const ayer = fechaHoyZona(new Date(fecha.getTime() - UN_DIA));
  const racha = fechaHoyZona(new Date(ultimo)) === ayer ? rachaActual + 1 : 1;
  return { racha, ultima_actividad: fecha };
}

export function nivelPorXp(xp) {
  return Math.floor(Math.max(0, xp) / 100) + 1;
}
