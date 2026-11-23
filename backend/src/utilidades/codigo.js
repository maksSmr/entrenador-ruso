import { randomInt } from 'node:crypto';

// Sin 0/O ni 1/I para que el código sea fácil de copiar y dictar en clase.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generarCodigoInvitacion(longitud = 7) {
  let codigo = '';
  for (let i = 0; i < longitud; i += 1) {
    codigo += ALFABETO[randomInt(ALFABETO.length)];
  }
  return codigo;
}
