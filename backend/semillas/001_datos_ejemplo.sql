-- Datos de ejemplo: dos maestros aislados, tres alumnos y tarjetas en ruso.
-- Ejecutar después de las migraciones 001 a 004. Contraseña de prueba: 123456.
-- Todos los usuarios de ejemplo se marcan verificados para poder entrar sin Resend.

INSERT INTO usuarios (id, nombre, email, contrasena_hash, rol, email_verificado, verificado_en, xp, racha) VALUES
  (1, 'Ana',     'ana@ejemplo.es',     crypt('123456', gen_salt('bf', 10)), 'maestro', true, NOW(), 0,   0),
  (2, 'Borís',   'boris@ejemplo.es',   crypt('123456', gen_salt('bf', 10)), 'maestro', true, NOW(), 0,   0),
  (3, 'Lucía',   'lucia@ejemplo.es',   crypt('123456', gen_salt('bf', 10)), 'alumno',  true, NOW(), 120, 3),
  (4, 'Diego',   'diego@ejemplo.es',   crypt('123456', gen_salt('bf', 10)), 'alumno',  true, NOW(), 60,  1),
  (5, 'Marta',   'marta@ejemplo.es',   crypt('123456', gen_salt('bf', 10)), 'alumno',  true, NOW(), 0,   0);

-- Planes distintos para probar límites más adelante.
INSERT INTO suscripciones (id, maestro_id, plan, estado, proveedor_id) VALUES
  (1, 1, 'gratis', 'activa', 'demo_gratis_ana'),
  (2, 2, 'pro',    'activa', 'demo_pro_boris');

-- Curso 1 pertenece a Ana; curso 2 pertenece a Borís.
INSERT INTO cursos (id, maestro_id, nombre, idioma, descripcion, codigo_invitacion) VALUES
  (1, 1, 'Ruso para principiantes', 'ruso',    'Alfabeto y primeras palabras.',   'RUSO123'),
  (2, 2, 'Inglés de viaje',         'inglés',  'Vocabulario esencial de viaje.',  'VIAJE99');

-- Lucía y Diego están en el curso de Ana; Marta en el de Borís.
INSERT INTO inscripciones (usuario_id, curso_id) VALUES
  (3, 1),
  (4, 1),
  (5, 2);

-- Dos lecciones por curso. La 4 es borrador para probar el filtro de alumnos.
INSERT INTO lecciones (id, curso_id, titulo, descripcion, orden, publicada, unidad_libro, fecha_asignada) VALUES
  (1, 1, 'Alfabeto 1: А–Г',   'Primeras cuatro letras.',        1, true,  'Unidad 1', NOW() - INTERVAL '6 days'),
  (2, 1, 'Alfabeto 2: Д–Ж',   'Cuatro letras siguientes.',      2, true,  'Unidad 1', NOW() - INTERVAL '2 days'),
  (3, 2, 'Saludos',           'Presentarse y saludar.',         1, true,  'Unit 1',   NOW() - INTERVAL '3 days'),
  (4, 2, 'En el aeropuerto',  'Borrador: aún sin publicar.',    2, false, 'Unit 2',   NULL);

-- 8 tarjetas por curso (16 en total) con letras y palabras rusas.
INSERT INTO tarjetas (id, leccion_id, palabra, transliteracion, traduccion, imagen_url, acento_posicion, ejemplo_ruso, ejemplo_traduccion, audio_url) VALUES
  (1,  1, 'А',       'a',     'A',        '/imagenes/a.png',   NULL, NULL,               NULL,           NULL),
  (2,  1, 'Б',       'b',     'B',        NULL,                NULL, NULL,               NULL,           NULL),
  (3,  1, 'В',       'v',     'V',        NULL,                NULL, 'Вот брат.',       'He aquí el hermano.', NULL),
  (4,  1, 'Г',       'g',     'G',        NULL,                NULL, NULL,               NULL,           NULL),
  (5,  2, 'Д',       'd',     'D',        NULL,                NULL, NULL,               NULL,           NULL),
  (6,  2, 'Е',       'ye',    'E',        NULL,                NULL, NULL,               NULL,           NULL),
  (7,  2, 'Ё',       'yo',    'E con diéresis', NULL,          NULL, NULL,               NULL,           NULL),
  (8,  2, 'привет',  'privet','hola',     NULL,                4,    'Привет, Анна!',    '¡Hola, Ana!',  NULL),
  (9,  3, 'hello',   'jélou', 'hola',     NULL,                NULL, 'Hello, my friend.','Hola, amigo.', NULL),
  (10, 3, 'thanks',  'zens',  'gracias',  NULL,                NULL, 'Thanks a lot.',   'Muchas gracias.', NULL),
  (11, 3, 'ticket',  'tíkit', 'billete',  NULL,                NULL, NULL,               NULL,           NULL),
  (12, 3, 'gate',    'géit',  'puerta',   NULL,                NULL, NULL,               NULL,           NULL),
  (13, 4, 'boarding','bórdin','embarque',NULL,                NULL, NULL,               NULL,           NULL),
  (14, 4, 'luggage', 'lágich','equipaje', NULL,                NULL, NULL,               NULL,           NULL),
  (15, 4, 'seat',    'síit',  'asiento',  NULL,                NULL, NULL,               NULL,           NULL),
  (16, 4, 'passport','páspot','pasaporte',NULL,                NULL, NULL,               NULL,           NULL);

-- Progreso Leitner de Lucía: dos tarjetas pendientes hoy o antes.
INSERT INTO progreso_tarjetas (usuario_id, tarjeta_id, caja, proxima_revision) VALUES
  (3, 1, 3, CURRENT_DATE + 4),
  (3, 2, 1, CURRENT_DATE - 1),
  (3, 3, 5, CURRENT_DATE + 15),
  (3, 8, 2, CURRENT_DATE);

INSERT INTO resultados_quiz (id, usuario_id, leccion_id, puntaje, total_preguntas, fecha) VALUES
  (1, 3, 1, 3, 4, NOW() - INTERVAL '2 days'),
  (2, 3, 2, 2, 4, NOW() - INTERVAL '1 day');

SELECT setval(pg_get_serial_sequence('usuarios', 'id'),        (SELECT MAX(id) FROM usuarios));
SELECT setval(pg_get_serial_sequence('suscripciones', 'id'),   (SELECT MAX(id) FROM suscripciones));
SELECT setval(pg_get_serial_sequence('cursos', 'id'),          (SELECT MAX(id) FROM cursos));
SELECT setval(pg_get_serial_sequence('lecciones', 'id'),       (SELECT MAX(id) FROM lecciones));
SELECT setval(pg_get_serial_sequence('tarjetas', 'id'),        (SELECT MAX(id) FROM tarjetas));
SELECT setval(pg_get_serial_sequence('resultados_quiz', 'id'), (SELECT MAX(id) FROM resultados_quiz));
