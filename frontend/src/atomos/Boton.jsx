export default function Boton({
  children,
  variante = 'primario',
  tamano = 'normal',
  cargando = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`boton boton--${variante} boton--${tamano} ${className}`.trim()}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...props}
    >
      {cargando ? <span aria-live="polite">Procesando…</span> : children}
    </button>
  );
}
