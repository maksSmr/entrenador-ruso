import { z } from 'zod';

const texto = (max) => z.string().trim().min(1).max(max);
const email = z.string().trim().toLowerCase().email().max(255);
const contrasena = z.string().min(8).max(128);

export const registroMaestroEsquema = z.object({
  nombre: texto(120),
  email,
  contrasena,
});

export const registroAlumnoEsquema = registroMaestroEsquema.extend({
  codigo_invitacion: z.string().trim().min(6).max(8),
});

export const loginEsquema = z.object({
  email,
  contrasena: z.string().min(1).max(128),
});

export const verificarCorreoEsquema = z.object({
  token: z.string().trim().min(16).max(200),
});

export const reenviarVerificacionEsquema = z.object({ email });

export const olvideContrasenaEsquema = z.object({ email });

export const restablecerContrasenaEsquema = z.object({
  token: z.string().trim().min(16).max(200),
  contrasena,
});

export const crearCursoEsquema = z.object({
  nombre: texto(150),
  idioma: z.string().trim().min(2).max(40).default('ruso'),
  descripcion: z.string().trim().max(500).optional().default(''),
});

export const actualizarCursoEsquema = crearCursoEsquema.partial().refine(
  (datos) => Object.keys(datos).length > 0,
  { message: 'Envía al menos un campo para actualizar' },
);

export const inscribirseEsquema = z.object({
  codigo_invitacion: z.string().trim().min(6).max(8),
});

export const crearLeccionEsquema = z.object({
  titulo: texto(200),
  descripcion: z.string().trim().max(1000).optional().default(''),
  orden: z.number().int().min(0).max(9999).default(0),
  publicada: z.boolean().default(false),
  unidad_libro: z.string().trim().max(60).optional().default(null),
  fecha_asignada: z.coerce.date().optional().nullable().default(null),
});

export const actualizarLeccionEsquema = crearLeccionEsquema.partial().refine(
  (datos) => Object.keys(datos).length > 0,
  { message: 'Envía al menos un campo para actualizar' },
);

export const crearTarjetaEsquema = z.object({
  palabra: texto(200),
  transliteracion: texto(200),
  traduccion: texto(500),
  imagen_url: z.string().trim().url().max(500).nullable().optional().default(null),
  acento_posicion: z.number().int().min(0).max(199).nullable().optional().default(null),
  ejemplo_ruso: z.string().trim().max(500).nullable().optional().default(null),
  ejemplo_traduccion: z.string().trim().max(500).nullable().optional().default(null),
  audio_url: z.string().trim().url().max(500).nullable().optional().default(null),
  nota_gramatical: z.string().trim().max(1000).nullable().optional().default(null),
});

export const actualizarTarjetaEsquema = crearTarjetaEsquema.partial().refine(
  (datos) => Object.keys(datos).length > 0,
  { message: 'Envía al menos un campo para actualizar' },
);

export const respuestaRepasoEsquema = z.object({
  tarjeta_id: z.number().int().positive(),
  acerto: z.boolean(),
});

export const resultadoQuizEsquema = z.object({
  leccion_id: z.number().int().positive(),
  puntaje: z.number().int().min(0),
  total: z.number().int().positive(),
});
