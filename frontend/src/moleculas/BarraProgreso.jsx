export default function BarraProgreso({ valor = 0, maximo = 100, etiqueta = 'Progreso' }) {
  const total = Number(maximo) > 0 ? Number(maximo) : 100;
  const actual = Math.max(0, Math.min(Number(valor) || 0, total));
  const porcentaje = Math.round((actual / total) * 100);

  return (
    <div className="barra-progreso">
      <div className="barra-progreso__etiqueta">
        <span>{etiqueta}</span>
        <span>{porcentaje}%</span>
      </div>
      <div
        className="barra-progreso__pista"
        role="progressbar"
        aria-label={etiqueta}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={actual}
      >
        <div className="barra-progreso__relleno" style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  );
}
