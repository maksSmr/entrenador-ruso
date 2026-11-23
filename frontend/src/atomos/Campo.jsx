export default function Campo({
  id,
  etiqueta,
  tipo = 'text',
  valor,
  onChange,
  error,
  ayuda,
  requerido = false,
  className = '',
  ...props
}) {
  const idError = error ? `${id}-error` : undefined;
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const descritoPor = [idAyuda, idError].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`campo ${className}`.trim()}>
      <label htmlFor={id}>
        {etiqueta}
        {requerido ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        id={id}
        name={id}
        type={tipo}
        value={valor ?? ''}
        onChange={(evento) => onChange && onChange(evento.target.value)}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={descritoPor}
        required={requerido}
        {...props}
      />
      {ayuda ? (
        <p className="campo__ayuda" id={idAyuda}>
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p className="campo__error" id={idError} role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AreaTexto({ id, etiqueta, valor, onChange, error, requerido = false, ...props }) {
  return (
    <div className="campo">
      <label htmlFor={id}>
        {etiqueta}
        {requerido ? <span aria-hidden="true"> *</span> : null}
      </label>
      <textarea
        id={id}
        name={id}
        value={valor ?? ''}
        onChange={(evento) => onChange && onChange(evento.target.value)}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        required={requerido}
        {...props}
      />
      {error ? (
        <p className="campo__error" id={`${id}-error`} role="alert" aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
