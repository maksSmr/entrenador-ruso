-- El alta ya no exige confirmación por correo.
-- Las cuentas nuevas nacen verificadas y las antiguas dejan de estar bloqueadas.
-- Idempotente: se puede ejecutar más de una vez.

ALTER TABLE usuarios
  ALTER COLUMN email_verificado SET DEFAULT true;

UPDATE usuarios
   SET email_verificado = true,
       verificado_en = COALESCE(verificado_en, NOW())
 WHERE email_verificado = false;
