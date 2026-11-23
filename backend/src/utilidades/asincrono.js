// Express 4 no captura promesas rechazadas: este envoltorio las pasa al manejador de errores.
export const asincrono = (funcion) => (req, res, next) =>
  Promise.resolve(funcion(req, res, next)).catch(next);
