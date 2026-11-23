export function EstadoCarga({ mensaje = 'Cargando…' }) {
  return (
    <div className="estado" role="status" aria-live="polite">
      <span className="cargador" aria-hidden="true" />
      <p>{mensaje}</p>
    </div>
  );
}

export function EstadoError({ mensaje, onReintentar }) {
  return (
    <div className="aviso aviso--error estado" role="alert" aria-live="assertive">
      <p>
        <strong>⚠ No se pudo cargar la información.</strong> {mensaje}
      </p>
      {onReintentar ? (
        <button type="button" className="enlace-sutil" onClick={onReintentar}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}

export function EstadoVacio({ titulo = 'Todavía no hay nada aquí', mensaje, children }) {
  return (
    <div className="estado estado--vacio">
      <h2>{titulo}</h2>
      {mensaje ? <p className="texto-suave">{mensaje}</p> : null}
      {children}
    </div>
  );
}
