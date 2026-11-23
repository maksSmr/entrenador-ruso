// Error con código HTTP y código de dominio para respuestas JSON uniformes.
export class ErrorApi extends Error {
  constructor(status, mensaje, codigo, detalles) {
    super(mensaje);
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}
